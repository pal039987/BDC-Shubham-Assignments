# ShopSphere Support Agent: Release Changes (v1 to v2)

## 1. Summary of Changes in `tickets.json`
Between v1 (pre-amendment) and v2 (post-October 2026 Amendment), exactly **two** tickets from `tickets.json` changed their outcome. All other 23 tickets produced identical outcomes.

| Ticket ID | Customer ID & Tier | Order ID | v1 Outcome | v2 Outcome | Rationale for Change |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **T-20** | `C103` (Premium) | `ORD-1018` | `escalate` (Rs null) | `issue_refund` (Rs 7,999.0) | **Higher Auto-Refund Limit for Premium Customers**: In v1, the uniform auto-refund limit was Rs 5,000, so the Rs 7,999 lost smartphone claim was escalated. Under October 2026 Amendment §1, Premium customers qualify for auto-refunds up to Rs 8,000. Customer C103 is verified Premium with no fraud flags, and the claim was processed on 2026-10-01 (when the amendment is active). |
| **T-23** | `C111` (Regular) | `ORD-1021` | `issue_refund` (Rs 1,999.0) | `issue_refund` (Rs 2,098.0) | **Wrong-Item Shipping Fee Refund**: In v1, the 2026 Refund Policy excluded shipping fees, refunding only the item price (Rs 1,999.0). Under October 2026 Amendment §2, when a refund is issued due to a wrong-item delivery (blue backpack ordered, black received), the order's shipping fee (Rs 99.0) is refunded as well: Rs 1,999 + Rs 99 = Rs 2,098.0. |

### Evaluation of Outcome Changes
- **Are any of these changes wrong?** **No**.
- Both changes strictly follow the explicit clauses of `policies/amendment_2026_10.md`:
  - Amendment §1 explicitly raises the auto-refund cap to Rs 8,000 for Premium customers with retroactive effective date ("applies to all refunds processed on or after 2026-10-01, regardless of when the order was placed").
  - Amendment §2 explicitly mandates refunding the order shipping fee on wrong-item deliveries for all customer tiers.

---

## 2. Production Metrics Comparison (v1 vs. v2)

Metrics measured over `tickets.json` (25 tickets) and `tickets_batch2.json` (8 tickets):

| Metric | Version 1 (`tickets.json`) | Version 2 (`tickets.json`) | Version 2 (`tickets_batch2.json`) | Combined v2 (33 tickets) | Delta / Business Impact |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Escalation Rate** | **44.0%** (11/25) | **40.0%** (10/25) | **50.0%** (4/8) | **42.4%** (14/33) | **-4.0% reduction** in escalations on base batch due to higher Premium refund limit (T-20 auto-resolved). |
| **Auto-Refund Total** | **Rs 21,845.0** (8 refunds) | **Rs 29,943.0** (9 refunds) | **Rs 15,998.0** (3 refunds) | **Rs 45,941.0** (12 refunds) | **+Rs 8,098.0** auto-refunded on base batch (Rs 7,999 on T-20 + Rs 99 shipping on T-23). Faster resolution for high-value VIPs. |
| **Avg Cost / Ticket** | **$0.000330 USD** | **$0.000370 USD** | **$0.000374 USD** | **$0.000371 USD** | Minimal increase (~$0.00004 USD / Rs 0.003) due to indexing the October amendment passages in the prompt context. |
| **Total Prompt Tokens** | 64,898 tokens | 73,918 tokens | 23,655 tokens | 97,573 tokens | Context increased slightly to accommodate amendment clauses. |
| **Guardrail Violations**| **0** | **0** | **0** | **0** | Strict 0 violations maintained across all runs. |

---

## 3. Rollback Procedure
If an issue arises with v2, rollback to v1 is instantaneous and requires **zero code changes**:

```bash
# 1. Roll back running container to v1 image and prompt version:
AGENT_VERSION=v1 PROMPT_VERSION=v1 docker compose up -d --force-recreate agent

# 2. Verify rollback health:
curl -s http://localhost:8000/healthz | jq .
# Expected output: {"status": "ok", "agent_version": "v1", "prompt_version": "v1", ...}
```
*Tested and verified working in production environment.*
