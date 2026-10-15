# Multi-stage Dockerfile for ShopSphere Support Agent
# Stage 1: Build & Dependencies
FROM python:3.12-slim AS builder

WORKDIR /build

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

# Stage 2: Production Runtime
FROM python:3.12-slim AS runtime

# Install curl for HEALTHCHECK
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN groupadd -g 1000 appuser && \
    useradd -u 1000 -g appuser -m -s /bin/bash appuser

WORKDIR /app

# Copy installed Python packages from builder
COPY --from=builder /install /usr/local

# Create data directory for SQLite persistence with permissions for appuser
RUN mkdir -p /data && chown -R appuser:appuser /data /app

# Copy application code
COPY --chown=appuser:appuser src/ ./src/
COPY --chown=appuser:appuser prompts/ ./prompts/
COPY --chown=appuser:appuser shopsphere_data/ ./shopsphere_data/
COPY --chown=appuser:appuser recorded_responses/ ./recorded_responses/
COPY --chown=appuser:appuser labels.json ./labels.json
COPY --chown=appuser:appuser run.py server.py eval.py ./

# Switch to non-root user
USER appuser

ENV PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app \
    DB_PATH=/data/shopsphere.db \
    DATA_DIR=/app/shopsphere_data

EXPOSE 8000

# Docker Healthcheck
HEALTHCHECK --interval=15s --timeout=4s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/healthz || exit 1

# Default command: Start FastAPI server
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8000"]
