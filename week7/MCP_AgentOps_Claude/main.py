#!/usr/bin/env python3
"""
MCP Calculator Server with AgentOps Integration
Windows-safe version
"""
import logging
import os
import sys
from typing import Dict, Any

# Windows UTF-8 support
if sys.platform == "win32":
    os.environ["PYTHONIOENCODING"] = "utf-8"


# --------------------------------------------------
# Load .env
# --------------------------------------------------


logging.basicConfig(
    filename="agentops.log",
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s"
)

logger = logging.getLogger(__name__)


try:
    from dotenv import load_dotenv

    load_dotenv()
except ImportError:
    pass


# --------------------------------------------------
# AgentOps setup
# --------------------------------------------------

agentops = None
agentops_session = None
AGENTOPS_ENABLED = False


def init_agentops() -> bool:
    """Initialize AgentOps if an API key is available."""
    global agentops
    global agentops_session
    global AGENTOPS_ENABLED

    api_key = os.getenv("AGENTOPS_API_KEY")

    if not api_key:
        return False

    try:
        import agentops as ao

        agentops = ao

        agentops_session = agentops.init(
            api_key=api_key,
            tags=["mcp-server", "calculator", "fastmcp"],
        )

        AGENTOPS_ENABLED = True
        return True

    except Exception:
        agentops = None
        agentops_session = None
        AGENTOPS_ENABLED = False
        return False


init_agentops()


# --------------------------------------------------
# MCP
# --------------------------------------------------

try:
    from mcp.server.fastmcp import FastMCP
except ImportError:
    sys.exit(1)


mcp = FastMCP("calculator-server")


# --------------------------------------------------
# AgentOps logging
# --------------------------------------------------

def log_to_agentops(
    operation: str,
    inputs: Dict[str, Any],
    result: Any = None,
    error: str = None,
) -> None:
    """Record calculator operations in AgentOps."""

    if not AGENTOPS_ENABLED or agentops_session is None:
        return

    try:
        from agentops import ActionEvent

        event_params = {
            "operation": operation,
            "inputs": inputs,
        }

        if error is not None:
            event_params["error"] = error

        event = ActionEvent(
            action_type=f"calculator_{operation}",
            params=event_params,
            returns=result,
        )

        agentops_session.record(event)

    except Exception:
        # AgentOps failure should never break the MCP server.
        pass


# --------------------------------------------------
# Calculator Tools
# --------------------------------------------------

@mcp.tool()
def add(a: int, b: int) -> int:
    """Add two numbers and return the result."""

    result = a + b

    logger.info(f"add called: {a} + {b} = {result}")

    log_to_agentops(
        "add",
        {"a": a, "b": b},
        result=result,
    )

    return result


@mcp.tool()
def subtract(a: int, b: int) -> int:
    """Subtract the second number from the first."""

    result = a - b

    logger.info(f"subtract called: {a} - {b} = {result}")

    log_to_agentops(
        "subtract",
        {"a": a, "b": b},
        result=result,
    )

    return result


@mcp.tool()
def multiply(a: int, b: int) -> int:
    """Multiply two numbers."""

    result = a * b

    logger.info(f"multiply called: {a} * {b} = {result}")

    log_to_agentops(
        "multiply",
        {"a": a, "b": b},
        result=result,
    )

    return result


@mcp.tool()
def divide(a: float, b: float) -> float:
    """Divide the first number by the second."""

    if b == 0:
        error_message = "Cannot divide by zero."

        log_to_agentops(
            "divide",
            {"a": a, "b": b},
            error=error_message,
        )

        raise ZeroDivisionError(error_message)

    result = a / b

    logger.info(f"divide called: {a} / {b} = {result}")

    log_to_agentops(
        "divide",
        {"a": a, "b": b},
        result=result,
    )

    return result


@mcp.tool()
def power(a: float, b: float) -> float:
    """Raise the first number to the power of the second."""

    result = a ** b

    logger.info(f"power called: {a} ** {b} = {result}")

    log_to_agentops(
        "power",
        {"a": a, "b": b},
        result=result,
    )

    return result


@mcp.tool()
def sqrt(a: float) -> float:
    """Calculate the square root of a non-negative number."""

    if a < 0:
        error_message = "Cannot calculate square root of a negative number."

        log_to_agentops(
            "sqrt",
            {"a": a},
            error=error_message,
        )

        raise ValueError(error_message)

    import math

    result = math.sqrt(a)

    logger.info(f"sqrt called: {a} = {result}")

    log_to_agentops(
        "sqrt",
        {"a": a},
        result=result,
    )

    return result


# --------------------------------------------------
# Resources
# --------------------------------------------------

@mcp.resource("calculator://greet/{name}")
def calculator_greeting(name: str) -> str:
    """Get a personalized calculator greeting."""

    greeting = (
        f"Hello, {name}! "
        "Ready to perform some calculations?"
    )

    log_to_agentops(
        "greeting",
        {"name": name},
        result=greeting,
    )

    return greeting


@mcp.resource("calculator://usage")
def get_usage_guide() -> str:
    """Get the calculator usage guide."""

    usage_content = """
Calculator MCP Server Usage Guide

Available Tools:
- add(a, b)       - Add two numbers
- subtract(a, b)  - Subtract b from a
- multiply(a, b)  - Multiply two numbers
- divide(a, b)    - Divide a by b
- power(a, b)     - Raise a to the power of b
- sqrt(a)         - Calculate square root of a

Examples:
- add(15, 25) = 40
- subtract(100, 30) = 70
- multiply(7, 8) = 56
- divide(84, 12) = 7.0
- power(2, 8) = 256.0
- sqrt(64) = 8.0

Resources:
- calculator://greet/{name}
- calculator://usage

Prompt:
- calculator_prompt(a, b, operation)

Features:
- AgentOps operation tracking
- Error handling
- Integer and float calculations
- Input validation
""".strip()

    log_to_agentops(
        "usage_guide",
        {},
        result=f"Generated ({len(usage_content)} chars)",
    )

    return usage_content


# --------------------------------------------------
# Prompt
# --------------------------------------------------

@mcp.prompt()
def calculator_prompt(
    a: float,
    b: float,
    operation: str,
) -> str:
    """Execute a calculation and return a readable result."""

    operation = operation.lower().strip()

    log_to_agentops(
        "prompt_start",
        {
            "a": a,
            "b": b,
            "operation": operation,
        },
    )

    try:

        if operation == "add":
            result = add(int(a), int(b))

        elif operation == "subtract":
            result = subtract(int(a), int(b))

        elif operation == "multiply":
            result = multiply(int(a), int(b))

        elif operation == "divide":
            result = divide(a, b)

        elif operation == "power":
            result = power(a, b)

        elif operation == "sqrt":
            result = sqrt(a)

        else:
            return (
                f"Error: Invalid operation '{operation}'. "
                "Available operations: "
                "add, subtract, multiply, divide, power, sqrt."
            )

        response = (
            f"The result of {operation}({a}, {b}) is {result}."
        )

        log_to_agentops(
            "prompt_success",
            {
                "a": a,
                "b": b,
                "operation": operation,
            },
            result=response,
        )

        return response

    except ZeroDivisionError:
        error_response = "Error: Division by zero is not allowed."

        log_to_agentops(
            "prompt_error",
            {
                "a": a,
                "b": b,
                "operation": operation,
            },
            error=error_response,
        )

        return error_response

    except ValueError as error:
        error_response = f"Error: {error}"

        log_to_agentops(
            "prompt_error",
            {
                "a": a,
                "b": b,
                "operation": operation,
            },
            error=error_response,
        )

        return error_response


# --------------------------------------------------
# Health Check
# --------------------------------------------------

@mcp.tool()
def health_check() -> Dict[str, Any]:
    """Check calculator MCP server health."""

    status = {
        "server_status": "healthy",
        "agentops_enabled": AGENTOPS_ENABLED,
        "available_operations": [
            "add",
            "subtract",
            "multiply",
            "divide",
            "power",
            "sqrt",
        ],
        "python_version": sys.version.split()[0],
        "platform": sys.platform,
    }

    log_to_agentops(
        "health_check",
        {},
        result=status,
    )

    return status


# --------------------------------------------------
# Main
# --------------------------------------------------

def main() -> None:
    """Start the MCP server using stdio."""

    try:
        mcp.run(transport="stdio")

    except KeyboardInterrupt:
        pass

    finally:
        cleanup()


def cleanup() -> None:
    """Cleanly end the AgentOps session."""

    if AGENTOPS_ENABLED and agentops_session is not None:
        try:
            agentops_session.end_session("Success")
        except Exception:
            pass


if __name__ == "__main__":
    main()