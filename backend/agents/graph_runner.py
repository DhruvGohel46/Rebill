"""
AgentGraph — a minimal, dependency-free state graph runner with SQLite checkpointing.

Design principles:
  - No new pip dependencies. Uses only stdlib + SQLAlchemy (already present).
  - State (AgentState TypedDict) is fully JSON-serializable at all times.
  - The LLMAdapter is injected at run/resume time; it is never stored in state.
  - One checkpoint row per in-flight conversation, keyed by conversation_id
    (== str(AgentActionLog.id) of the first pending action this turn).
  - The graph itself has zero awareness of roles, kill switches, or LLM config.
    Those checks stay entirely at the route/middleware layer, unchanged.
  - Node functions are pure: (state, adapter) -> (next_node_name | None, state).

Graph topology:
    call_llm → check_tool_calls → dispatch_tool → append_tool_result
                     ↑                                     |
                     └─────────────────────────────────────┘
    (dispatch_tool pauses at status="waiting_approval")
    (check_tool_calls stops at status="done" | no tool calls)
"""

import json
import logging
from dataclasses import dataclass
from datetime import datetime
from typing import Callable, Dict, Optional, Tuple

from agents.graph_state import AgentState
from agents.llm_adapter import LLMAdapter
from agents.graph_nodes import (
    node_call_llm,
    node_check_tool_calls,
    node_dispatch_tool,
    node_append_tool_result,
)
from agents.tools import execute_mutating_tool
from models import db, AgentCheckpoint, AgentActionLog

_log = logging.getLogger(__name__)

# Type alias for node functions
NodeFn = Callable[[AgentState, LLMAdapter], Tuple[Optional[str], AgentState]]

_STOP_STATUSES = {"waiting_approval", "done", "error"}


@dataclass
class GraphNode:
    name: str
    fn: NodeFn


class AgentGraph:
    """Minimal state-machine runner with SQLite persistence."""

    def __init__(self, nodes: Dict[str, GraphNode], entry: str):
        self.nodes = nodes
        self.entry = entry

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def run(self, state: AgentState, adapter: LLMAdapter) -> AgentState:
        """
        Execute the graph from state["current_node"] (default: entry node).
        Stops when status reaches a terminal value and saves a checkpoint.
        Returns the final AgentState.
        """
        node_name = state.get("current_node") or self.entry

        while True:
            node = self.nodes.get(node_name)
            if node is None:
                _log.error("AgentGraph: unknown node '%s' — stopping", node_name)
                state["status"] = "error"
                state["error"] = f"Internal graph error: unknown node '{node_name}'"
                break

            _log.debug("AgentGraph: entering node '%s'", node_name)
            next_node, state = node.fn(state, adapter)

            if state["status"] in _STOP_STATUSES:
                # Record the node we'd resume at (for waiting_approval, this is
                # set by dispatch_tool itself; for done/error we just record current)
                if state["status"] != "waiting_approval":
                    state["current_node"] = node_name
                self._save_checkpoint(state)
                break

            if next_node is None:
                # Node returned None next but didn't set a terminal status
                _log.warning(
                    "AgentGraph: node '%s' returned None next_node without terminal status",
                    node_name,
                )
                state["status"] = "done"
                self._save_checkpoint(state)
                break

            node_name = next_node

        return state

    def resume(
        self,
        conversation_id: str,
        approved: bool,
        adapter: LLMAdapter,
    ) -> AgentState:
        """
        Resume a graph that paused at status="waiting_approval".

        If approved=True:
          - Execute the originally proposed tool call verbatim (no LLM re-ask).
          - Append the execution result as a tool message.
          - Continue graph from append_tool_result.

        If approved=False:
          - Skip execution.
          - Append a rejection notice as a user message.
          - Continue graph from append_tool_result.

        Raises ValueError if the checkpoint is not in waiting_approval status.
        """
        state = self._load_checkpoint(conversation_id)

        if state["status"] != "waiting_approval":
            raise ValueError(
                f"Checkpoint {conversation_id!r} has status={state['status']!r}, "
                "expected 'waiting_approval'."
            )

        pending = state["pending_tool_call"]
        if not pending:
            raise ValueError(f"Checkpoint {conversation_id!r} has no pending_tool_call to resume.")

        original_tc = pending.get("_tc", {})
        tool_name = original_tc.get("name") or pending.get("tool_name", "unknown_tool")
        tool_args = original_tc.get("args") or pending.get("args", {})
        tool_id = original_tc.get("id") or ""

        import json as _json

        if approved:
            # Execute the exact tool call that was originally proposed — verbatim,
            # using the stored args. No LLM re-invocation. (Parity requirement.)
            exec_res = execute_mutating_tool(tool_name, tool_args)

            # Update the AgentActionLog entry that was created by PermissionGate
            action_id = pending.get("action_id")
            if action_id:
                try:
                    action_log = AgentActionLog.query.get(action_id)

                    if action_log and action_log.status == "proposed":
                        action_log.status = "executed" if exec_res.get("success") else "failed"
                        action_log.result_summary = _json.dumps(exec_res)
                        action_log.execution_timestamp = datetime.now()
                        action_log.updated_at = datetime.now()
                        entity_id = (
                            exec_res.get("expense_id")
                            or exec_res.get("product_id")
                            or exec_res.get("worker_id")
                            or exec_res.get("bill_no")
                            or exec_res.get("reminder_id")
                            or exec_res.get("category_id")
                            or exec_res.get("group_id")
                        )
                        if entity_id:
                            action_log.affected_entity_id = str(entity_id)
                        db.session.commit()
                except Exception as log_err:
                    _log.error("Failed to update AgentActionLog on resume: %s", log_err)

            state["executed_actions"].append({**exec_res, "action_id": action_id})

            # Append the tool result message for the synthesis LLM turn
            tool_result_content = _json.dumps(exec_res)
        else:
            # Rejection: don't execute, append rejection notice
            action_id = pending.get("action_id")
            if action_id:
                try:
                    action_log = AgentActionLog.query.get(action_id)
                    if action_log and action_log.status == "proposed":
                        action_log.status = "rejected"
                        action_log.updated_at = datetime.now()
                        db.session.commit()
                except Exception as log_err:
                    _log.error("Failed to mark AgentActionLog rejected on resume: %s", log_err)

            diff_summary = pending.get("diff_summary", "action")
            tool_result_content = _json.dumps(
                {
                    "status": "rejected",
                    "message": f"[Action rejected by owner: {diff_summary}]",
                }
            )

        # Flush the pending tool message into _pending_tool_messages so
        # append_tool_result can construct follow_up_messages correctly.
        tool_msg = {
            "role": "tool",
            "name": tool_name,
            "tool_call_id": tool_id,
            "content": tool_result_content,
        }
        pending_msgs = state.get("_pending_tool_messages") or []
        pending_msgs.append(tool_msg)
        state["_pending_tool_messages"] = pending_msgs

        # Clear approval gate and pending actions queue
        state["pending_tool_call"] = None
        state["pending_actions"] = []
        state["status"] = "running"

        # If there are still undispatched tool calls in this round, we must
        # dispatch them first before synthesizing. Otherwise go straight to
        # append_tool_result.
        remaining = state.get("tool_calls_pending") or []
        if remaining:
            state["current_node"] = "dispatch_tool"
        else:
            state["current_node"] = "append_tool_result"

        return self.run(state, adapter)

    # ------------------------------------------------------------------
    # Checkpoint persistence
    # ------------------------------------------------------------------

    def _save_checkpoint(self, state: AgentState) -> None:
        """
        UPSERT AgentCheckpoint row keyed by conversation_id.
        One row per in-flight conversation — never one row per turn.
        """
        if not state.get("conversation_id"):
            # No conversation_id yet (no tool was proposed this turn) — skip
            return
        try:
            state_json = json.dumps(state)
            existing = AgentCheckpoint.query.filter_by(
                conversation_id=state["conversation_id"]
            ).first()

            if existing:
                existing.state_json = state_json
                existing.status = state["status"]
            else:
                checkpoint = AgentCheckpoint(
                    conversation_id=state["conversation_id"],
                    state_json=state_json,
                    status=state["status"],
                )
                db.session.add(checkpoint)

            db.session.commit()
            _log.debug(
                "Checkpoint saved: conversation_id=%s status=%s",
                state["conversation_id"],
                state["status"],
            )
        except Exception as e:
            # Non-fatal: log and continue. The graph result is still returned
            # to the caller even if persistence fails.
            _log.error("Failed to save AgentGraph checkpoint: %s", e)

    def _load_checkpoint(self, conversation_id: str) -> AgentState:
        """Load an AgentCheckpoint row and deserialize to AgentState."""
        try:
            row = AgentCheckpoint.query.filter_by(conversation_id=conversation_id).first()
            if not row:
                raise ValueError(
                    f"No AgentCheckpoint found for conversation_id={conversation_id!r}"
                )
            return json.loads(row.state_json)
        except ValueError:
            raise
        except Exception as e:
            raise ValueError(f"Failed to load AgentCheckpoint {conversation_id!r}: {e}") from e


# ---------------------------------------------------------------------------
# Wire the graph — pre-built singleton
# ---------------------------------------------------------------------------

GRAPH = AgentGraph(
    nodes={
        "call_llm": GraphNode("call_llm", node_call_llm),
        "check_tool_calls": GraphNode("check_tool_calls", node_check_tool_calls),
        "dispatch_tool": GraphNode("dispatch_tool", node_dispatch_tool),
        "append_tool_result": GraphNode("append_tool_result", node_append_tool_result),
    },
    entry="call_llm",
)
"""
Pre-wired graph singleton used by DomainAgent.run_graph() and the approve/reject routes.

The graph topology is intentionally domain-agnostic:
  - `domain` and `agent_name` in AgentState are informational only.
  - A future cross-domain orchestrator can express multi-domain flows as one
    bigger graph with domain-specific subgraphs as nodes, without rewriting this runner.
"""
