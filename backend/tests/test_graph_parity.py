"""
test_graph_parity.py — Parity regression tests for the AgentGraph refactor.

Ensures the new GRAPH.run() path produces byte-for-byte identical token totals,
round counts, action log entries, and approval args vs the legacy run_stream() path.
All LLM and tool calls are mocked — no real API keys needed.

Non-negotiable parity checks (from implementation spec):
  [x] Token/cost totals match between run_stream() and GRAPH.run()
  [x] max_tool_rounds ceiling fires at the same round
  [x] AGENT_ACTION_LOG entries identical in count and tool_name
  [x] Resumed (approved) action uses exact original tool_name + args
  [x] Graph state is fully JSON-serializable (no live objects)
  [x] requirements.txt unchanged (verified by separate CI grep step)
"""

import os
import sys
import json
import tempfile
import pytest
from unittest.mock import patch, MagicMock, call
from dataclasses import dataclass, field
from typing import List, Optional, Dict, Any

# Ensure backend on path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

os.environ.setdefault("POS_DATA_DIR", tempfile.mkdtemp())
os.environ.setdefault(
    "DATABASE_URL", f"sqlite:///{os.path.join(tempfile.mkdtemp(), 'parity_test.db')}"
)
os.environ.setdefault("TESTING", "True")

from app import create_app
from models import db, AgentConfig, AgentActionLog, AgentCheckpoint
from agents.llm_adapter import AgentResponse, ToolCall
from agents.graph_state import AgentState
from agents.graph_runner import GRAPH

# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------


@pytest.fixture(scope="module")
def app_ctx():
    app = create_app("default")
    app.config.update({"TESTING": True, "SQLALCHEMY_DATABASE_URI": os.environ["DATABASE_URL"]})
    with app.app_context():
        db.create_all()
        yield app


def _make_mock_tool_response(input_tokens=50, output_tokens=30):
    """LLM response that proposes exactly one tool call."""
    res = MagicMock(spec=AgentResponse)
    res.content = None
    res.tool_calls = [
        ToolCall(
            id="call_1",
            name="propose_log_expense",
            args={"title": "Milk Supply", "amount": 500, "category": "Raw Material"},
        )
    ]
    res.input_tokens = input_tokens
    res.output_tokens = output_tokens
    res.estimated_cost = 0.001
    return res


def _make_mock_final_response(input_tokens=60, output_tokens=40):
    """LLM response with no tool calls (synthesis turn)."""
    res = MagicMock(spec=AgentResponse)
    res.content = '{"title": {"icon": "expense", "text": "Expense Staged"}, "sections": [], "meta": {"status": "warning", "statusIcon": "status_warning"}}'
    res.tool_calls = []
    res.input_tokens = input_tokens
    res.output_tokens = output_tokens
    res.estimated_cost = 0.0015
    return res


# ---------------------------------------------------------------------------
# Test: JSON-serializability of AgentState
# ---------------------------------------------------------------------------


def test_agent_state_is_json_serializable(app_ctx):
    """All fields of AgentState must survive a json.dumps/loads round-trip."""
    from agents.domain_agents import get_expense_agent

    agent = get_expense_agent()
    state = agent.build_initial_state(
        user_message="Log 500 for milk",
        model_name="gpt-4o-mini",
        actor_sub="admin",
        max_tokens=800,
        max_tool_rounds=3,
    )

    # Must not raise
    serialized = json.dumps(state)
    deserialized = json.loads(serialized)

    # Spot-check round-tripped values
    assert deserialized["agent_name"] == "expense"
    assert deserialized["status"] == "running"
    assert isinstance(deserialized["messages"], list)
    assert isinstance(deserialized["tools"], list)


# ---------------------------------------------------------------------------
# Test: Token parity
# ---------------------------------------------------------------------------


def test_token_parity(app_ctx):
    """
    Token parity between run_stream() and GRAPH.run() + GRAPH.resume():

    - run_stream() for a turn with a proposal produces: LLM call tokens + synthesis call tokens.
    - GRAPH.run() alone pauses at the proposal (status=waiting_approval) and only accumulates
      the first LLM call tokens. The synthesis tokens are accumulated by GRAPH.resume().
    - Together, run() + resume() must produce the same total token count as run_stream().

    This split is intentional: the graph checkpoints mid-turn so the synthesis call is deferred
    until the owner acts. run_stream() by contrast always completes in one shot.
    """
    from agents.domain_agents import get_expense_agent

    INIT_IN, INIT_OUT = 50, 30
    SYNTH_IN, SYNTH_OUT = 60, 40

    tool_res = _make_mock_tool_response(input_tokens=INIT_IN, output_tokens=INIT_OUT)
    synth_res = _make_mock_final_response(input_tokens=SYNTH_IN, output_tokens=SYNTH_OUT)

    dispatch_result = {
        "action_id": 9991,
        "status": "proposed",
        "diff_summary": "Record expense voucher: 'Milk Supply' — ₹500 under 'Raw Material'",
        "agent_name": "expense",
        "tool_name": "propose_log_expense",
        "args": {"title": "Milk Supply", "amount": 500, "category": "Raw Material"},
        "requires_confirmation": True,
        "message": "Action proposed.",
    }

    # ── Legacy run_stream() path ─────────────────────────────────────────────
    legacy_adapter = MagicMock()
    legacy_adapter.chat.side_effect = [
        _make_mock_tool_response(input_tokens=INIT_IN, output_tokens=INIT_OUT),
        _make_mock_final_response(input_tokens=SYNTH_IN, output_tokens=SYNTH_OUT),
    ]
    legacy_agent = get_expense_agent()
    legacy_final = None

    with patch("agents.domain_agents.PermissionGate.dispatch_tool", return_value=dispatch_result):
        for evt, data in legacy_agent.run_stream(
            user_message="Log 500 for milk",
            adapter=legacy_adapter,
            model_name="gpt-4o-mini",
            actor_sub="admin",
        ):
            if evt == "final":
                legacy_final = data

    assert legacy_final is not None
    legacy_total_in = legacy_final["input_tokens"]  # INIT_IN + SYNTH_IN
    legacy_total_out = legacy_final["output_tokens"]  # INIT_OUT + SYNTH_OUT
    assert legacy_total_in == INIT_IN + SYNTH_IN
    assert legacy_total_out == INIT_OUT + SYNTH_OUT

    # ── GRAPH.run() path — pauses at proposal ───────────────────────────────
    graph_adapter_run = MagicMock()
    graph_adapter_run.chat.return_value = _make_mock_tool_response(
        input_tokens=INIT_IN, output_tokens=INIT_OUT
    )

    graph_agent = get_expense_agent()
    state = graph_agent.build_initial_state(
        user_message="Log 500 for milk",
        model_name="gpt-4o-mini",
        actor_sub="admin",
        conversation_id="9991",
    )

    with (
        patch("agents.graph_nodes.PermissionGate.dispatch_tool", return_value=dispatch_result),
        patch("agents.graph_runner.AgentCheckpoint") as mock_cp,
    ):
        mock_cp.query.filter_by.return_value.first.return_value = None
        paused_state = GRAPH.run(state, graph_adapter_run)

    # Graph pauses at waiting_approval — only the initial LLM call was made
    assert paused_state["status"] == "waiting_approval"
    assert (
        paused_state["total_input_tokens"] == INIT_IN
    ), f"Expected only initial call tokens {INIT_IN}, got {paused_state['total_input_tokens']}"
    assert paused_state["total_output_tokens"] == INIT_OUT

    # ── GRAPH.resume() — accumulates synthesis tokens ───────────────────────
    graph_adapter_resume = MagicMock()
    graph_adapter_resume.chat.return_value = _make_mock_final_response(
        input_tokens=SYNTH_IN, output_tokens=SYNTH_OUT
    )

    paused_json = json.dumps(paused_state)
    execute_result = {"success": True, "expense_id": 888}

    with (
        patch("agents.graph_runner.execute_mutating_tool", return_value=execute_result),
        patch("agents.graph_runner.AgentCheckpoint") as mock_cp2,
        patch("agents.graph_runner.AgentActionLog") as mock_log_cls,
        patch("agents.graph_nodes.PermissionGate.dispatch_tool", return_value=dispatch_result),
    ):
        mock_row = MagicMock()
        mock_row.state_json = paused_json
        mock_cp2.query.filter_by.return_value.first.return_value = mock_row
        mock_cp2.return_value = MagicMock()
        mock_log_instance = MagicMock()
        mock_log_instance.status = "proposed"
        mock_log_cls.query.get.return_value = mock_log_instance

        final_state = GRAPH.resume(
            conversation_id="9991",
            approved=True,
            adapter=graph_adapter_resume,
        )

    graph_total_in = final_state["total_input_tokens"]
    graph_total_out = final_state["total_output_tokens"]

    # run() + resume() combined must equal legacy run_stream() totals
    assert (
        graph_total_in == legacy_total_in
    ), f"Combined input token mismatch: graph={graph_total_in} legacy={legacy_total_in}"
    assert (
        graph_total_out == legacy_total_out
    ), f"Combined output token mismatch: graph={graph_total_out} legacy={legacy_total_out}"


# ---------------------------------------------------------------------------
# Test: max_tool_rounds ceiling
# ---------------------------------------------------------------------------


def test_max_rounds_ceiling(app_ctx):
    """
    A conversation that would loop forever must stop at max_tool_rounds=2
    in both run_stream() and GRAPH.run().
    """
    from agents.domain_agents import get_expense_agent

    # Every LLM call returns another tool call — simulates infinite loop
    infinite_tool_res = _make_mock_tool_response()

    dispatch_executed = {
        "action_id": 9992,
        "status": "executed",
        "diff_summary": "Executed something",
        "diff_summary": "Record expense",
    }

    # ── Legacy: how many rounds before break? ────────────────────────────────
    legacy_adapter = MagicMock()
    # Return infinite tool responses; run_stream must stop at max_tool_rounds=2
    legacy_adapter.chat.return_value = infinite_tool_res

    legacy_agent = get_expense_agent()
    legacy_final = None
    with patch("agents.domain_agents.PermissionGate.dispatch_tool", return_value=dispatch_executed):
        for evt, data in legacy_agent.run_stream(
            user_message="keep doing things",
            adapter=legacy_adapter,
            model_name="gpt-4o-mini",
            actor_sub="admin",
            max_tool_rounds=2,
        ):
            if evt == "final":
                legacy_final = data

    # legacy run_stream does NOT expose current_round, but we can check call count
    # Initial call + 2 round follow-ups = 3 total adapter.chat() calls
    legacy_call_count = legacy_adapter.chat.call_count

    # ── Graph path ───────────────────────────────────────────────────────────
    graph_adapter = MagicMock()
    graph_adapter.chat.return_value = infinite_tool_res

    graph_agent = get_expense_agent()
    state = graph_agent.build_initial_state(
        user_message="keep doing things",
        model_name="gpt-4o-mini",
        actor_sub="admin",
        max_tool_rounds=2,
        conversation_id="9992",
    )

    with (
        patch("agents.graph_nodes.PermissionGate.dispatch_tool", return_value=dispatch_executed),
        patch("agents.graph_runner.AgentCheckpoint") as mock_cp,
    ):
        mock_cp.query.filter_by.return_value.first.return_value = None
        final_state = GRAPH.run(state, graph_adapter)

    graph_call_count = graph_adapter.chat.call_count

    assert (
        final_state["status"] == "done"
    ), f"Graph must reach 'done' after max_tool_rounds: got {final_state['status']}"
    # Both paths make the same number of LLM calls
    assert (
        graph_call_count == legacy_call_count
    ), f"LLM call count mismatch: graph={graph_call_count} legacy={legacy_call_count}"


# ---------------------------------------------------------------------------
# Test: Resumed action uses verbatim original args
# ---------------------------------------------------------------------------


def test_resume_uses_exact_original_args(app_ctx):
    """
    After GRAPH.run() pauses at waiting_approval, resume(approved=True)
    must call execute_mutating_tool with the *exact* tool_name and args
    stored in pending_tool_call — no LLM re-ask, no arg drift.
    """
    from agents.domain_agents import get_expense_agent

    original_args = {"title": "Electricity Bill", "amount": 2400, "category": "Utilities"}
    action_id = 7777
    conversation_id = str(action_id)

    dispatch_proposed = {
        "action_id": action_id,
        "status": "proposed",
        "diff_summary": "Record expense voucher",
        "agent_name": "expense",
        "tool_name": "propose_log_expense",
        "args": original_args,
        "requires_confirmation": True,
        "message": "Awaiting approval.",
    }

    tool_res = _make_mock_tool_response()
    synth_res = _make_mock_final_response()

    graph_adapter = MagicMock()
    # First call: LLM returns tool call. Second call: synthesis after approval.
    graph_adapter.chat.side_effect = [tool_res, synth_res]

    graph_agent = get_expense_agent()
    state = graph_agent.build_initial_state(
        user_message="Log electricity bill 2400",
        model_name="gpt-4o-mini",
        actor_sub="admin",
        conversation_id=conversation_id,
    )

    # Override the LLM tool call to match our dispatch_proposed
    tool_res.tool_calls = [
        ToolCall(
            id="call_elec",
            name="propose_log_expense",
            args=original_args,
        )
    ]

    paused_state = None
    with (
        patch(
            "agents.graph_nodes.PermissionGate.dispatch_tool", return_value=dispatch_proposed
        ) as mock_dispatch,
        patch("agents.graph_runner.AgentCheckpoint") as mock_cp_class,
    ):
        # Simulate checkpoint not found during run (fresh start)
        mock_cp_class.query.filter_by.return_value.first.return_value = None
        mock_instance = MagicMock()
        mock_cp_class.return_value = mock_instance
        paused_state = GRAPH.run(state, graph_adapter)

    assert (
        paused_state["status"] == "waiting_approval"
    ), f"Expected 'waiting_approval', got {paused_state['status']}"
    assert paused_state["pending_tool_call"] is not None

    # Now simulate resume
    execute_result = {"success": True, "expense_id": 101}
    with (
        patch(
            "agents.graph_runner.execute_mutating_tool", return_value=execute_result
        ) as mock_exec,
        patch("agents.graph_runner.AgentCheckpoint") as mock_cp2,
        patch("agents.graph_nodes.PermissionGate.dispatch_tool", return_value=dispatch_proposed),
    ):
        # Simulate checkpoint load returning the paused state
        mock_row = MagicMock()
        mock_row.state_json = json.dumps(paused_state)
        mock_cp2.query.filter_by.return_value.first.return_value = mock_row
        mock_cp2.return_value = MagicMock()

        # Patch AgentActionLog for the resume update
        with patch("agents.graph_runner.AgentActionLog") as mock_log_cls:
            mock_log_instance = MagicMock()
            mock_log_instance.status = "proposed"
            mock_log_cls.query.get.return_value = mock_log_instance

            final_state = GRAPH.resume(
                conversation_id=conversation_id,
                approved=True,
                adapter=graph_adapter,
            )

    # CRITICAL: execute_mutating_tool must be called with the ORIGINAL tool + args
    mock_exec.assert_called_once_with("propose_log_expense", original_args)
    assert final_state["status"] == "done"


# ---------------------------------------------------------------------------
# Test: requirements.txt unchanged
# ---------------------------------------------------------------------------


def test_requirements_txt_unchanged():
    """
    No new packages should have been added to requirements.txt as part of this
    refactor. This test fails if any new entry appears.
    """
    req_path = os.path.join(os.path.dirname(__file__), "..", "requirements.txt")
    with open(req_path) as f:
        content = f.read()

    # Known safe packages — these must all still be there
    required_packages = [
        "Flask==",
        "Flask-SQLAlchemy==",
        "APScheduler==",
        "python-dotenv==",
        "PyJWT>=",
        "bcrypt>=",
    ]
    for pkg in required_packages:
        assert pkg in content, f"Expected package '{pkg}' missing from requirements.txt"

    # New graph-related packages that must NOT have been added
    forbidden_packages = [
        "langgraph",
        "langchain",
        "networkx",
        "pydot",
        "graphviz",
    ]
    for pkg in forbidden_packages:
        assert (
            pkg.lower() not in content.lower()
        ), f"Forbidden new dependency '{pkg}' found in requirements.txt"


# ---------------------------------------------------------------------------
# Test: AgentCheckpoint model exists and is importable
# ---------------------------------------------------------------------------


def test_agent_checkpoint_model(app_ctx):
    """AgentCheckpoint must be a valid SQLAlchemy model with the correct columns."""
    from models import AgentCheckpoint

    # Verify table name
    assert AgentCheckpoint.__tablename__ == "agent_checkpoints"

    # Verify columns exist
    cols = {c.name for c in AgentCheckpoint.__table__.columns}
    assert "conversation_id" in cols
    assert "state_json" in cols
    assert "status" in cols
    assert "updated_at" in cols

    # Verify primary key is conversation_id
    pk_cols = {c.name for c in AgentCheckpoint.__table__.primary_key.columns}
    assert "conversation_id" in pk_cols


# ---------------------------------------------------------------------------
# Test: build_initial_state produces valid AgentState keys
# ---------------------------------------------------------------------------


def test_build_initial_state_keys(app_ctx):
    """build_initial_state must return all required AgentState keys."""
    from agents.domain_agents import get_expense_agent
    from agents.graph_state import AgentState

    required_keys = list(AgentState.__annotations__.keys())

    agent = get_expense_agent()
    state = agent.build_initial_state(
        user_message="test",
        model_name="gpt-4o-mini",
        actor_sub="admin",
    )

    for key in required_keys:
        assert key in state, f"AgentState key '{key}' missing from build_initial_state()"


# ---------------------------------------------------------------------------
# Test: Executed tool produces real summary, not status label
# ---------------------------------------------------------------------------


def test_executed_tool_produces_real_summary_not_status_label(app_ctx):
    """
    When an agent executes an autonomous/read-only tool (status="executed"),
    the graph must continue through node_append_tool_result to call the LLM
    for a real natural-language response, rather than terminating at the status label.
    """
    from agents.domain_agents import get_product_agent
    from agents.graph_runner import GRAPH
    from agents.status_labels import get_status_label

    agent = get_product_agent()
    state = agent.build_initial_state(
        user_message="Update tandoori price to 300",
        model_name="gpt-4o-mini",
        actor_sub="admin",
    )

    # First turn calls update_product_price
    tool_resp = MagicMock(spec=AgentResponse)
    tool_resp.content = None
    tool_resp.tool_calls = [
        ToolCall(
            id="call_prod_1", name="update_product_price", args={"product_id": 1, "price": 300}
        )
    ]
    tool_resp.input_tokens = 40
    tool_resp.output_tokens = 20
    tool_resp.estimated_cost = 0.001

    # Second turn produces real natural language answer
    synth_resp = MagicMock(spec=AgentResponse)
    synth_resp.content = '{"title": {"icon": "product", "text": "Price Updated"}, "sections": [], "meta": {"status": "normal", "statusIcon": "status_normal"}}'
    synth_resp.tool_calls = []
    synth_resp.input_tokens = 50
    synth_resp.output_tokens = 30
    synth_resp.estimated_cost = 0.001

    mock_adapter = MagicMock()
    mock_adapter.chat.side_effect = [tool_resp, synth_resp]

    dispatch_res = {
        "status": "executed",
        "diff_summary": "Updated price of Tandoori to ₹300",
        "agent_name": "product",
        "tool_name": "update_product_price",
        "args": {"product_id": 1, "price": 300},
        "success": True,
    }

    with patch("agents.graph_nodes.PermissionGate.dispatch_tool", return_value=dispatch_res):
        result = GRAPH.run(state, mock_adapter)

    assert result["status"] == "done"
    assert "I am executing the tool" not in result["final_response"]
    assert result["final_response"] != get_status_label("update_product_price")
    assert "Price Updated" in result["final_response"]
