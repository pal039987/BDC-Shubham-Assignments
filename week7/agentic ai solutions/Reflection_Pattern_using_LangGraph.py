# ============================================================
# 1. INSTALL REQUIRED LIBRARIES
# ============================================================

# !pip install -q -U langchain langgraph langchain-google-genai python-dotenv


# ============================================================
# 2. IMPORT REQUIRED MODULES
# ============================================================

import os
from typing import TypedDict, Optional

from dotenv import load_dotenv

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from langgraph.graph import StateGraph, START, END


# ============================================================
# 3. LOAD ENVIRONMENT VARIABLES
# ============================================================

load_dotenv()

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

if not GOOGLE_API_KEY:
    raise ValueError(
        "Google API key not found. "
        "Please make sure your .env file contains "
        "GOOGLE_API_KEY=your_api_key"
    )

print("Google API key loaded successfully.")


# ============================================================
# 4. INITIALIZE GEMINI MODEL
# ============================================================

llm = ChatGoogleGenerativeAI(
    model="gemini-flash-lite-latest",
    google_api_key=GOOGLE_API_KEY,
    max_retries=2,
)


# ============================================================
# 5. TEST GEMINI API
# ============================================================

try:
    test_response = llm.invoke(
        "Hello, are you working? Reply with a short confirmation."
    )

    print("\nGemini API test successful.")
    print("Response:")
    print(test_response.content)

except Exception as e:
    raise RuntimeError(
        f"Gemini API test failed: {e}"
    )


# ============================================================
# 6. DEFINE SHARED STATE
# ============================================================

class AgentState(TypedDict):
    question: str
    initial_response: Optional[str]
    reflection: Optional[str]
    final_answer: Optional[str]


# ============================================================
# 7. DEFINE PROMPT TEMPLATES
# ============================================================

# Initial answer prompt
initial_prompt = ChatPromptTemplate.from_messages([
    (
        "system",
        "You are a helpful assistant who recommends "
        "high-quality technical articles, blogs, and learning resources."
    ),
    (
        "human",
        "{question}"
    ),
])


# Reflection prompt
reflection_prompt = ChatPromptTemplate.from_messages([
    (
        "system",
        "You are a critical reviewer. "
        "Review the initial response and identify ways to improve "
        "its accuracy, usefulness, clarity, and completeness."
    ),
    (
        "human",
        """User asked:
{question}

Initial response:
{initial_response}

What would you improve?"""
    ),
])


# Final answer prompt
final_prompt = ChatPromptTemplate.from_messages([
    (
        "system",
        "You are a helpful assistant. "
        "Create an improved final answer using the original question "
        "and the reflection."
    ),
    (
        "human",
        """Original question:
{question}

Reflection:
{reflection}

Provide the improved final answer."""
    ),
])


# ============================================================
# 8. DEFINE LANGGRAPH NODES
# ============================================================

# ------------------------------------------------------------
# Node 1: Initial Response
# ------------------------------------------------------------

def initial_node(state: AgentState) -> AgentState:

    chain = initial_prompt | llm

    response = chain.invoke({
        "question": state["question"]
    })

    return {
        **state,
        "initial_response": response.content
    }


# ------------------------------------------------------------
# Node 2: Reflection
# ------------------------------------------------------------

def reflect_node(state: AgentState) -> AgentState:

    chain = reflection_prompt | llm

    response = chain.invoke({
        "question": state["question"],
        "initial_response": state["initial_response"]
    })

    return {
        **state,
        "reflection": response.content
    }


# ------------------------------------------------------------
# Node 3: Final Answer
# ------------------------------------------------------------

def final_node(state: AgentState) -> AgentState:

    chain = final_prompt | llm

    response = chain.invoke({
        "question": state["question"],
        "reflection": state["reflection"]
    })

    return {
        **state,
        "final_answer": response.content
    }


# ============================================================
# 9. BUILD SEQUENTIAL REFLECTION GRAPH
# ============================================================

graph = StateGraph(AgentState)

# Add nodes
graph.add_node("initial", initial_node)
graph.add_node("reflect", reflect_node)
graph.add_node("final", final_node)

# Define flow
graph.add_edge(START, "initial")
graph.add_edge("initial", "reflect")
graph.add_edge("reflect", "final")
graph.add_edge("final", END)

# Compile
app = graph.compile()


# ============================================================
# 10. SAMPLE INPUT
# ============================================================

input_question = (
    "Can you suggest good technical blogs to learn about "
    "Generative AI?"
)


# ============================================================
# 11. RUN THE GRAPH
# ============================================================

result = app.invoke({
    "question": input_question
})


# ============================================================
# 12. DISPLAY RESULTS
# ============================================================

print("\n" + "=" * 70)
print("INITIAL RESPONSE")
print("=" * 70)

print(result["initial_response"])


print("\n" + "=" * 70)
print("REFLECTION")
print("=" * 70)

print(result["reflection"])


print("\n" + "=" * 70)
print("FINAL ANSWER")
print("=" * 70)

print(result["final_answer"])


# ============================================================
# 13. OPTIONAL: DISPLAY GRAPH
# ============================================================

print("\n" + "=" * 70)
print("GRAPH FLOW")
print("=" * 70)

print("START → INITIAL → REFLECT → FINAL → END")