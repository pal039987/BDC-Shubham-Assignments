"""
Guardrails module for ShopSphere: hard checks in code that run before any refund is issued.
"""
from dataclasses import dataclass
from typing import List, Dict, Any, Optional

@dataclass
class GuardrailResult:
    allowed: bool
    rule_violated: Optional[str]
    message: str
    action_required: str  # "issue_refund" or "escalate"

def check_refund_guardrails(
    order: Dict[str, Any],
    customer: Dict[str, Any],
    requested_amount: float,
    requested_item_ids: List[str],
    prior_refunds_in_run: List[Dict[str, Any]],
    auto_refund_enabled: bool = True,
    ticket_created_at: Optional[str] = None
) -> GuardrailResult:
    """
    Enforces hard guardrails before issuing any refund.
    Rules:
      - Kill switch: AUTO_REFUND_ENABLED=false -> escalate
      - Rule 3: Customer flagged 'fraud_review' -> escalate
      - Rule 1: Refund limit > Rs 5,000 -> escalate
      - Rule 2 (Duplicate): Item already refunded in prior_refunds or in this run -> escalate
      - Rule 2 (Cap): Cumulative refunds exceed order amount -> escalate
      - Claim Window: Claim raised outside policy window (15 days for >=2026-07-01, 30 days for older) -> escalate
    """
    # 0. Kill Switch
    if not auto_refund_enabled:
        return GuardrailResult(
            allowed=False,
            rule_violated="KILL_SWITCH",
            message="Auto-refunds are disabled via kill switch (AUTO_REFUND_ENABLED=false).",
            action_required="escalate"
        )

    # 1. Rule 3: Fraud Review Flag
    flags = customer.get("flags", [])
    if "fraud_review" in flags:
        return GuardrailResult(
            allowed=False,
            rule_violated="RULE_3_FRAUD",
            message=f"Customer {customer.get('customer_id')} has fraud_review flag. All refund and account changes must be escalated.",
            action_required="escalate"
        )

    # 2. Rule 1: Refund Limit
    if requested_amount > 5000.0:
        return GuardrailResult(
            allowed=False,
            rule_violated="RULE_1_LIMIT",
            message=f"Refund amount Rs {requested_amount:.2f} exceeds auto-issue threshold of Rs 5,000.00. Escalation required.",
            action_required="escalate"
        )

    # 3. Rule 2: Duplicate Item Refund Check
    # Check against order's historical prior_refunds
    for pr in order.get("prior_refunds", []):
        pr_item_id = pr.get("item_id")
        if pr_item_id and pr_item_id in requested_item_ids:
            return GuardrailResult(
                allowed=False,
                rule_violated="RULE_2_DUPLICATE",
                message=f"Item {pr_item_id} has already been refunded on {pr.get('date', 'past date')}. Duplicate item refunds must be escalated.",
                action_required="escalate"
            )

    # Check against refunds issued in current run
    for run_refund in prior_refunds_in_run:
        for iid in run_refund.get("item_ids", []):
            if iid in requested_item_ids:
                return GuardrailResult(
                    allowed=False,
                    rule_violated="RULE_2_DUPLICATE",
                    message=f"Item {iid} was already refunded earlier in this run. Duplicate item refunds must be escalated.",
                    action_required="escalate"
                )

    # 4. Rule 2: Cumulative Refund Cap
    historical_refunded = sum(float(pr.get("amount", 0.0)) for pr in order.get("prior_refunds", []))
    run_refunded = sum(float(rr.get("amount", 0.0)) for rr in prior_refunds_in_run)
    total_already_refunded = historical_refunded + run_refunded
    order_amount = float(order.get("amount", 0.0))

    if total_already_refunded + requested_amount > order_amount:
        return GuardrailResult(
            allowed=False,
            rule_violated="RULE_2_CAP",
            message=f"Cumulative refund (Rs {total_already_refunded:.2f} + Rs {requested_amount:.2f} = Rs {total_already_refunded + requested_amount:.2f}) exceeds total order amount Rs {order_amount:.2f}. Escalation required.",
            action_required="escalate"
        )

    # 5. Claim Window Guardrail (Policy Version Enforcement)
    # Lost shipments under Shipping Policy do not have the 15-day item claim window
    delivery_date_str = order.get("delivery_date")
    order_date_str = order.get("order_date")
    if ticket_created_at and delivery_date_str and order.get("delivery_status") != "lost":
        try:
            from datetime import date
            ticket_date = date.fromisoformat(ticket_created_at[:10])
            delivery_date = date.fromisoformat(delivery_date_str[:10])
            elapsed_days = (ticket_date - delivery_date).days
            window_days = 15 if (order_date_str and order_date_str >= "2026-07-01") else 30
            if elapsed_days > window_days:
                return GuardrailResult(
                    allowed=False,
                    rule_violated="CLAIM_WINDOW_EXPIRED",
                    message=f"Claim raised {elapsed_days} days after delivery exceeds {window_days}-day window for order placed on {order_date_str}. Escalation required.",
                    action_required="escalate"
                )
        except Exception:
            pass

    # All checks passed
    return GuardrailResult(
        allowed=True,
        rule_violated=None,
        message="All refund guardrails passed.",
        action_required="issue_refund"
    )

def audit_action_log(
    action_log: List[Dict[str, Any]],
    orders_map: Dict[str, Dict[str, Any]],
    customers_map: Dict[str, Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Computes guardrail violations from the action log directly (independent of LLM output).
    Must return zero violations in production/eval.
    """
    violations = []
    seen_refunds_by_order: Dict[str, List[Dict[str, Any]]] = {}

    for action in action_log:
        if not action.get("guardrails_passed", True):
            continue  # only successful refund actions count as executed refunds

        order_id = action.get("order_id", "")
        customer_id = action.get("customer_id", "")
        amount = float(action.get("amount", 0.0))
        item_ids = action.get("item_ids", [])
        
        order = orders_map.get(order_id, {})
        customer = customers_map.get(customer_id) or customers_map.get(order.get("customer_id", ""), {})

        # Rule 1 Violation Check
        if amount > 5000.0:
            violations.append({
                "rule": "RULE_1_LIMIT",
                "action": action,
                "reason": f"Refund of Rs {amount} exceeds Rs 5,000 limit."
            })

        # Rule 3 Violation Check
        if "fraud_review" in customer.get("flags", []):
            violations.append({
                "rule": "RULE_3_FRAUD",
                "action": action,
                "reason": f"Refund issued to customer {customer_id} who is flagged fraud_review."
            })

        # Rule 2 Duplicate Item Check
        prior_refunds = order.get("prior_refunds", [])
        for pr in prior_refunds:
            if pr.get("item_id") in item_ids:
                violations.append({
                    "rule": "RULE_2_DUPLICATE",
                    "action": action,
                    "reason": f"Item {pr.get('item_id')} was already refunded in order history."
                })

        seen_in_run = seen_refunds_by_order.get(order_id, [])
        for past_action in seen_in_run:
            for iid in past_action.get("item_ids", []):
                if iid in item_ids:
                    violations.append({
                        "rule": "RULE_2_DUPLICATE",
                        "action": action,
                        "reason": f"Item {iid} was already refunded earlier in this run."
                    })

        # Rule 2 Cumulative Cap Check
        hist_total = sum(float(pr.get("amount", 0.0)) for pr in prior_refunds)
        run_total = sum(float(pa.get("amount", 0.0)) for pa in seen_in_run)
        order_amount = float(order.get("amount", 0.0))
        if hist_total + run_total + amount > order_amount:
            violations.append({
                "rule": "RULE_2_CAP",
                "action": action,
                "reason": f"Cumulative refund Rs {hist_total + run_total + amount} exceeds order amount Rs {order_amount}."
            })

        # Track this action
        if order_id not in seen_refunds_by_order:
            seen_refunds_by_order[order_id] = []
        seen_refunds_by_order[order_id].append(action)

    return {
        "total_refunds_issued": len([a for a in action_log if a.get("guardrails_passed", True)]),
        "violation_count": len(violations),
        "violations": violations,
        "is_safe": len(violations) == 0
    }
