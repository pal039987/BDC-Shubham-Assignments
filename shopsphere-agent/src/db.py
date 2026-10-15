"""
Database module for ShopSphere: SQLite persistence for action logs, escalations, and ticket runs.
"""
import sqlite3
import json
from pathlib import Path
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone

def get_connection(db_path: Path) -> sqlite3.Connection:
    db_path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(db_path), check_same_thread=False)
    conn.row_factory = sqlite3.Row
    # Ensure tables exist
    with conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS action_log (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                run_id TEXT NOT NULL,
                timestamp TEXT NOT NULL,
                ticket_id TEXT NOT NULL,
                order_id TEXT NOT NULL,
                customer_id TEXT,
                item_ids TEXT NOT NULL,
                amount REAL NOT NULL,
                reason TEXT NOT NULL,
                guardrails_passed INTEGER NOT NULL,
                trace_id TEXT
            )
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS escalations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                run_id TEXT NOT NULL,
                ticket_id TEXT NOT NULL,
                customer_id TEXT,
                summary TEXT NOT NULL,
                reason TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'open',
                created_at TEXT NOT NULL,
                trace_id TEXT
            )
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS ticket_runs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                run_id TEXT NOT NULL,
                ticket_id TEXT NOT NULL,
                intent TEXT NOT NULL,
                final_action TEXT NOT NULL,
                refund_amount REAL,
                tool_calls TEXT,
                policy_sources TEXT,
                reply TEXT,
                confidence TEXT,
                tokens_input INTEGER,
                tokens_output INTEGER,
                latency_ms REAL,
                estimated_cost_usd REAL,
                trace_id TEXT,
                timestamp TEXT NOT NULL
            )
        """)
    return conn

def init_db(db_path: Path):
    conn = get_connection(db_path)
    conn.close()

def log_refund_action(
    db_path: Path,
    run_id: str,
    ticket_id: str,
    order_id: str,
    customer_id: Optional[str],
    item_ids: List[str],
    amount: float,
    reason: str,
    guardrails_passed: bool = True,
    trace_id: Optional[str] = None
):
    conn = get_connection(db_path)
    with conn:
        conn.execute("""
            INSERT INTO action_log (
                run_id, timestamp, ticket_id, order_id, customer_id, item_ids, amount, reason, guardrails_passed, trace_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            run_id,
            datetime.now(timezone.utc).isoformat(),
            ticket_id,
            order_id,
            customer_id or "",
            json.dumps(item_ids),
            amount,
            reason,
            1 if guardrails_passed else 0,
            trace_id or ""
        ))
    conn.close()

def log_escalation(
    db_path: Path,
    run_id: str,
    ticket_id: str,
    customer_id: Optional[str],
    summary: str,
    reason: str,
    trace_id: Optional[str] = None
):
    conn = get_connection(db_path)
    with conn:
        conn.execute("""
            INSERT INTO escalations (
                run_id, ticket_id, customer_id, summary, reason, status, created_at, trace_id
            ) VALUES (?, ?, ?, ?, ?, 'open', ?, ?)
        """, (
            run_id,
            ticket_id,
            customer_id or "",
            summary,
            reason,
            datetime.now(timezone.utc).isoformat(),
            trace_id or ""
        ))
    conn.close()

def get_escalations(db_path: Path, status: str = "open") -> List[Dict[str, Any]]:
    conn = get_connection(db_path)
    cursor = conn.execute("""
        SELECT ticket_id, customer_id, summary, reason, status, created_at, trace_id
        FROM escalations
        WHERE status = ?
        ORDER BY id ASC
    """, (status,))
    rows = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return rows

def get_action_log(db_path: Path, run_id: Optional[str] = None) -> List[Dict[str, Any]]:
    conn = get_connection(db_path)
    if run_id:
        cursor = conn.execute("""
            SELECT id, run_id, timestamp, ticket_id, order_id, customer_id, item_ids, amount, reason, guardrails_passed, trace_id
            FROM action_log
            WHERE run_id = ?
            ORDER BY id ASC
        """, (run_id,))
    else:
        cursor = conn.execute("""
            SELECT id, run_id, timestamp, ticket_id, order_id, customer_id, item_ids, amount, reason, guardrails_passed, trace_id
            FROM action_log
            ORDER BY id ASC
        """)
    rows = []
    for row in cursor.fetchall():
        d = dict(row)
        d["item_ids"] = json.loads(d["item_ids"])
        d["guardrails_passed"] = bool(d["guardrails_passed"])
        rows.append(d)
    conn.close()
    return rows

def get_order_refunds_from_action_log(db_path: Path, order_id: str, run_id: Optional[str] = None) -> List[Dict[str, Any]]:
    conn = get_connection(db_path)
    if run_id:
        cursor = conn.execute("""
            SELECT item_ids, amount, reason, timestamp
            FROM action_log
            WHERE order_id = ? AND run_id = ? AND guardrails_passed = 1
        """, (order_id, run_id))
    else:
        cursor = conn.execute("""
            SELECT item_ids, amount, reason, timestamp
            FROM action_log
            WHERE order_id = ? AND guardrails_passed = 1
        """, (order_id,))
    rows = []
    for row in cursor.fetchall():
        d = dict(row)
        d["item_ids"] = json.loads(d["item_ids"])
        rows.append(d)
    conn.close()
    return rows
