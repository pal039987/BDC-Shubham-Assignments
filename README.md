# ShopSphere Support Agent (v1)

ShopSphere is an automated customer support resolution service designed for high-throughput Indian e-commerce. It investigates customer tickets using internal tools, enforces strict non-bypassable guardrails in Python code, records distributed traces via OpenTelemetry and Arize Phoenix, and persists action logs and human escalation queues in SQLite.

---

## ⚡ 10-Minute Quickstart (From Clone to Resolved Ticket)

Follow these steps on any clean machine with Docker and Docker Compose installed:

### Step 1: Clone the Repository
```bash
git clone <repo-url>
cd <repo-folder>
```

### Step 2: Configure Environment Variables
Copy `.env.example` to `.env` and populate your Google Gemini API key:
```bash
cp .env.example .env
# Edit .env and set your GEMINI_API_KEY
# e.g.: GEMINI_API_KEY=AQ.Ab8...
```

### Step 3: Launch the Production Stack
Start both the agent API service and the Arize Phoenix tracing stack:
```bash
docker compose up -d
```
*Wait ~10 seconds for the healthcheck to turn healthy.*

### Step 4: Verify Service Health
```bash
curl -s http://localhost:8000/healthz | jq
```
Expected output:
```json
{
  "status": "ok",
  "gemini_api_key_configured": true,
  "auto_refund_enabled": true,
  "database": "connected",
  "agent_version": "v1",
  "prompt_version": "v1",
  "model": "gemini-3.8-flash"
}
```

### Step 5: Resolve a Support Ticket via `curl`
Send a customer support ticket to the resolution endpoint:
```bash
curl -X POST http://localhost:8000/v1/tickets/resolve \
  -H "Content-Type: application/json" \
  -d '{
    "ticket_id": "T-01",
    "customer_id": "C101",
    "created_at": "2026-09-30T10:12:00+05:30",
    "text": "Hi, where is my order ORD-1001? It has been a couple of days."
  }' | jq
```

Response:
```json
{
  "ticket_id": "T-01",
  "intent": "track_order",
  "tool_calls": [
    { "tool": "get_customer", "args": { "customer_id": "C101" } },
    { "tool": "get_order", "args": { "order_id": "ORD-1001" } },
    { "tool": "search_policy", "args": { "query": "Hi, where is my order ORD-1001..." } }
  ],
  "policy_sources": [
    "policies/shipping_policy.md"
  ],
  "final_action": "reply_only",
  "refund_amount": null,
  "reply": "Hello Aarav! Your order ORD-1001 was shipped on 2026-09-28. Standard delivery typically takes 3 to 7 days from shipment, so your package is on schedule and expected to arrive soon. Thank you for your patience!",
  "confidence": "high - order is active in transit within expected delivery window",
  "trace_id": "52857e62a123...",
  "prompt_version": "v1",
  "agent_version": "v1"
}
```

---

## 🛠️ CLI Execution

The agent can also be executed directly via the CLI either on the host or inside Docker:

### Inside Docker Container:
```bash
docker compose run agent python run.py --tickets shopsphere_data/tickets.json --out eval_results.json
```

### On Host (Local Python 3.12 Virtual Environment):
```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Run CLI across tickets
python run.py --tickets shopsphere_data/tickets.json --out eval_results.json
```

---

## 🧪 Quality Gate & Evaluation Harness

The test harness evaluates the agent against ground-truth labels for all 25 tickets and performs an independent guardrail audit on the SQLite action log.

To run the offline eval gate in CI without an API key:
```bash
make eval
```
or manually:
```bash
python run.py --tickets shopsphere_data/tickets.json --out eval_results.json --replay recorded_responses/responses.json --db-path eval.db
python eval.py --results eval_results.json --labels labels.json --db-path eval.db --threshold 90.0
```

### Quality Gate Results:
- **Action Accuracy**: **100.00%** (25/25 tickets passing)
- **Guardrail Violations (Rules 1-3)**: **0 violations**
- **Quality Gate Status**: **PASS**

### Running Unit Tests:
```bash
make test
```
Runs 21 unit tests covering:
- Rule 1 (Refund limits <= Rs 5,000, blocks > Rs 5,000)
- Rule 2 (Cumulative order cap & duplicate item refund blocks)
- Rule 3 (Customer `fraud_review` flag escalation)
- Kill Switch (`AUTO_REFUND_ENABLED=false`)
- Action log audit function
- All 5 internal tools
- All HTTP endpoints (`/healthz`, `/v1/tickets/resolve`, `/v1/escalations`, `/metrics`)

---

## 📡 Observability & Tracing (Arize Phoenix)

Every ticket is tracked as a distributed trace with spans for customer lookup, order lookup, policy retrieval, Gemini LLM generation, guardrail evaluation, and final action recording.

1. Open your browser and navigate to:
   ```
   http://localhost:6006
   ```
2. Explore individual ticket spans, execution latencies, prompt versions, token consumption, and model inference attributes.

---

## 🛑 Operational Kill Switch

To immediately disable automated refunds across the entire system:
1. In `.env`, set:
   ```env
   AUTO_REFUND_ENABLED=false
   ```
2. Restart the agent:
   ```bash
   docker compose restart agent
   ```
Every subsequent refund request will be automatically blocked by the kill switch guardrail and escalated to human review, with zero code changes required.

---

## 📊 Endpoints Reference

| Endpoint | Method | Description |
|---|---|---|
| `/v1/tickets/resolve` | `POST` | Ingests one ticket, executes tools/guardrails, returns structured JSON |
| `/v1/escalations` | `GET` | Human review queue of open escalations with summaries and reasons |
| `/healthz` | `GET` | Health check verifying Gemini API key configuration and database connectivity |
| `/metrics` | `GET` | Prometheus exposition format or JSON operational metrics |

---

## 🗂️ Repository Structure

```
├── .github/workflows/ci.yml       # Automated CI pipeline (lint, unit tests, eval gate)
├── .env.example                   # Example environment configuration (no secrets committed)
├── Dockerfile                     # Production multi-stage slim container with non-root user
├── docker-compose.yml             # Agent service + Arize Phoenix tracing stack
├── Makefile                       # Developer shortcuts (make test, make eval, make lint)
├── DESIGN.md                      # System architecture, framework tradeoffs & guardrails philosophy
├── README.md                      # This 10-minute walkthrough
├── requirements.txt               # Pinned dependencies
├── labels.json                    # Ground-truth labels with 1-line reasoning for all 25 tickets
├── eval.py                        # Quality gate evaluation harness
├── run.py                         # CLI entry point
├── server.py                      # FastAPI HTTP service
├── prompts/
│   └── v1/system.md               # Versioned system prompt
├── recorded_responses/
│   └── responses.json             # Recorded responses for offline CI replay
├── shopsphere_data/
│   ├── orders.json                # 37 orders
│   ├── customers.json             # 12 customers
│   ├── tickets.json               # 25 customer tickets in English, Hindi, and Hinglish
│   └── policies/                  # Shipping, 2025/2026 refund policies, loyalty program
├── src/
│   ├── agent.py                   # Core agent orchestrator
│   ├── config.py                  # Settings & environment variables
│   ├── db.py                      # SQLite persistence (action_log, escalations)
│   ├── guardrails.py              # Hard guardrails (Rules 1-3) & action log audit
│   ├── metrics.py                 # Prometheus and JSON operational metrics
│   ├── tools.py                   # The 5 internal tools implementation
│   └── tracing.py                 # OpenTelemetry & Arize Phoenix tracing setup
├── tests/
│   ├── test_guardrails.py         # Unit tests for Rules 1, 2, 3 and Kill Switch
│   ├── test_tools.py              # Unit tests for internal tools
│   ├── test_api.py                # Integration tests for FastAPI endpoints
│   └── test_agent_replay.py       # CI replay evaluation gate test
└── ai_logs/                       # Exported AI transcripts and session records
```
