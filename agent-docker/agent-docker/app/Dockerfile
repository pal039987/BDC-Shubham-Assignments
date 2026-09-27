# ---------- Base image ----------
FROM python:3.12-slim

# Python runtime settings: no .pyc files, unbuffered logs (so docker logs shows output immediately)
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PORT=8000

WORKDIR /app

# ---------- Dependencies (cached layer) ----------
COPY requirements.txt .
RUN pip install --upgrade pip && pip install -r requirements.txt

# ---------- Application code ----------
COPY . .

# ---------- Run as non-root user ----------
RUN useradd --create-home --uid 1000 agent && chown -R agent:agent /app
USER agent

EXPOSE 8000

# Container health check (slim image has no curl, so use Python)
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD python -c "import urllib.request,os; urllib.request.urlopen(f'http://localhost:{os.getenv(\"PORT\",\"8000\")}/health')" || exit 1

# ---------- Start the agent API ----------
CMD ["sh", "-c", "uvicorn agent:app --host 0.0.0.0 --port ${PORT}"]