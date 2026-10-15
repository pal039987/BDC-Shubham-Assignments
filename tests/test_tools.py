import pytest
from src.tools import ShopSphereTools, ToolContext

@pytest.fixture
def tools():
    return ShopSphereTools()

def test_get_order_existing(tools):
    res = tools.get_order("ORD-1001")
    assert res["found"] is True
    assert res["order"]["order_id"] == "ORD-1001"
    assert res["order"]["customer_id"] == "C101"

def test_get_order_not_found(tools):
    res = tools.get_order("ORD-NONEXISTENT")
    assert res["found"] is False
    assert "not found" in res["error"]

def test_get_customer_existing(tools):
    res = tools.get_customer("C105")
    assert res["found"] is True
    assert res["customer_id"] == "C105"
    assert "fraud_review" in res["flags"]

def test_get_customer_not_found(tools):
    res = tools.get_customer("C-NONEXISTENT")
    assert res["found"] is False

def test_search_policy_returns_sources(tools):
    passages = tools.search_policy("refund claim window 15 days")
    assert len(passages) > 0
    assert any("refund_policy" in p["source"] for p in passages)
    assert "passage" in passages[0]

def test_escalate_to_human(tools, tmp_path):
    ctx = ToolContext(run_id="test_run", db_path=tmp_path / "test.db")
    res = tools.escalate_to_human("T-TEST", "Summary", "fraud_review", ctx=ctx)
    assert res["success"] is True
    assert len(ctx.escalations) == 1
    assert ctx.escalations[0]["ticket_id"] == "T-TEST"
