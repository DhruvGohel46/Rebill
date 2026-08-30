"""
AgentState — the single source of truth for a graph execution turn.

Every field MUST be JSON-serializable (no live LLMAdapter, no raw exceptions —
store str(e) for errors). The entire dict is written verbatim to SQLite on every
graph pause (waiting_approval / done / error) so resuming a suspended execution
only requires loading this row.

Keying strategy: conversation_id == str(AgentActionLog.id) of the pending action.
This means no frontend change is required — the existing action_id round-trip is
reused. The graph checkpoint is created the first time a tool call is proposed
(status="proposed") and keyed off that action's ID.
"""

from typing import TypedDict, Literal, Optional, List, Dict, Any


class AgentState(TypedDict):
    # ── Identity ─────────────────────────────────────────────────────────────
    conversation_id: str  # str(AgentActionLog.id) of first pending action this turn
    domain: str  # e.g. "expense", "inventory" — informational, graph-agnostic
    agent_name: str  # same as domain for now; distinct for future subgraph nesting
    actor_sub: str  # identity of the requesting user (e.g. "admin")
    user_message: str  # original user prompt — kept for PermissionGate & audit

    # ── LLM configuration (serialized scalars, no live objects) ──────────────
    model_name: str
    max_tokens: int
    max_tool_rounds: int
    tools: List[Dict[str, Any]]  # serialized tool schemas passed to adapter.chat()

    # ── Message history (full LLM context for this turn) ────────────────────
    messages: List[Dict[str, Any]]

    # ── Execution cursor ────────────────────────────────────────────────────
    current_round: int
    current_node: str  # node name to re-enter at on resume
    tool_calls_pending: List[Dict[str, Any]]  # un-dispatched tool calls from last LLM resp
    # each: {id, name, args}

    # ── Last LLM response (serialized, not the live AgentResponse object) ──
    last_llm_response_content: Optional[str]  # res.content

    # ── Approval gate ───────────────────────────────────────────────────────
    pending_tool_call: Optional[Dict[str, Any]]  # the one dispatch_res blocked on approval

    # ── Step tracking (mirrors existing `steps` list for status streaming) ─
    steps: List[Dict[str, Any]]  # {title, details, tool, status}

    # ── Action tracking ─────────────────────────────────────────────────────
    executed_actions: List[Dict[str, Any]]
    pending_actions: List[Dict[str, Any]]  # mirrored for final payload compatibility

    # ── Token / cost accumulation ───────────────────────────────────────────
    total_input_tokens: int
    total_output_tokens: int
    total_estimated_cost: float

    # ── Terminal state ───────────────────────────────────────────────────────
    status: Literal["running", "waiting_approval", "done", "error"]
    final_response: Optional[str]
    error: Optional[str]  # str(e) — never a raw exception object
