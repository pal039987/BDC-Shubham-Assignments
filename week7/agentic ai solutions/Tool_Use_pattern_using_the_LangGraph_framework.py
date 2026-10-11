# ============================================================
# STEP 1: INSTALL REQUIRED LIBRARIES
# ============================================================

# !pip install -q -U langgraph langchain langchain-google-genai python-dotenv


# ============================================================
# STEP 2: IMPORTS AND SETUP
# ============================================================

import os
from typing import TypedDict

from dotenv import load_dotenv

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.tools import tool
from langgraph.graph import StateGraph, START, END


# ============================================================
# STEP 3: LOAD .ENV
# ============================================================

load_dotenv()

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

if not GOOGLE_API_KEY:
    raise ValueError(
        "GOOGLE_API_KEY not found in .env file.\n"
        "Please add GOOGLE_API_KEY=YOUR_API_KEY to .env"
    )

print("GOOGLE_API_KEY loaded successfully.")


# ============================================================
# STEP 4: INITIALIZE GEMINI
# ============================================================

llm = ChatGoogleGenerativeAI(
    model="gemini-flash-lite-latest",
    temperature=0.0,
    google_api_key=GOOGLE_API_KEY,
    max_retries=2,
)


# ============================================================
# STEP 5: TEST GEMINI
# ============================================================

test_response = llm.invoke(
    "Hello, are you working? Reply with a short confirmation."
)

print("\nGemini test response:")
print(test_response.content)


# ============================================================
# STEP 6: DEFINE SUMMARIZATION TOOL
# ============================================================

@tool
def summarize_text(text: str) -> str:
    """Summarize long content into a few key points."""

    response = llm.invoke(
        f"""
Summarize the following text into a few clear and concise
key points.

Text:
{text}
"""
    )

    return response.content


# ============================================================
# STEP 7: DEFINE GRAPH STATE
# ============================================================

class GraphState(TypedDict):
    """
    Shared state of the LangGraph workflow.

    input  -> user input
    output -> final response
    """

    input: str
    output: str


# ============================================================
# STEP 8: DEFINE TOOL ROUTER NODE
# ============================================================

def tool_router(state: GraphState):
    """
    Decide whether to use the summarization tool
    or answer directly with Gemini.
    """

    question = state["input"]

    if "summarize" in question.lower():

        summary = summarize_text.invoke({
            "text": question
        })

        return {
            "output": summary
        }

    response = llm.invoke(
        f"Answer this query clearly and concisely:\n\n{question}"
    )

    return {
        "output": response.content
    }


# ============================================================
# STEP 9: BUILD LANGGRAPH
# ============================================================

graph = StateGraph(GraphState)

# Add node
graph.add_node("tool_use_node", tool_router)

# Start -> node
graph.add_edge(START, "tool_use_node")

# Node -> End
graph.add_edge("tool_use_node", END)

# Compile
runnable_graph = graph.compile()


# ============================================================
# STEP 10: TEST 1 - SUMMARIZATION
# ============================================================

print("\n" + "=" * 60)
print("TEST 1: SUMMARIZATION")
print("=" * 60)

user_query_1 = {
    "input": (
        "Can you summarize this? "
        "Artificial intelligence is a broad field that includes "
        "machine learning, natural language processing, robotics, "
        "computer vision, and many other areas. "
        "These technologies are increasingly used in healthcare, "
        "finance, education, transportation, and business."
    )
}

result_1 = runnable_graph.invoke(user_query_1)

print("\nOutput:")
print(result_1["output"])


# ============================================================
# STEP 11: TEST 2 - DIRECT QUESTION ANSWERING
# ============================================================

print("\n" + "=" * 60)
print("TEST 2: DIRECT QUESTION")
print("=" * 60)

user_query_2 = {
    "input": "What is the capital of France?"
}

result_2 = runnable_graph.invoke(user_query_2)

print("\nOutput:")
print(result_2["output"])


# ============================================================
# STEP 12: TEST 3 - ANOTHER SUMMARIZATION
# ============================================================

print("\n" + "=" * 60)
print("TEST 3: ANOTHER SUMMARIZATION")
print("=" * 60)

user_query_3 = {
    "input": (
        "Summarize the theory of relativity in simple words. "
        "Explain the main idea without using complicated terminology."
    )
}

result_3 = runnable_graph.invoke(user_query_3)

print("\nOutput:")
print(result_3["output"])


# ============================================================
# STEP 13: GRAPH FLOW
# ============================================================

print("\n" + "=" * 60)
print("GRAPH FLOW")
print("=" * 60)

print("START -> TOOL_USE_NODE -> END")