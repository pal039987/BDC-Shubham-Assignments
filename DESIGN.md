# ShopSphere Support Agent: System Design & Architecture Document

## 1. Executive Summary & Architecture Overview

ShopSphere is an Indian e-commerce enterprise handling approximately 4,000 customer support tickets daily. In customer support for e-commerce, the risk of unauthorized refunds, policy hallucination, and data leakage is paramount.

The **ShopSphere Support Agent (v1)** is an enterprise-grade, auditable AI service built to process support tickets end-to-end with high accuracy, hard guardrails, OpenTelemetry tracing, and automated quality gating.

### System Architecture Diagram
```
                     +----------------------------+
                     |  Customer Support Ticket   |
                     +--------------+-------------+
                                    |
                                    v
                     +----------------------------+
                     |  FastAPI / CLI Entrypoint  |
                     +--------------+-------------+
                                    |
                 +------------------+------------------+
                 |                                     |
                 v                                     v
   +---------------------------+         +---------------------------+
   |   OpenTelemetry Tracing   |         |    Prometheus Metrics     |
   |   (Arize Phoenix 6006)    |         |    (/metrics, JSON)       |
   +---------------------------+         +---------------------------+
                 |                                     |
                 +------------------+------------------+
                                    |
                                    v
                     +----------------------------+
                     |   ShopSphere Core Agent    |
                     |  (Gemini 3.8 Flash Engine) |
                     +--------------+-------------+
                                    |
            +-----------------------+-----------------------+
            |                                               |
            v                                               v
+-----------------------+                       +-----------------------+
|    Internal Tools     |                       |    Hard Guardrails    |
| - get_customer        |                       | - Rule 1: Limit <=5k  |
| - get_order           |                       | - Rule 2: Order Cap   |
| - search_policy       |                       | - Rule 2: Duplicate   |
| - issue_refund        |                       | - Rule 3: Fraud Flag  |
| - escalate_to_human   |                       | - Kill Switch Check   |
+-----------+-----------+                       +-----------+-----------+
            |                                               |
            +-----------------------+-----------------------+
                                    |
                                    v
                     +----------------------------+
                     |     SQLite Persistence     |
                     |   (action_log, escalations)|
                     +--------------+-------------+
                                    |
                                    v
                     +----------------------------+
                     |   Structured Output JSON   |
                     +----------------------------+
```

---

## 2. Agent Framework Rationale & Tradeoffs

### Evaluated Alternatives
1. **LangGraph / LangChain**: High abstraction, state graph overhead, complex dependency tree, and potential latency overhead on per-ticket resolution.
2. **CrewAI**: Designed for multi-agent conversational role-play; adds unnecessary inter-agent message passing that complicates latency SLAs and auditability for deterministic e-commerce actions.
3. **Native Gemini with Structured Output & Functional Guardrail Pipeline (Chosen Architecture)**.

### Architectural Justification
We implemented the core agent using **Google Gemini (google-genai SDK)** paired with a deterministic tool-investigation pipeline and hard code guardrails:
- **Zero Hallucination on State Transitions**: State decisions (e.g. claim window calculation, item duplication checks) are validated by Python code rather than relying solely on LLM graph transitions.
- **Ultra-Low Latency**: Processing average latency is kept minimal without graph serialization overhead.
- **Deterministic Guardrails**: Guardrail enforcement runs strictly before any refund action can be recorded or executed.
- **Debuggability & Clean-Machine Portability**: Standard Python 3.12 with clean dependencies ensures rapid container startup (<2 seconds) and zero hidden failure modes during live review.

---

## 3. Tool Architecture & Policy Retrieval

The agent implements the 5 required internal tools:
1. `get_order(order_id)`: Fetches full order lifecycle, tracking history, items, and historical `prior_refunds`.
2. `get_customer(customer_id)`: Returns customer profile, membership tier (`Regular`, `Plus`, `Premium`), and security flags (`fraud_review`).
3. `search_policy(query)`: Indexes and searches passages from markdown policies (`policies/refund_policy_2026.md`, `policies/refund_policy_2025.md`, `policies/shipping_policy.md`, `policies/loyalty_program.md`), attributing sources.
4. `issue_refund(order_id, item_ids, amount, reason)`: Simulated execution gated by `check_refund_guardrails()`.
5. `escalate_to_human(ticket_id, summary, reason)`: Records structured handoffs in the database and review queue.

### Temporal Logic (Fixed Reference Date)
- Fixed reference date: **`2026-10-01`**. The system clock is never used.
- **2026 Refund Policy**: Orders placed on or after `2026-07-01` have a **15-calendar-day claim window** from `delivery_date`.
- **2025 Refund Policy**: Orders placed before `2026-07-01` have a **30-calendar-day claim window** from `delivery_date`.
- Day count formula: `(ticket_created_date - delivery_date).days <= window`.

---

## 4. Guardrails & Safety Architecture

### Hard Guardrails (Rules 1 to 3)
Hard checks are enforced in `src/guardrails.py` in code before any refund can be issued:
1. **Rule 1 (Refund Limit)**: Maximum auto-refund is **Rs 5,000.00**. Any refund request exceeding Rs 5,000 is automatically blocked and escalated to a human.
2. **Rule 2 (Refund Cap & Duplicate Check)**:
   - Cumulative refunds on an order (`prior_refunds` + refunds issued earlier in this run) must never exceed total order `amount`.
   - A refund request for an item that has already been refunded (either in historical `prior_refunds` or earlier in the active run) is immediately blocked and escalated.
3. **Rule 3 (Fraud Review Check)**: Customers with the `fraud_review` flag may receive order status inquiries, but any refund or account change request must be escalated.
4. **Kill Switch (`AUTO_REFUND_ENABLED=false`)**: When disabled via environment variable, all refunds are instantly escalated without code changes.

### Action Log Quality Audit
Guardrail violations are evaluated **directly from the action log in the database**, independent of the LLM's raw text generation.

### Soft Guardrails & Layered Defenses (Rules 4 and 5)
- **Rule 4 (Data vs. Instructions)**: Customer ticket text is encapsulated in `<ticket_text>` XML tags and treated strictly as untrusted user data. Prompt injections (e.g. system notes, fake pre-approvals in T-05, instruction overrides in T-21) are flagged and sanitized.
- **Rule 5 (No Invented Policy)**: When inquiries fall outside documented policy (e.g. corporate bulk gifting in T-13, delay compensation in T-25), the agent states that no policy covers this and escalates.
- **Unsupported Actions**: Change of mind returns, order cancellations, and address changes have no tool and are escalated.

---

## 5. Observability, Tracing & AgentOps

### Distributed Tracing
- OpenTelemetry SDK instruments every ticket run with:
  - Root span: `ticket:<ticket_id>` (carrying trace_id, agent_version, prompt_version).
  - Sub-spans: `tool:get_customer`, `tool:get_order`, `tool:search_policy`, `llm:gemini_generate`, `guardrails:refund_check`, `tool:issue_refund` / `tool:escalate_to_human`.
- Self-hosted **Arize Phoenix** container running on port `6006` with OTLP HTTP receiver on port `4318`.

### Operational Metrics
Exposed via `GET /metrics` in Prometheus format and JSON:
- Total tickets processed and action distribution (`reply_only`, `issue_refund`, `escalate`, `request_more_info`).
- Latency percentiles (min, max, average).
- Token usage (prompt tokens, output tokens) and estimated cost using Gemini published pricing ($0.10/1M input, $0.40/1M output).
- Guardrail blocks counter by rule type (`RULE_1_LIMIT`, `RULE_2_CAP`, `RULE_2_DUPLICATE`, `RULE_3_FRAUD`, `KILL_SWITCH`).
- Escalation rate gauge.

---

## 6. CI/CD & LLMOps Quality Gate

### Offline Replay Mechanism
To allow automated CI testing without requiring API keys or incurring external API rate limits, all 25 ticket responses are recorded into `recorded_responses/responses.json`. In replay mode (`--replay`), the agent reproduces outputs deterministically while executing tools and guardrails.

### Evaluation Gate
The evaluation script `eval.py` (`make eval`) acts as a deployment quality gate:
- Validates action accuracy against `labels.json` (threshold >= 90%).
- Computes guardrail violations from the action log (must be exactly 0).
- Exits non-zero if either condition fails, halting broken releases in CI.
