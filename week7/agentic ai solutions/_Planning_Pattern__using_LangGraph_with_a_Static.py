# ============================================================
# STEP 1: INSTALL REQUIRED LIBRARIES
# ============================================================

# !pip install -q -U langgraph langchain langchain-google-genai python-dotenv


# ============================================================
# STEP 2: IMPORTS
# ============================================================

import os
import re
from typing import TypedDict, List

from dotenv import load_dotenv

from langchain_google_genai import ChatGoogleGenerativeAI
from langgraph.graph import StateGraph, START, END


# ============================================================
# STEP 3: LOAD .ENV
# ============================================================

load_dotenv()

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

if not GOOGLE_API_KEY:
    raise ValueError(
        "GOOGLE_API_KEY not found in .env file.\n"
        "Please add GOOGLE_API_KEY=YOUR_API_KEY"
    )

print("GOOGLE_API_KEY loaded successfully.")


# ============================================================
# STEP 4: INITIALIZE GEMINI
# ============================================================

model = ChatGoogleGenerativeAI(
    model="gemini-flash-lite-latest",
    temperature=0.0,
    google_api_key=GOOGLE_API_KEY,
    max_retries=2,
)


# ============================================================
# STEP 5: TEST GEMINI
# ============================================================

try:
    test_response = model.invoke(
        "Reply with only: Gemini is working"
    )

    print("\nGemini test:")
    print(test_response.content)

except Exception as e:
    raise RuntimeError(
        f"Gemini API test failed: {e}"
    )


# ============================================================
# STEP 6: DEFINE PLANNER STATE
# ============================================================

class PlanState(TypedDict):
    goal: str
    steps: List[str]
    current_step: int


# ============================================================
# STEP 7: STATIC PLANNER
# ============================================================

def static_planner(state: PlanState) -> PlanState:
    """
    Static planner uses a predefined plan.
    """

    print("\nStatic Planner Executing...")

    steps = [
        "Search information",
        "Analyze findings",
        "Generate report",
    ]

    return {
        **state,
        "steps": steps,
        "current_step": 0,
    }


# ============================================================
# STEP 8: DYNAMIC PLANNER
# ============================================================

def dynamic_planner(state: PlanState) -> PlanState:
    """
    Dynamic planner asks Gemini to create a plan
    based on the user's goal.
    """

    print("\nDynamic Planner Executing...")

    goal = state["goal"]

    prompt = f"""
You are an expert task planner.

Break the following goal into exactly 3 high-level steps.

Goal:
{goal}

Return ONLY 3 numbered steps.
Example:
1. First step
2. Second step
3. Third step
"""

    response = model.invoke(prompt)

    # Gemini response content can be a string or a list.
    if isinstance(response.content, list):
        text_parts = []

        for item in response.content:
            if isinstance(item, dict):
                text_parts.append(item.get("text", ""))
            else:
                text_parts.append(str(item))

        raw_content = "\n".join(text_parts).strip()

    else:
        raw_content = str(response.content).strip()

    # Parse numbered/bulleted lines
    steps = []

    for line in raw_content.splitlines():
        line = line.strip()

        if not line:
            continue

        cleaned = re.sub(
            r"^(?:\d+[\.\):\-]\s*|[-*]\s*)",
            "",
            line,
        ).strip()

        if cleaned:
            steps.append(cleaned)

    # Fallback if Gemini does not return 3 steps
    if len(steps) < 3:

        default_steps = [
            "Research relevant information",
            "Analyze the findings",
            "Create the final result",
        ]

        while len(steps) < 3:
            steps.append(default_steps[len(steps)])

    # Keep exactly 3 steps
    steps = steps[:3]

    print("\nGenerated Plan:")

    for i, step in enumerate(steps, start=1):
        print(f"{i}. {step}")

    return {
        **state,
        "steps": steps,
        "current_step": 0,
    }


# ============================================================
# STEP 9: EXECUTE CURRENT STEP
# ============================================================

def execute_step(state: PlanState) -> PlanState:
    """
    Execute the current plan step.

    In this demo, execution is simulated.
    Real tools/API calls can be added here later.
    """

    current_step = state["current_step"]
    steps = state["steps"]

    if current_step >= len(steps):
        return state

    step = steps[current_step]

    print(
        f"Executing Step {current_step + 1}: {step}"
    )

    # Simulated execution
    print(f"Completed: {step}")

    return {
        **state,
        "current_step": current_step + 1,
    }


# ============================================================
# STEP 10: ROUTER
# ============================================================

def check_continue(state: PlanState) -> str:
    """
    Continue executing steps until all are complete.
    """

    if state["current_step"] >= len(state["steps"]):
        return END

    return "execute"


# ============================================================
# STEP 11: BUILD STATIC PLAN GRAPH
# ============================================================

static_graph = StateGraph(PlanState)

static_graph.add_node(
    "plan",
    static_planner,
)

static_graph.add_node(
    "execute",
    execute_step,
)

# START -> planner
static_graph.add_edge(
    START,
    "plan",
)

# Planner -> execute
static_graph.add_edge(
    "plan",
    "execute",
)

# Execute -> execute OR END
static_graph.add_conditional_edges(
    "execute",
    check_continue,
    {
        "execute": "execute",
        END: END,
    },
)

# Compile
static_plan_executor = static_graph.compile()


# ============================================================
# STEP 12: TEST STATIC PLANNER
# ============================================================

print("\n" + "=" * 60)
print("STATIC PLANNER")
print("=" * 60)

static_initial_state: PlanState = {
    "goal": "Prepare a marketing strategy report",
    "steps": [],
    "current_step": 0,
}

static_result = static_plan_executor.invoke(
    static_initial_state
)

print("\nStatic Planner Result:")
print("Goal:", static_result["goal"])
print("Steps:", static_result["steps"])


# ============================================================
# STEP 13: BUILD DYNAMIC PLAN GRAPH
# ============================================================

dynamic_graph = StateGraph(PlanState)

dynamic_graph.add_node(
    "plan",
    dynamic_planner,
)

dynamic_graph.add_node(
    "execute",
    execute_step,
)

# START -> planner
dynamic_graph.add_edge(
    START,
    "plan",
)

# Planner -> execute
dynamic_graph.add_edge(
    "plan",
    "execute",
)

# Execute -> execute OR END
dynamic_graph.add_conditional_edges(
    "execute",
    check_continue,
    {
        "execute": "execute",
        END: END,
    },
)

# Compile
dynamic_plan_executor = dynamic_graph.compile()


# ============================================================
# STEP 14: TEST DYNAMIC PLANNER
# ============================================================

print("\n" + "=" * 60)
print("DYNAMIC PLANNER")
print("=" * 60)

dynamic_initial_state: PlanState = {
    "goal": "Design an AI assistant for customer support",
    "steps": [],
    "current_step": 0,
}

dynamic_result = dynamic_plan_executor.invoke(
    dynamic_initial_state
)

print("\nDynamic Planner Result:")
print("Goal:", dynamic_result["goal"])
print("Steps:", dynamic_result["steps"])


# ============================================================
# STEP 15: DISPLAY GRAPH FLOW
# ============================================================

print("\n" + "=" * 60)
print("GRAPH FLOW")
print("=" * 60)

print("""
STATIC:
START
  ↓
Static Planner
  ↓
Execute Step
  ↓
Execute Step
  ↓
Execute Step
  ↓
END

DYNAMIC:
START
  ↓
Gemini Dynamic Planner
  ↓
Execute Step
  ↓
Execute Step
  ↓
Execute Step
  ↓
END
""")