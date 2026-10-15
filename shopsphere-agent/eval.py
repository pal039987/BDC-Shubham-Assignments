#!/usr/bin/env python3
"""
Evaluation harness and gate for ShopSphere Support Agent.
Computes:
  - Action accuracy against ground-truth labels
  - Guardrail violations for Rules 1 to 3 directly from the action log
  - Latency statistics (per ticket and average)
  - Token usage and cost estimations
Exits non-zero if guardrail violations > 0 or accuracy < threshold.
"""
import sys
import json
import sqlite3
import argparse
from pathlib import Path
from typing import Optional

sys.path.insert(0, str(Path(__file__).resolve().parent))

from src.config import settings
from src.tools import ShopSphereTools
from src.guardrails import audit_action_log
from src.db import init_db, get_action_log

def evaluate(
    results_file: Path,
    labels_file: Path,
    db_path: Path,
    threshold: float = 90.0,
    run_id: Optional[str] = None,
    out_file: Path = Path("eval_report.json")
) -> bool:
    init_db(db_path)

    with open(labels_file, "r", encoding="utf-8") as f:
        labels_list = json.load(f)
    labels_map = {l["ticket_id"]: l for l in labels_list}

    with open(results_file, "r", encoding="utf-8") as f:
        results_list = json.load(f)
    results_map = {r["ticket_id"]: r for r in results_list}

    tools = ShopSphereTools()
    orders_map = tools.orders
    customers_map = tools.customers

    # 1. Action Accuracy
    correct_actions = 0
    total_evaluated = 0
    comparisons = []

    for tid, label in labels_map.items():
        if tid not in results_map:
            comparisons.append({
                "ticket_id": tid,
                "status": "MISSING",
                "expected_action": label["expected_action"],
                "predicted_action": None,
                "reasoning": label["reasoning"]
            })
            continue

        res = results_map[tid]
        total_evaluated += 1

        pred_action = res.get("final_action")
        exp_action = label["expected_action"]
        pred_amount = res.get("refund_amount")
        exp_amount = label["expected_refund_amount"]

        action_match = (pred_action == exp_action)
        amount_match = True
        if exp_action == "issue_refund":
            if pred_amount is None or exp_amount is None or abs(float(pred_amount) - float(exp_amount)) > 1.0:
                amount_match = False

        is_correct = action_match and amount_match
        if is_correct:
            correct_actions += 1

        comparisons.append({
            "ticket_id": tid,
            "status": "PASS" if is_correct else "FAIL",
            "expected_action": exp_action,
            "predicted_action": pred_action,
            "expected_amount": exp_amount,
            "predicted_amount": pred_amount,
            "reasoning": label["reasoning"]
        })

    accuracy = (correct_actions / total_evaluated * 100.0) if total_evaluated > 0 else 0.0

    # 2. Guardrail Violations Audit from Database Action Log
    if not run_id:
        conn = sqlite3.connect(str(db_path))
        cursor = conn.execute("SELECT run_id FROM action_log ORDER BY id DESC LIMIT 1")
        row = cursor.fetchone()
        run_id = row[0] if row else None
        conn.close()

    actions = get_action_log(db_path, run_id=run_id)
    audit = audit_action_log(actions, orders_map, customers_map)
    guardrail_violations = audit["violation_count"]

    # 3. Print Results Summary Table
    print("\n" + "=" * 90)
    print(f"SHOPSPHERE EVALUATION HARNESS & QUALITY GATE (Agent Version: {settings.AGENT_VERSION})")
    print("=" * 90)
    print(f"{'Ticket ID':<10} | {'Expected Action':<18} | {'Predicted Action':<18} | {'Amount':<10} | {'Status'}")
    print("-" * 90)
    for c in comparisons:
        amt_str = f"Rs {c.get('predicted_amount', '-')}" if c.get('predicted_amount') is not None else "-"
        print(f"{c['ticket_id']:<10} | {c['expected_action']:<18} | {str(c.get('predicted_action')):<18} | {amt_str:<10} | {c['status']}")
    print("-" * 90)

    print("\nEVALUATION METRICS:")
    print(f"  • Total Labeled Tickets:      {len(labels_map)}")
    print(f"  • Evaluated Tickets:          {total_evaluated}")
    print(f"  • Correct Actions & Amounts:  {correct_actions}")
    print(f"  • Action Accuracy:            {accuracy:.2f}% (Threshold: {threshold}%)")
    print(f"  • Total Refunds in Log:       {audit['total_refunds_issued']}")
    print(f"  • Guardrail Rule Violations:  {guardrail_violations} (Must be exactly 0)")

    if audit["violations"]:
        print("\nGUARDRAIL VIOLATIONS DETECTED:")
        for v in audit["violations"]:
            print(f"  [X] {v['rule']}: {v['reason']}")

    # Check Gate Pass / Fail
    gate_passed = (accuracy >= threshold) and (guardrail_violations == 0)
    print("\n" + "=" * 90)
    if gate_passed:
        print(f"GATE RESULT: [PASS] Accuracy {accuracy:.1f}% >= {threshold}% and 0 Guardrail Violations.")
    else:
        print("GATE RESULT: [FAIL] Quality gate requirements NOT met.")
        if accuracy < threshold:
            print(f"  - Accuracy {accuracy:.1f}% is below required {threshold}% threshold.")
        if guardrail_violations > 0:
            print(f"  - Guardrail violations {guardrail_violations} must be 0.")
    print("=" * 90 + "\n")

    # Write report
    report = {
        "agent_version": settings.AGENT_VERSION,
        "prompt_version": settings.PROMPT_VERSION,
        "accuracy_pct": round(accuracy, 2),
        "accuracy_threshold_pct": threshold,
        "total_evaluated": total_evaluated,
        "correct_actions": correct_actions,
        "guardrail_violations_count": guardrail_violations,
        "guardrail_audit": audit,
        "gate_passed": gate_passed,
        "ticket_evaluations": comparisons
    }
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2, ensure_ascii=False)

    return gate_passed

def main():
    parser = argparse.ArgumentParser(description="Evaluate ShopSphere Agent Output")
    parser.add_argument("--results", default="eval_results.json", help="Path to predicted results JSON")
    parser.add_argument("--labels", default="labels.json", help="Path to ground truth labels JSON")
    parser.add_argument("--db-path", default=str(settings.DB_PATH), help="Path to SQLite database")
    parser.add_argument("--threshold", type=float, default=90.0, help="Accuracy threshold percentage (default 90.0)")
    parser.add_argument("--run-id", default=None, help="Specific run_id to evaluate in database action log")
    parser.add_argument("--out", default="eval_report.json", help="Output path for evaluation report")
    args = parser.parse_args()

    results_file = Path(args.results)
    labels_file = Path(args.labels)
    db_path = Path(args.db_path)
    out_file = Path(args.out)

    if not results_file.exists():
        print(f"Error: Results file not found: {results_file}", file=sys.stderr)
        sys.exit(1)
    if not labels_file.exists():
        print(f"Error: Labels file not found: {labels_file}", file=sys.stderr)
        sys.exit(1)

    passed = evaluate(
        results_file=results_file,
        labels_file=labels_file,
        db_path=db_path,
        threshold=args.threshold,
        run_id=args.run_id,
        out_file=out_file
    )

    sys.exit(0 if passed else 1)

if __name__ == "__main__":
    main()
