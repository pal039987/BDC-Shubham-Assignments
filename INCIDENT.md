# Incident Post-Mortem: Unauthorized Refund on Expired Claim (INC-01 / ORD-1037)

## 1. Root Cause Analysis
An unauthorized refund of Rs 2,800 was auto-issued by agent v0 for order ORD-1037 (delivered 2026-08-14, claim raised 2026-09-05, elapsed: 22 calendar days).

- **Step 5 (Retrieval/Chunking Flaw)**: The naive chunker (400 chars, no overlap, no metadata) separated the `## Claim window` section from `## Scope and effective date` in both policy files. The retriever returned both 2025 (30-day window) and 2026 (15-day window) chunks without scope context.
- **Step 6 (Model Policy Selection Flaw)**: The LLM resolved the conflict using raw vector similarity score (`0.89` for 2025 vs `0.87` for 2026) instead of checking `order_date` (`2026-08-10`). It incorrectly applied the legacy 2025 policy (30 days) to a 2026 order where 22 days elapsed. Under the 2026 policy, the claim was expired (22 > 15 days).
- **Step 7 & 8 (Guardrail Gap)**: The v0 guardrail layer only verified amount <= Rs 5,000, cumulative cap, and fraud flags. It lacked a deterministic claim-window check in code, allowing `issue_refund` to execute.

## 2. Agent Verification
We submitted ticket `INC-01` to our running service (`POST /v1/tickets/resolve`):
- **Decision**: Correctly identified as ineligible. Action: `reply_only`, `refund_amount: null`.
- **Response**: Mirrored customer language, explained the 15-day claim window under the 2026 Policy, and advised checking warranty.
- **Trace Evidence**: Phoenix / OpenTelemetry Trace ID: `56fe959b5e3344e7985f82bc1a890026`.

## 3. Hard Guardrail Fix & Regression Testing
To prevent any future model hallucination or RAG ranking failure:
- **Code Enforcement**: Added deterministic claim-window verification in `src/guardrails.py` and `src/tools.py`. If `order_date >= 2026-07-01`, a strict 15-calendar-day limit is enforced; otherwise 30 days. Claims exceeding the window are blocked and escalated (`CLAIM_WINDOW_EXPIRED`).
- **Regression Suite**: Added `test_incident_regression_expired_claim_window` and `test_incident_regression_within_claim_window` to `tests/test_guardrails.py`, enforced on every CI build.

## 4. Production Metric & Alerting
- **Metric**: `shopsphere_guardrail_blocks_total{rule="CLAIM_WINDOW_EXPIRED"}` wired into `/metrics`.
- **Prometheus Alert**:
  ```yaml
  alert: OutOfWindowRefundBlocked
  expr: increase(shopsphere_guardrail_blocks_total{rule="CLAIM_WINDOW_EXPIRED"}[24h]) > 0
  for: 5m
  labels:
    severity: warning
  annotations:
    summary: "Out-of-window refund attempt detected within 24h"
  ```
- **Threshold Rationale**: Threshold is `> 0` within 24 hours. Because the claim window is a non-negotiable policy boundary, any attempt immediately flags model drift or prompt regression before customer disputes escalate.
