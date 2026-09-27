# Simple Agent (Dockerized)

A minimal tool-using AI agent packaged in Docker for local testing. It exposes a small HTTP API built with FastAPI and uses the Anthropic SDK to run an agent loop that can call tools.

Use it as a starting template: replace the tools or the agent logic in `app/agent.py`, and the Docker setup keeps working.

---

## Contents

- [Features](#features)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [API Reference](#api-reference)
- [Testing the Agent](#testing-the-agent)
- [Docker Compose](#docker-compose)
- [Development Workflow](#development-workflow)
- [Adding a New Tool](#adding-a-new-tool)
- [Troubleshooting](#troubleshooting)
- [Cleanup](#cleanup)

---

## Features

- Agent loop with tool calling (up to `AGENT_MAX_STEPS` steps per request)
- Two example tools: `get_current_time` and `add_numbers`
- REST API with `/health` and `/chat` endpoints
- Interactive Swagger UI at `/docs`
- Slim Python 3.12 image, runs as a non-root user
- Built-in Docker health check
- Secrets passed through `.env` at runtime (never baked into the image)

---

## Project Structure

```
agent-docker/
├── Dockerfile            # Image definition
├── docker-compose.yml    # One-command build and run
├── requirements.txt      # Python dependencies
├── .env.example          # Template for environment variables
├── .dockerignore         # Files excluded from the image
├── README.md             # This file
└── app/
    ├── __init__.py
    └── agent.py          # Agent logic, tools, and API
```

---

## Prerequisites

| Requirement | Check with |
|---|---|
| Docker Desktop (Windows/Mac) or Docker Engine (Linux) | `docker --version` |
| Docker daemon running | `docker info` |
| Docker Compose v2 (optional) | `docker compose version` |
| An Anthropic API key | https://console.anthropic.com |

---

## Quick Start

**1. Go to the project folder**

```bash
cd agent-docker
```

**2. Create your `.env` file**

```bash
cp .env.example .env
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Open `.env` and set your real `ANTHROPIC_API_KEY`.

**3. Build the image**

```bash
docker build -t simple-agent:local .
```

**4. Run the container**

```bash
docker run -d --name simple-agent --env-file .env -p 8000:8000 simple-agent:local
```

**5. Verify it is running**

```bash
docker ps
curl http://localhost:8000/health
```

Expected response:

```json
{"status": "ok", "model": "claude-sonnet-5"}
```

You are ready to test.

---

## Configuration

All settings are environment variables, set in `.env`:

| Variable | Default | Description |
|---|---|---|
| `ANTHROPIC_API_KEY` | (required) | Your Anthropic API key |
| `AGENT_MODEL` | `claude-sonnet-5` | Model used by the agent |
| `AGENT_MAX_STEPS` | `5` | Max tool-call rounds per request |
| `PORT` | `8000` | Port the server listens on inside the container |

Changing a value in `.env` only requires restarting the container, not rebuilding the image.

---

## API Reference

### `GET /health`

Liveness check.

**Response**

```json
{"status": "ok", "model": "claude-sonnet-5"}
```

### `POST /chat`

Runs the agent on a user message.

**Request body**

```json
{"message": "What is 245.5 plus 19.25?"}
```

**Response**

```json
{
  "reply": "245.5 plus 19.25 equals 264.75.",
  "tools_used": ["add_numbers"]
}
```

**Errors**

| Status | Meaning |
|---|---|
| `422` | Request body is missing `message` or is not valid JSON |
| `500` | Agent or API error; the `detail` field contains the message |

---

## Testing the Agent

### Option A: curl (Linux, Mac, Git Bash, WSL)

```bash
# Health
curl http://localhost:8000/health

# Plain question (no tools)
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Say hello in one sentence."}'

# Triggers add_numbers
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What is 245.5 plus 19.25?"}'

# Triggers both tools
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What time is it in UTC, and what is 10 plus 32?"}'
```

### Option B: Windows PowerShell

```powershell
Invoke-RestMethod -Uri http://localhost:8000/health

Invoke-RestMethod -Uri http://localhost:8000/chat -Method Post `
  -ContentType "application/json" `
  -Body '{"message": "What is 245.5 plus 19.25?"}'
```

### Option C: Browser (Swagger UI)

1. Open http://localhost:8000/docs
2. Expand `POST /chat` and click **Try it out**
3. Enter a message and click **Execute**

### What to check

- `/health` returns `status: ok`
- `docker ps` shows the container as `(healthy)` after about 10 seconds
- Math questions list `add_numbers` in `tools_used`
- Time questions list `get_current_time` in `tools_used`
- `docker logs simple-agent` shows each request with no errors

---

## Docker Compose

Compose replaces the separate build and run commands:

```bash
docker compose up --build -d   # build and start in background
docker compose ps              # status
docker compose logs -f         # follow logs
docker compose restart         # restart after editing .env
docker compose down            # stop and remove
```

---

## Development Workflow

After changing any code in `app/` or `requirements.txt`, rebuild:

```bash
docker stop simple-agent && docker rm simple-agent
docker build -t simple-agent:local .
docker run -d --name simple-agent --env-file .env -p 8000:8000 simple-agent:local
```

Or with Compose:

```bash
docker compose up --build -d
```

Useful commands while developing:

```bash
docker logs -f simple-agent          # stream logs
docker exec -it simple-agent sh      # shell inside the container
docker inspect --format='{{.State.Health.Status}}' simple-agent   # health status
```

---

## Adding a New Tool

Tools live in `app/agent.py`. Adding one takes three steps.

**1. Write the Python function** (it must return a string):

```python
def multiply_numbers(a: float, b: float) -> str:
    return str(a * b)
```

**2. Register it in `TOOL_FUNCS`:**

```python
TOOL_FUNCS = {
    "get_current_time": get_current_time,
    "add_numbers": add_numbers,
    "multiply_numbers": multiply_numbers,
}
```

**3. Describe it in `TOOLS`** so the model knows when to use it:

```python
{
    "name": "multiply_numbers",
    "description": "Multiplies two numbers and returns the product.",
    "input_schema": {
        "type": "object",
        "properties": {"a": {"type": "number"}, "b": {"type": "number"}},
        "required": ["a", "b"],
    },
},
```

Rebuild the image and test with a question like "What is 12 times 7?".

---

## Troubleshooting

| Problem | Cause | Fix |
|---|---|---|
| `port is already allocated` | Port 8000 is in use | Run with `-p 8080:8000` and call `localhost:8080` |
| `Conflict. The container name "/simple-agent" is already in use` | Old container still exists | `docker rm -f simple-agent` |
| `/chat` returns 500 with an authentication error | Missing or invalid API key | Check `ANTHROPIC_API_KEY` in `.env`, then restart |
| `/chat` returns 500 mentioning the model | Model name not available to your key | Change `AGENT_MODEL` in `.env` |
| Container exits immediately | Python error at startup | `docker logs simple-agent` |
| Health status stays `starting` or `unhealthy` | Server not responding | Check logs; confirm `PORT` matches the `-p` mapping |
| Code changes do not appear | Image was not rebuilt | Rebuild (see Development Workflow) |
| `curl` fails in PowerShell | PowerShell aliases `curl` differently | Use `Invoke-RestMethod` or `curl.exe` |
| `docker: command not found` or daemon error | Docker not installed or not running | Start Docker Desktop / Docker service |

---

## Cleanup

```bash
docker stop simple-agent
docker rm simple-agent
docker rmi simple-agent:local
```

Or with Compose:

```bash
docker compose down --rmi local
```

---

## Security Notes

- Never commit `.env`; only `.env.example` belongs in version control.
- `.dockerignore` excludes `.env` so your key is never copied into the image.
- The container runs as a non-root user (`agent`, UID 1000).
