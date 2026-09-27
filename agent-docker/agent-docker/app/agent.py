"""
Simple tool-using agent exposed over HTTP, built on the OpenAI API.

Endpoints:
  GET  /health  -> liveness check
  POST /chat    -> {"message": "..."} runs the agent loop and returns the reply
"""
import json
import os
from datetime import datetime, timezone

from fastapi import FastAPI, HTTPException
from openai import OpenAI
from pydantic import BaseModel

MODEL = os.getenv("AGENT_MODEL", "gpt-4o-mini")
MAX_STEPS = int(os.getenv("AGENT_MAX_STEPS", "5"))
SYSTEM_PROMPT = "You are a helpful assistant. Use tools when they help."

app = FastAPI(title="Simple Agent (OpenAI)")
api_key = os.getenv("OPENAI_API_KEY")
if not api_key:
    raise RuntimeError(
        "OPENAI_API_KEY is not set. Add it to .env or export it before starting the app."
    )

# Reads the key (and optional OPENAI_BASE_URL) from the environment.
client = OpenAI(api_key=api_key)


# ---------- Tools the agent can call ----------
def get_current_time() -> str:
    return datetime.now(timezone.utc).isoformat()


def add_numbers(a: float, b: float) -> str:
    return str(a + b)


TOOL_FUNCS = {"get_current_time": get_current_time, "add_numbers": add_numbers}

TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "get_current_time",
            "description": "Returns the current UTC date and time.",
            "parameters": {"type": "object", "properties": {}},
        },
    },
    {
        "type": "function",
        "function": {
            "name": "add_numbers",
            "description": "Adds two numbers and returns the sum.",
            "parameters": {
                "type": "object",
                "properties": {"a": {"type": "number"}, "b": {"type": "number"}},
                "required": ["a", "b"],
            },
        },
    },
]


def call_tool(name: str, raw_args: str) -> str:
    func = TOOL_FUNCS.get(name)
    if func is None:
        return f"Error: unknown tool '{name}'"
    try:
        args = json.loads(raw_args or "{}")
        return func(**args)
    except Exception as e:
        return f"Error running tool '{name}': {e}"


# ---------- Agent loop ----------
def run_agent(user_message: str) -> dict:
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": user_message},
    ]
    tools_used = []

    for _ in range(MAX_STEPS):
        response = client.chat.completions.create(
            model=MODEL,
            messages=messages,
            tools=TOOLS,
            tool_choice="auto",
        )
        msg = response.choices[0].message

        # No tool calls means the model has a final answer
        if not msg.tool_calls:
            return {"reply": msg.content or "", "tools_used": tools_used}

        # Keep the assistant turn (with its tool calls) in history
        messages.append(msg.model_dump(exclude_none=True))

        # Run each requested tool and send the result back
        for tool_call in msg.tool_calls:
            name = tool_call.function.name
            output = call_tool(name, tool_call.function.arguments)
            tools_used.append(name)
            messages.append(
                {"role": "tool", "tool_call_id": tool_call.id, "content": output}
            )

    return {"reply": "Stopped: reached max steps.", "tools_used": tools_used}


# ---------- HTTP API ----------
class ChatRequest(BaseModel):
    message: str


@app.get("/health")
def health():
    return {"status": "ok", "model": MODEL}


@app.post("/chat")
def chat(req: ChatRequest):
    try:
        return run_agent(req.message)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
