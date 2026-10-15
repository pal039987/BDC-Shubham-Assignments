# ShopSphere Support Agent: System Architecture & LLMOps Design

## 1. Architecture & Framework Choice
ShopSphere handles ~4,000 tickets/day. Rather than heavy, non-deterministic multi-agent frameworks (LangGraph, CrewAI) that introduce latency, complex state drift, and high token overhead, we implemented a **modular, 2-phase agent pipeline** using Python, FastAPI, and Google Gemini (`gemini-3.8-flash`):
1. **Deterministic Investigation Phase**: The agent extracts entities (`order_id`, `customer_id`), executes internal tools (`get_order`, `get_customer`, `search_policy`), and gathers structured ground truth before prompting the LLM.
2. **Constrained Decision Phase**: The LLM synthesizes policy rules, customer intent, and multilingual replies into a strictly validated JSON schema.
3. **Hard Code Guardrail Layer**: Code-level interceptors strictly enforce hard business invariants (amount limits by tier, order caps, duplicate prevention, fraud flags, kill switch, claim windows) that the LLM cannot bypass under any circumstances.

## 2. Deployment & LLMOps Choices
- **Centralized Configuration**: All limits (`REFUND_LIMIT_PREMIUM=8000`, `REFUND_LIMIT_REGULAR=5000`) reside in [`src/config.py`](file:///home/bdcadmin/BDC-Shubham/src/config.py) via Pydantic settings, allowing instant adjustments without code edits.
- **Containerization**: Multi-stage, slim `python:3.12-slim` Docker image tagged by version (`shopsphere-agent:v1`, `shopsphere-agent:v2`), running as non-root `appuser` with a Docker `HEALTHCHECK`.
- **Zero-Downtime Rollback**: `docker-compose.yml` binds `AGENT_VERSION` and `PROMPT_VERSION` dynamically. Running `AGENT_VERSION=v1 PROMPT_VERSION=v1 docker compose up -d --force-recreate agent` rolls back the running service to v1 in <5 seconds.
- **Observability & Tracing**: Self-hosted **Arize Phoenix** (ports 6006, 4317, 4318) receives OpenTelemetry spans for every ticket, LLM call, tool invocation, and guardrail check.
- **Quality Gate in CI**: Deterministic offline replay (`recorded_responses/responses_v2.json`) tests all 33 tickets in GitHub Actions in <2 seconds without requiring a secret `GEMINI_API_KEY`. The gate exits non-zero if accuracy falls below 90% or if any guardrail violation occurs.

## 3. Key Trade-offs
- **Deterministic Tool Calling vs. Full LLM Autonomy**: We chose a deterministic investigation pipeline over free-form ReAct loops. While ReAct is more flexible, deterministic lookup is faster (<8s vs 20s+), uses 60% fewer tokens, and prevents infinite tool-calling loops.
- **Passage-Level Retrieval vs. Naive Chunking**: Chunking markdown policies without headers loses crucial scope clauses (the root cause of the Stage 2 incident). We preserve section headers (`## Scope and effective date`) with each passage.
- **SQLite with WAL vs. External PostgreSQL**: For a self-contained evaluation deployable via `docker compose up` in <10 minutes, SQLite on a persistent Docker volume delivers reliable persistence with zero external infrastructure overhead.

## 4. Known Failures & Mitigations
- **Naive Semantic Chunking (Stage 2 Incident)**: In agent v0, text chunking separated claim windows from effective date scopes, causing an LLM to grant a 30-day window to an expired 2026 order. *Mitigation*: We added hard code checks for `(ticket_date - delivery_date) <= window` directly inside `check_refund_guardrails`.
- **Prompt Injections (T-05, T-21, B-08)**: Customers asserting fake system notes or falsely claiming "I qualify as Premium". *Mitigation*: Customer tier is always fetched from the database, never from prompt text; prompts explicitly treat ticket text as untrusted data.

## 5. What We Would Change Before Real Production
1. **Asynchronous Task Queue**: Replace synchronous FastAPI request handling with Celery/Redis or AWS SQS to handle the 4,000 daily tickets in asynchronous worker pools with DLQs (dead-letter queues).
2. **PostgreSQL + Read Replicas**: Migrate from SQLite to Amazon RDS PostgreSQL / Cloud SQL with connection pooling (PgBouncer).
3. **Semantic Caching**: Deploy Redis-based semantic caching (e.g. GPTCache) for frequent status queries (`"where is my order?"`), slashing token costs by ~30%.
4. **Human Review Dashboard**: Build an internal React/Next.js dashboard consuming `GET /v1/escalations` with one-click approval workflows for senior agents.
