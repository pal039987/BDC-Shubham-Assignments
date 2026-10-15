"""
OpenTelemetry and Arize Phoenix tracing module for ShopSphere Support Agent.
"""
import uuid
import time
import logging
from contextlib import contextmanager
from typing import Dict, Any, Optional

from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.sdk.resources import Resource
from src.config import settings

logger = logging.getLogger("shopsphere.tracing")

# Initialize TracerProvider
resource = Resource.create({
    "service.name": "shopsphere-agent",
    "service.version": settings.AGENT_VERSION,
    "deployment.environment": "production"
})

provider = TracerProvider(resource=resource)

import urllib.parse
import socket

# Check if OTLP endpoint is reachable before attaching remote exporter
def is_otlp_reachable(endpoint_url: str) -> bool:
    try:
        parsed = urllib.parse.urlparse(endpoint_url)
        host = parsed.hostname or "localhost"
        port = parsed.port or (4318 if "http" in parsed.scheme else 4317)
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(0.3)
        result = sock.connect_ex((host, port))
        sock.close()
        return result == 0
    except Exception:
        return False

if settings.TRACING_ENABLED and is_otlp_reachable(settings.OTEL_EXPORTER_OTLP_ENDPOINT):
    try:
        from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter
        otlp_exporter = OTLPSpanExporter(
            endpoint=f"{settings.OTEL_EXPORTER_OTLP_ENDPOINT}/v1/traces",
            timeout=1
        )
        provider.add_span_processor(BatchSpanProcessor(otlp_exporter))
        logger.info("Configured OTLP Span Exporter for Arize Phoenix at %s", settings.OTEL_EXPORTER_OTLP_ENDPOINT)
    except Exception as e:
        logger.warning("Could not initialize OTLP HTTP trace exporter: %s", e)
else:
    logger.info("OTLP endpoint %s is not active; tracing locally in-memory.", settings.OTEL_EXPORTER_OTLP_ENDPOINT)

trace.set_tracer_provider(provider)
tracer = trace.get_tracer("shopsphere.agent", settings.AGENT_VERSION)

def generate_trace_id() -> str:
    """Returns a 32-character hex trace ID string."""
    return uuid.uuid4().hex

@contextmanager
def ticket_span(ticket_id: str, trace_id: Optional[str] = None, attributes: Optional[Dict[str, Any]] = None):
    """Context manager for tracing the full lifecycle of a ticket."""
    tid = trace_id or generate_trace_id()
    attrs = {
        "shopsphere.ticket_id": ticket_id,
        "shopsphere.trace_id": tid,
        "shopsphere.agent_version": settings.AGENT_VERSION,
        "shopsphere.prompt_version": settings.PROMPT_VERSION,
    }
    if attributes:
        attrs.update(attributes)

    with tracer.start_as_current_span(f"ticket:{ticket_id}", attributes=attrs) as span:
        try:
            yield span, tid
        except Exception as exc:
            span.record_exception(exc)
            span.set_status(trace.StatusCode.ERROR, str(exc))
            raise

@contextmanager
def sub_span(name: str, attributes: Optional[Dict[str, Any]] = None):
    """Context manager for nested spans: llm_call, tool_call, guardrail_check."""
    attrs = attributes or {}
    with tracer.start_as_current_span(name, attributes=attrs) as span:
        start_t = time.perf_counter()
        try:
            yield span
        except Exception as exc:
            span.record_exception(exc)
            span.set_status(trace.StatusCode.ERROR, str(exc))
            raise
        finally:
            elapsed_ms = (time.perf_counter() - start_t) * 1000
            span.set_attribute("duration_ms", elapsed_ms)
