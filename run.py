#!/usr/bin/env python3
"""
CLI entry point for ShopSphere Support Agent.
Usage:
    python run.py --tickets <path> --out <path>
"""
import sys
import json
import argparse
import logging
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).resolve().parent))

from src.config import settings
from src.tools import ShopSphereTools, ToolContext
from src.agent import ShopSphereAgent
from src.db import init_db
from src.metrics import metrics_tracker

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("shopsphere.cli")

def main():
    parser = argparse.ArgumentParser(description="ShopSphere Support Agent CLI")
    parser.add_argument("--tickets", required=True, help="Path to input tickets JSON file")
    parser.add_argument("--out", required=True, help="Path to output results JSON file")
    parser.add_argument("--data-dir", default=None, help="Path to shopsphere_data directory")
    parser.add_argument("--db-path", default=None, help="Path to SQLite database file")
    parser.add_argument("--replay", default=None, help="Path to replay responses JSON file")
    parser.add_argument("--record", default=None, help="Path to record responses JSON file")
    parser.add_argument("--prompt-version", default=settings.PROMPT_VERSION, help="Prompt version (e.g. v1)")
    args = parser.parse_args()

    tickets_path = Path(args.tickets)
    out_path = Path(args.out)
    data_dir = Path(args.data_dir) if args.data_dir else settings.get_data_dir()
    db_path = Path(args.db_path) if args.db_path else settings.get_db_path()

    if not tickets_path.exists():
        logger.error("Tickets file not found: %s", tickets_path)
        sys.exit(1)

    with open(tickets_path, "r", encoding="utf-8") as f:
        tickets = json.load(f)

    logger.info("Loaded %d tickets from %s", len(tickets), tickets_path)

    # Initialize SQLite database
    init_db(db_path)

    # Initialize tools & agent
    tools = ShopSphereTools(data_dir=data_dir)
    agent = ShopSphereAgent(tools=tools, prompt_version=args.prompt_version)

    # Replay or Record setup
    replay_file = args.replay or settings.REPLAY_FILE
    if replay_file and Path(replay_file).exists():
        agent.load_replay_file(replay_file)

    record_file = args.record or settings.RECORD_FILE

    import uuid
    run_id = f"run_{uuid.uuid4().hex[:10]}"
    ctx = ToolContext(run_id=run_id, db_path=db_path)

    results = []
    print(f"\n{'='*70}\nProcessing {len(tickets)} tickets for ShopSphere...\n{'='*70}")

    for idx, ticket in enumerate(tickets, 1):
        tid = ticket.get("ticket_id", f"T-{idx:02d}")
        logger.info("[%d/%d] Processing ticket %s...", idx, len(tickets), tid)
        try:
            res = agent.process_ticket(ticket, ctx=ctx)
            results.append(res)
            print(f"  [{idx:02d}/{len(tickets):02d}] {tid} -> {res.get('final_action'):<18} "
                  f"Refund: Rs {str(res.get('refund_amount')):<8} Intent: {res.get('intent')}")
        except Exception as e:
            logger.error("Error processing ticket %s: %s", tid, e, exc_info=True)
            fallback = {
                "ticket_id": tid,
                "intent": "error",
                "tool_calls": [],
                "policy_sources": [],
                "final_action": "escalate",
                "refund_amount": None,
                "reply": "An error occurred while processing your ticket. It has been escalated to our human support team.",
                "confidence": "low - unhandled error fallback",
                "trace_id": "error",
                "prompt_version": args.prompt_version,
                "agent_version": settings.AGENT_VERSION
            }
            results.append(fallback)

    # Write output JSON
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2, ensure_ascii=False)
    logger.info("Wrote %d results to %s", len(results), out_path)

    # Save recorded responses if record flag was set
    if record_file:
        agent.save_record_file(record_file)

    # Summary Report
    summary = metrics_tracker.get_summary()
    print(f"\n{'='*70}\nRun Summary Report\n{'='*70}")
    print(f"Tickets Processed:    {summary['tickets_processed']}")
    print(f"Action Distribution:  {summary['action_distribution']}")
    print(f"Escalation Rate:      {summary['escalation_rate'] * 100:.1f}%")
    print(f"Guardrail Blocks:     {summary['guardrail_blocks']}")
    print(f"Tokens Used:          Prompt: {summary['tokens']['prompt_tokens']}, Output: {summary['tokens']['output_tokens']}, Total: {summary['tokens']['total_tokens']}")
    print(f"Estimated Cost:       ${summary['estimated_cost_usd']:.6f} USD")
    print(f"Latency (avg/min/max): {summary['latency_ms']['avg']}ms / {summary['latency_ms']['min']}ms / {summary['latency_ms']['max']}ms")
    print(f"{'='*70}\n")

if __name__ == "__main__":
    main()
