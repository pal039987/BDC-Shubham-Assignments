"""
Tools module for ShopSphere: the 5 required internal tools.
"""
import json
import re
from pathlib import Path
from typing import Dict, Any, List, Optional
from src.config import settings
from src.guardrails import check_refund_guardrails, GuardrailResult
from src.db import log_refund_action, log_escalation

class ToolContext:
    """Carries runtime state across a ticket or batch run."""
    def __init__(self, run_id: str = "default_run", db_path: Optional[Path] = None, auto_refund_enabled: Optional[bool] = None):
        self.run_id = run_id
        self.db_path = db_path or settings.get_db_path()
        self.auto_refund_enabled = settings.AUTO_REFUND_ENABLED if auto_refund_enabled is None else auto_refund_enabled
        self.run_refunds: List[Dict[str, Any]] = []
        self.escalations: List[Dict[str, Any]] = []
        self.tool_calls_executed: List[Dict[str, Any]] = []
        self.policy_sources_used: List[str] = []

class ShopSphereTools:
    def __init__(self, data_dir: Optional[Path] = None):
        self.data_dir = data_dir or settings.get_data_dir()
        self._load_data()
        self._load_policies()

    def _load_data(self):
        orders_file = self.data_dir / "orders.json"
        customers_file = self.data_dir / "customers.json"

        if orders_file.exists():
            with open(orders_file, "r", encoding="utf-8") as f:
                orders_list = json.load(f)
                self.orders = {o["order_id"]: o for o in orders_list}
        else:
            self.orders = {}

        if customers_file.exists():
            with open(customers_file, "r", encoding="utf-8") as f:
                cust_list = json.load(f)
                self.customers = {c["customer_id"]: c for c in cust_list}
        else:
            self.customers = {}

    def _load_policies(self):
        """Loads and indexes markdown policy passages."""
        policies_dir = self.data_dir / "policies"
        self.passages = []

        if policies_dir.exists():
            for md_file in sorted(policies_dir.glob("*.md")):
                source_rel = f"policies/{md_file.name}"
                text = md_file.read_text(encoding="utf-8")
                
                # Split by sections starting with ##
                sections = re.split(r'\n(?=## )', text)
                for sec in sections:
                    lines = sec.strip().split("\n")
                    header = lines[0].replace("#", "").strip() if lines else "General"
                    content = "\n".join(lines[1:]).strip() if len(lines) > 1 else lines[0]
                    self.passages.append({
                        "source": source_rel,
                        "title": header,
                        "content": content,
                        "text_searchable": f"{header} {sec}".lower()
                    })

    def get_order(self, order_id: str) -> Dict[str, Any]:
        """Returns the order or a clear not-found result."""
        order = self.orders.get(order_id)
        if order:
            return {"found": True, "order": order}
        return {"found": False, "error": f"Order {order_id} not found"}

    def get_customer(self, customer_id: str) -> Dict[str, Any]:
        """Returns tier and flags for a customer."""
        customer = self.customers.get(customer_id)
        if customer:
            return {
                "found": True,
                "customer_id": customer["customer_id"],
                "name": customer["name"],
                "tier": customer["tier"],
                "flags": customer.get("flags", [])
            }
        return {"found": False, "error": f"Customer {customer_id} not found"}

    def search_policy(self, query: str) -> List[Dict[str, str]]:
        """Returns specific policy passages, each with its source file name."""
        q_tokens = [t.lower() for t in re.findall(r'\w+', query) if len(t) > 2]
        scored_passages = []

        for p in self.passages:
            score = 0
            for tok in q_tokens:
                if tok in p["text_searchable"]:
                    score += p["text_searchable"].count(tok)
            # Boost matches on header
            for tok in q_tokens:
                if tok in p["title"].lower():
                    score += 5
            if score > 0:
                scored_passages.append((score, p))

        # Sort by score descending
        scored_passages.sort(key=lambda x: x[0], reverse=True)
        top = scored_passages[:3] if scored_passages else [(1, p) for p in self.passages[:2]]

        results = []
        for _, p in top:
            results.append({
                "source": p["source"],
                "section": p["title"],
                "passage": p["content"]
            })
        return results

    def issue_refund(
        self,
        order_id: str,
        item_ids: List[str],
        amount: float,
        reason: str,
        ctx: Optional[ToolContext] = None,
        ticket_id: str = "T-UNKNOWN",
        customer_id: Optional[str] = None,
        trace_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Simulated refund execution; evaluates hard guardrails before issuing.
        Appends a record to the run's action log and SQLite database.
        """
        order = self.orders.get(order_id)
        if not order:
            return {
                "success": False,
                "guardrail_passed": False,
                "error": f"Order {order_id} not found for refund",
                "action_required": "escalate"
            }

        cust_id = customer_id or order.get("customer_id")
        customer = self.customers.get(cust_id, {"customer_id": cust_id, "flags": []})

        prior_refunds_in_run = []
        if ctx:
            prior_refunds_in_run = [r for r in ctx.run_refunds if r.get("order_id") == order_id]

        auto_refund_enabled = ctx.auto_refund_enabled if ctx else settings.AUTO_REFUND_ENABLED

        # EVALUATE HARD GUARDRAILS (Rule 1, 2, 3, kill switch)
        guardrail_res: GuardrailResult = check_refund_guardrails(
            order=order,
            customer=customer,
            requested_amount=amount,
            requested_item_ids=item_ids,
            prior_refunds_in_run=prior_refunds_in_run,
            auto_refund_enabled=auto_refund_enabled
        )

        if not guardrail_res.allowed:
            # Block refund and escalate!
            if ctx:
                log_escalation(
                    db_path=ctx.db_path,
                    run_id=ctx.run_id,
                    ticket_id=ticket_id,
                    customer_id=cust_id,
                    summary=f"Refund blocked by guardrail: {guardrail_res.message}",
                    reason=guardrail_res.rule_violated or "guardrail_block",
                    trace_id=trace_id
                )
            return {
                "success": False,
                "guardrail_passed": False,
                "rule_violated": guardrail_res.rule_violated,
                "message": guardrail_res.message,
                "action_required": "escalate"
            }

        # Guardrails passed: record refund in run and database
        refund_record = {
            "order_id": order_id,
            "item_ids": item_ids,
            "amount": amount,
            "reason": reason,
            "ticket_id": ticket_id,
            "customer_id": cust_id,
            "trace_id": trace_id
        }
        if ctx:
            ctx.run_refunds.append(refund_record)
            log_refund_action(
                db_path=ctx.db_path,
                run_id=ctx.run_id,
                ticket_id=ticket_id,
                order_id=order_id,
                customer_id=cust_id,
                item_ids=item_ids,
                amount=amount,
                reason=reason,
                guardrails_passed=True,
                trace_id=trace_id
            )

        return {
            "success": True,
            "guardrail_passed": True,
            "order_id": order_id,
            "amount": amount,
            "item_ids": item_ids,
            "message": f"Successfully issued refund of Rs {amount:.2f} for order {order_id}."
        }

    def escalate_to_human(
        self,
        ticket_id: str,
        summary: str,
        reason: str,
        ctx: Optional[ToolContext] = None,
        customer_id: Optional[str] = None,
        trace_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Records a structured handoff for a human agent."""
        record = {
            "ticket_id": ticket_id,
            "customer_id": customer_id or "",
            "summary": summary,
            "reason": reason,
            "trace_id": trace_id
        }
        if ctx:
            ctx.escalations.append(record)
            log_escalation(
                db_path=ctx.db_path,
                run_id=ctx.run_id,
                ticket_id=ticket_id,
                customer_id=customer_id,
                summary=summary,
                reason=reason,
                trace_id=trace_id
            )

        return {
            "success": True,
            "ticket_id": ticket_id,
            "summary": summary,
            "reason": reason,
            "status": "escalated"
        }
