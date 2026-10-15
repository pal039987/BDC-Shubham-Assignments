"""
FastAPI HTTP Service for ShopSphere Support Agent.
Endpoints:
  - POST /v1/tickets/resolve
  - GET /v1/escalations
  - GET /healthz
  - GET /metrics
"""
import sys
from pathlib import Path
from typing import Dict, Any, List, Optional
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import PlainTextResponse, JSONResponse
from pydantic import BaseModel, Field

# Add project root to path
sys.path.insert(0, str(Path(__file__).resolve().parent))

from src.config import settings
from src.tools import ShopSphereTools, ToolContext
from src.agent import ShopSphereAgent
from src.db import init_db, get_escalations
from src.metrics import metrics_tracker

tools: Optional[ShopSphereTools] = None
agent: Optional[ShopSphereAgent] = None
service_context: Optional[ToolContext] = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global tools, agent, service_context
    db_path = settings.get_db_path()
    init_db(db_path)
    tools = ShopSphereTools()
    agent = ShopSphereAgent(tools=tools)
    service_context = ToolContext(run_id="server_instance", db_path=db_path)
    yield

app = FastAPI(
    title="ShopSphere Support Agent API",
    version=settings.AGENT_VERSION,
    description="Automated investigation, policy enforcement and resolution for ShopSphere customer support tickets.",
    lifespan=lifespan
)

class TicketInput(BaseModel):
    ticket_id: str = Field(..., json_schema_extra={"example": "T-01"})
    customer_id: str = Field(..., json_schema_extra={"example": "C101"})
    created_at: str = Field(..., json_schema_extra={"example": "2026-09-30T10:12:00+05:30"})
    text: str = Field(..., json_schema_extra={"example": "Hi, where is my order ORD-1001?"})

class TicketOutput(BaseModel):
    ticket_id: str
    intent: str
    tool_calls: List[Dict[str, Any]]
    policy_sources: List[str]
    final_action: str
    refund_amount: Optional[float] = None
    reply: str
    confidence: str
    trace_id: str
    prompt_version: str
    agent_version: str

@app.get("/healthz")
def healthz():
    """Liveness probe reporting system status and key configuration."""
    api_key_configured = bool(settings.GEMINI_API_KEY and len(settings.GEMINI_API_KEY.strip()) > 5)
    db_path = settings.get_db_path()
    db_connected = db_path.exists() or db_path.parent.exists()
    
    return {
        "status": "ok",
        "gemini_api_key_configured": api_key_configured,
        "auto_refund_enabled": settings.AUTO_REFUND_ENABLED,
        "database": "connected" if db_connected else "disconnected",
        "agent_version": settings.AGENT_VERSION,
        "prompt_version": settings.PROMPT_VERSION,
        "model": settings.GEMINI_MODEL
    }

@app.post("/v1/tickets/resolve", response_model=TicketOutput)
def resolve_ticket(ticket: TicketInput):
    """Processes one ticket and returns the structured decision."""
    if not agent or not service_context:
        raise HTTPException(status_code=503, detail="Agent service is not initialized")

    try:
        ticket_dict = ticket.model_dump()
        result = agent.process_ticket(ticket_dict, ctx=service_context)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process ticket: {str(e)}")

@app.get("/v1/escalations")
def list_escalations(status: str = "open"):
    """Returns human review queue with open escalations and summaries."""
    items = get_escalations(settings.get_db_path(), status=status)
    return {
        "count": len(items),
        "status_filter": status,
        "escalations": items
    }

@app.get("/metrics")
def get_metrics(request: Request, format: Optional[str] = None):
    """Returns operational metrics in Prometheus text format or JSON."""
    accept = request.headers.get("accept", "")
    if format == "prometheus" or "text/plain" in accept:
        return PlainTextResponse(metrics_tracker.to_prometheus(), media_type="text/plain; version=0.0.4")
    return JSONResponse(metrics_tracker.get_summary())

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=False)
