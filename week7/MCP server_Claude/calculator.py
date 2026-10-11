from mcp.server.fastmcp import FastMCP


# Initialize the MCP server
mcp = FastMCP("calculator-server")


# ============================================================
# TOOLS
# ============================================================

@mcp.tool()
def add(a: int, b: int) -> int:
    """Add two numbers and return the result."""
    return a + b


@mcp.tool()
def subtract(a: int, b: int) -> int:
    """Subtract the second number from the first."""
    return a - b


@mcp.tool()
def multiply(a: int, b: int) -> int:
    """Multiply two numbers."""
    return a * b


@mcp.tool()
def divide(a: float, b: float) -> float:
    """Divide the first number by the second number."""
    if b == 0:
        raise ZeroDivisionError("Division by zero is not allowed.")
    return a / b


# ============================================================
# RESOURCES
# ============================================================

@mcp.resource("calculator://greet/{name}")
def calculator_greeting(name: str) -> str:
    """Get a personalized greeting."""
    return f"Hello, {name}! Ready to calculate something today?"


@mcp.resource("usage://guide")
def get_usage() -> str:
    """Return the calculator usage guide."""
    with open("docs/usage.txt", "r", encoding="utf-8") as f:
        return f.read()


# ============================================================
# PROMPT
# ============================================================

@mcp.prompt()
def calculator_prompt(
    a: float,
    b: float,
    operation: str,
) -> str:
    """Perform a calculation and return the result as a prompt."""

    operation = operation.lower().strip()

    if operation == "add":
        result = add(a, b)
        return f"The result of adding {a} and {b} is {result}."

    elif operation == "subtract":
        result = subtract(a, b)
        return f"The result of subtracting {b} from {a} is {result}."

    elif operation == "multiply":
        result = multiply(a, b)
        return f"The result of multiplying {a} and {b} is {result}."

    elif operation == "divide":
        try:
            result = divide(a, b)
            return f"The result of dividing {a} by {b} is {result}."
        except ZeroDivisionError as e:
            return str(e)

    else:
        return (
            "Invalid operation. "
            "Please choose add, subtract, multiply, or divide."
        )


# ============================================================
# RUN SERVER
# ============================================================

if __name__ == "__main__":
    mcp.run(transport="stdio")