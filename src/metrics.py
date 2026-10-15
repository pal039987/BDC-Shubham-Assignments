from typing import Dict, Any, List

# Pricing constants for Gemini Flash (USD per token)
COST_PER_INPUT_TOKEN = 0.10 / 1_000_000   # $0.10 per 1M tokens
COST_PER_OUTPUT_TOKEN = 0.40 / 1_000_000  # $0.40 per 1M tokens

class MetricsTracker:
    def __init__(self):
        self.reset()

    def reset(self):
        self.tickets_processed = 0
        self.action_counts: Dict[str, int] = {
            "reply_only": 0,
            "issue_refund": 0,
            "escalate": 0,
            "request_more_info": 0
        }
        self.latencies_ms: List[float] = []
        self.total_prompt_tokens = 0
        self.total_output_tokens = 0
        self.total_cost_usd = 0.0
        self.guardrail_blocks: Dict[str, int] = {
            "RULE_1_LIMIT": 0,
            "RULE_2_CAP": 0,
            "RULE_2_DUPLICATE": 0,
            "RULE_3_FRAUD": 0,
            "KILL_SWITCH": 0,
            "CLAIM_WINDOW_EXPIRED": 0
        }
        self.escalations_count = 0

    def record_ticket(
        self,
        final_action: str,
        latency_ms: float,
        prompt_tokens: int,
        output_tokens: int,
        guardrail_block: str = None
    ):
        self.tickets_processed += 1
        self.action_counts[final_action] = self.action_counts.get(final_action, 0) + 1
        self.latencies_ms.append(latency_ms)
        self.total_prompt_tokens += prompt_tokens
        self.total_output_tokens += output_tokens
        
        ticket_cost = (prompt_tokens * COST_PER_INPUT_TOKEN) + (output_tokens * COST_PER_OUTPUT_TOKEN)
        self.total_cost_usd += ticket_cost

        if final_action == "escalate":
            self.escalations_count += 1

        if guardrail_block:
            self.guardrail_blocks[guardrail_block] = self.guardrail_blocks.get(guardrail_block, 0) + 1

    def get_summary(self) -> Dict[str, Any]:
        avg_latency = (sum(self.latencies_ms) / len(self.latencies_ms)) if self.latencies_ms else 0.0
        max_latency = max(self.latencies_ms) if self.latencies_ms else 0.0
        min_latency = min(self.latencies_ms) if self.latencies_ms else 0.0
        escalation_rate = (self.escalations_count / self.tickets_processed) if self.tickets_processed else 0.0

        return {
            "tickets_processed": self.tickets_processed,
            "action_distribution": self.action_counts,
            "escalation_count": self.escalations_count,
            "escalation_rate": round(escalation_rate, 4),
            "guardrail_blocks": self.guardrail_blocks,
            "guardrails_blocked_total": sum(self.guardrail_blocks.values()),
            "tokens": {
                "prompt_tokens": self.total_prompt_tokens,
                "output_tokens": self.total_output_tokens,
                "total_tokens": self.total_prompt_tokens + self.total_output_tokens
            },
            "latency_ms": {
                "avg": round(avg_latency, 2),
                "min": round(min_latency, 2),
                "max": round(max_latency, 2)
            },
            "estimated_cost_usd": round(self.total_cost_usd, 6)
        }

    def to_prometheus(self) -> str:
        s = self.get_summary()
        lines = [
            "# HELP shopsphere_tickets_total Total number of tickets processed",
            "# TYPE shopsphere_tickets_total counter",
            f"shopsphere_tickets_total {s['tickets_processed']}",
            "",
            "# HELP shopsphere_tickets_by_action Tickets processed by final action",
            "# TYPE shopsphere_tickets_by_action counter",
        ]
        for act, cnt in s["action_distribution"].items():
            lines.append(f'shopsphere_tickets_by_action{{action="{act}"}} {cnt}')

        lines.extend([
            "",
            "# HELP shopsphere_escalation_rate Current rate of ticket escalations",
            "# TYPE shopsphere_escalation_rate gauge",
            f"shopsphere_escalation_rate {s['escalation_rate']}",
            "",
            "# HELP shopsphere_guardrail_blocks_total Refunds blocked by guardrails",
            "# TYPE shopsphere_guardrail_blocks_total counter",
        ])
        for rule, cnt in s["guardrail_blocks"].items():
            lines.append(f'shopsphere_guardrail_blocks_total{{rule="{rule}"}} {cnt}')

        lines.extend([
            "",
            "# HELP shopsphere_tokens_total Total tokens used",
            "# TYPE shopsphere_tokens_total counter",
            f'shopsphere_tokens_total{{type="prompt"}} {s["tokens"]["prompt_tokens"]}',
            f'shopsphere_tokens_total{{type="output"}} {s["tokens"]["output_tokens"]}',
            "",
            "# HELP shopsphere_cost_usd_total Estimated cost in USD",
            "# TYPE shopsphere_cost_usd_total counter",
            f"shopsphere_cost_usd_total {s['estimated_cost_usd']}",
            "",
            "# HELP shopsphere_latency_avg_ms Average per-ticket latency in milliseconds",
            "# TYPE shopsphere_latency_avg_ms gauge",
            f"shopsphere_latency_avg_ms {s['latency_ms']['avg']}"
        ])
        return "\n".join(lines) + "\n"

# Global tracker singleton
metrics_tracker = MetricsTracker()
