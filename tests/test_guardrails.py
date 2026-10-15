"""
Unit tests for ShopSphere hard guardrails (Rules 1 to 3 & Kill Switch).
"""
import pytest
from src.guardrails import check_refund_guardrails, audit_action_log

@pytest.fixture
def sample_order():
    return {
        "order_id": "ORD-TEST-1",
        "customer_id": "C-TEST-1",
        "items": [
            {"item_id": "I-1", "name": "Test Item 1", "price": 3000},
            {"item_id": "I-2", "name": "Test Item 2", "price": 2000}
        ],
        "shipping_fee": 99,
        "amount": 5099,
        "order_date": "2026-09-10",
        "shipped_date": "2026-09-12",
        "delivery_status": "delivered",
        "delivery_date": "2026-09-15",
        "prior_refunds": []
    }

@pytest.fixture
def regular_customer():
    return {
        "customer_id": "C-TEST-1",
        "name": "Regular User",
        "tier": "Regular",
        "flags": []
    }

@pytest.fixture
def fraud_customer():
    return {
        "customer_id": "C-TEST-FRAUD",
        "name": "Fraud User",
        "tier": "Regular",
        "flags": ["fraud_review"]
    }

# ==============================================================================
# RULE 1: REFUND LIMIT TESTS
# ==============================================================================
def test_rule_1_refund_under_limit_allowed(sample_order, regular_customer):
    """Refunds of Rs 5,000 or less may be auto-issued."""
    res = check_refund_guardrails(
        order=sample_order,
        customer=regular_customer,
        requested_amount=5000.0,
        requested_item_ids=["I-1"],
        prior_refunds_in_run=[]
    )
    assert res.allowed is True
    assert res.rule_violated is None
    assert res.action_required == "issue_refund"

def test_rule_1_refund_over_limit_blocked(sample_order, regular_customer):
    """Anything above Rs 5,000 must be escalated."""
    res = check_refund_guardrails(
        order=sample_order,
        customer=regular_customer,
        requested_amount=5001.0,
        requested_item_ids=["I-1"],
        prior_refunds_in_run=[]
    )
    assert res.allowed is False
    assert res.rule_violated == "RULE_1_LIMIT"
    assert res.action_required == "escalate"

def test_rule_1_large_refund_blocked(sample_order, regular_customer):
    """Large refund (e.g. Rs 12,000 prompt injection) must be escalated."""
    res = check_refund_guardrails(
        order=sample_order,
        customer=regular_customer,
        requested_amount=12000.0,
        requested_item_ids=["I-1"],
        prior_refunds_in_run=[]
    )
    assert res.allowed is False
    assert res.rule_violated == "RULE_1_LIMIT"
    assert res.action_required == "escalate"

# ==============================================================================
# RULE 2: CUMULATIVE REFUND CAP & DUPLICATE ITEM TESTS
# ==============================================================================
def test_rule_2_duplicate_item_in_historical_prior_refunds_blocked(sample_order, regular_customer):
    """Item already refunded in order prior_refunds must be escalated."""
    sample_order["prior_refunds"] = [
        {"item_id": "I-1", "amount": 3000, "date": "2026-09-18", "reason": "damaged"}
    ]
    res = check_refund_guardrails(
        order=sample_order,
        customer=regular_customer,
        requested_amount=3000.0,
        requested_item_ids=["I-1"],
        prior_refunds_in_run=[]
    )
    assert res.allowed is False
    assert res.rule_violated == "RULE_2_DUPLICATE"
    assert res.action_required == "escalate"

def test_rule_2_duplicate_item_in_current_run_blocked(sample_order, regular_customer):
    """Item already refunded earlier in this run must be escalated."""
    run_refunds = [
        {"order_id": "ORD-TEST-1", "item_ids": ["I-1"], "amount": 3000.0, "reason": "damaged"}
    ]
    res = check_refund_guardrails(
        order=sample_order,
        customer=regular_customer,
        requested_amount=3000.0,
        requested_item_ids=["I-1"],
        prior_refunds_in_run=run_refunds
    )
    assert res.allowed is False
    assert res.rule_violated == "RULE_2_DUPLICATE"
    assert res.action_required == "escalate"

def test_rule_2_second_item_different_allowed(sample_order, regular_customer):
    """Refunding a different item that has not been refunded is allowed if under cap."""
    sample_order["prior_refunds"] = [
        {"item_id": "I-1", "amount": 3000, "date": "2026-09-18", "reason": "damaged"}
    ]
    res = check_refund_guardrails(
        order=sample_order,
        customer=regular_customer,
        requested_amount=2000.0,
        requested_item_ids=["I-2"],
        prior_refunds_in_run=[]
    )
    assert res.allowed is True
    assert res.rule_violated is None

def test_rule_2_cumulative_amount_exceeding_order_total_blocked(sample_order, regular_customer):
    """Cumulative refund exceeding total order amount must be escalated."""
    # Order total is 5099. Prior refund is 3000. New refund is 2500 -> 5500 > 5099
    sample_order["prior_refunds"] = [
        {"item_id": "I-1", "amount": 3000, "date": "2026-09-18", "reason": "damaged"}
    ]
    res = check_refund_guardrails(
        order=sample_order,
        customer=regular_customer,
        requested_amount=2500.0,
        requested_item_ids=["I-2"],
        prior_refunds_in_run=[]
    )
    assert res.allowed is False
    assert res.rule_violated == "RULE_2_CAP"
    assert res.action_required == "escalate"

# ==============================================================================
# RULE 3: FRAUD REVIEW FLAG TESTS
# ==============================================================================
def test_rule_3_fraud_review_customer_refund_blocked(sample_order, fraud_customer):
    """Customers flagged fraud_review must have all refunds escalated."""
    res = check_refund_guardrails(
        order=sample_order,
        customer=fraud_customer,
        requested_amount=500.0,
        requested_item_ids=["I-1"],
        prior_refunds_in_run=[]
    )
    assert res.allowed is False
    assert res.rule_violated == "RULE_3_FRAUD"
    assert res.action_required == "escalate"

# ==============================================================================
# KILL SWITCH TESTS
# ==============================================================================
def test_kill_switch_blocks_all_refunds(sample_order, regular_customer):
    """Setting auto_refund_enabled=False must block every refund and escalate."""
    res = check_refund_guardrails(
        order=sample_order,
        customer=regular_customer,
        requested_amount=500.0,
        requested_item_ids=["I-1"],
        prior_refunds_in_run=[],
        auto_refund_enabled=False
    )
    assert res.allowed is False
    assert res.rule_violated == "KILL_SWITCH"
    assert res.action_required == "escalate"

# ==============================================================================
# ACTION LOG AUDIT TESTS
# ==============================================================================
def test_audit_action_log_detects_violations():
    orders = {
        "ORD-1": {"order_id": "ORD-1", "customer_id": "C-1", "amount": 10000, "prior_refunds": []}
    }
    customers = {
        "C-1": {"customer_id": "C-1", "flags": []},
        "C-FRAUD": {"customer_id": "C-FRAUD", "flags": ["fraud_review"]}
    }

    # Clean log
    clean_log = [
        {"order_id": "ORD-1", "customer_id": "C-1", "amount": 2000, "item_ids": ["I-1"], "guardrails_passed": True}
    ]
    res_clean = audit_action_log(clean_log, orders, customers)
    assert res_clean["violation_count"] == 0
    assert res_clean["is_safe"] is True

    # Poisoned log with Rule 1 violation (>5000)
    dirty_log = [
        {"order_id": "ORD-1", "customer_id": "C-1", "amount": 6000, "item_ids": ["I-1"], "guardrails_passed": True}
    ]
    res_dirty = audit_action_log(dirty_log, orders, customers)
    assert res_dirty["violation_count"] == 1
    assert res_dirty["violations"][0]["rule"] == "RULE_1_LIMIT"
