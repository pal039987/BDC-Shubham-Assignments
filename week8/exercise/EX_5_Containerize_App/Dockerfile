# ============================================================
# Dockerfile
# ============================================================

FROM python:3.12-slim

# Prevent Python from creating .pyc files
ENV PYTHONDONTWRITEBYTECODE=1

# Send Python output directly to terminal logs
ENV PYTHONUNBUFFERED=1

# Container working directory
WORKDIR /app

# Install system dependency required by some Python packages
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for Docker layer caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY main.py .

# Cloud Run default HTTP port
EXPOSE 8080

# Cloud Run provides PORT.
# Default to 8080 for local Docker execution.
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8080}"]