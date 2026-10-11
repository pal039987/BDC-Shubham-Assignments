# ============================================================
# 1. INSTALL REQUIRED LIBRARIES
# ============================================================

# !pip install -q -U langchain langgraph langchain-google-genai google-genai


# ============================================================
# 2. IMPORTS
# ============================================================

import os
from getpass import getpass
from typing import TypedDict
from dotenv import load_dotenv
from flask.cli import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI
from langgraph.graph import StateGraph, START, END


# ============================================================
# 3. GET GEMINI API KEY
# ============================================================


# Load variables from .env file
load_dotenv()

# Read Gemini API key
api_key = os.getenv("GOOGLE_API_KEY")

if not api_key:
    raise ValueError(
        "GOOGLE_API_KEY not found. "
        "Make sure your .env file exists and contains "
        "GOOGLE_API_KEY=your_api_key"
    )

print("GOOGLE_API_KEY loaded successfully.")


# ============================================================
# 4. INITIALIZE GEMINI MODEL
# ============================================================

llm = ChatGoogleGenerativeAI(
    model="gemini-flash-lite-latest",
    google_api_key=os.environ["GOOGLE_API_KEY"],
    temperature=0.2,
    max_retries=2,
)


# ============================================================
# 5. TEST GEMINI API
# ============================================================

try:
    response = llm.invoke("Hello, are you working?")

    print("Gemini API test successful.")
    print("\nGemini response:")
    print(response.content)

except Exception as e:
    print("Gemini API test failed.")
    print("Error:", e)


# ============================================================
# 6. DEFINE SHARED AGENT STATE
# ============================================================

class AgentState(TypedDict):
    input: str
    summary: str
    agent_1_response: str
    agent_2_response: str


# ============================================================
# 7. AGENT 1
#    Extracts key points from the input
# ============================================================

def agent1(state: AgentState):
    user_input = state["input"]

    response = llm.invoke(
        f"""
Extract the key points from the following text.

Text:
{user_input}

Return the key points clearly and concisely.
"""
    )

    return {
        "agent_1_response": response.content
    }


# ============================================================
# 8. AGENT 2
#    Suggests improvements
# ============================================================

def agent2(state: AgentState):
    user_input = state["input"]

    response = llm.invoke(
        f"""
Suggest improvements for the following text.

Text:
{user_input}

Focus on:
- clarity
- grammar
- readability
- precision

Give practical suggestions.
"""
    )

    return {
        "agent_2_response": response.content
    }


# ============================================================
# 9. SUPERVISOR
#    Combines outputs from Agent 1 and Agent 2
# ============================================================

def supervisor(state: AgentState):
    combined = (
        "Summary:\n"
        f"{state['agent_1_response']}\n\n"
        "Suggestions:\n"
        f"{state['agent_2_response']}"
    )

    return {
        "summary": combined
    }


# ============================================================
# 10. SAMPLE INPUT
# ============================================================

input_text = (
    "OpenAI's ChatGPT has revolutionized conversational AI "
    "by introducing context-aware large language models "
    "into mainstream applications."
)


# ============================================================
# 11. NETWORK PATTERN
#     Agent 1 and Agent 2 run in parallel
# ============================================================

network_graph = StateGraph(AgentState)

# Add nodes
network_graph.add_node("agent1", agent1)
network_graph.add_node("agent2", agent2)
network_graph.add_node("supervisor", supervisor)

# Start both agents
network_graph.add_edge(START, "agent1")
network_graph.add_edge(START, "agent2")

# Both agents send their results to supervisor
network_graph.add_edge("agent1", "supervisor")
network_graph.add_edge("agent2", "supervisor")

# Supervisor ends the graph
network_graph.add_edge("supervisor", END)

# Compile graph
network_app = network_graph.compile()


# ============================================================
# 12. RUN NETWORK PATTERN
# ============================================================

print("\n" + "=" * 60)
print("NETWORK PATTERN")
print("=" * 60)

result = network_app.invoke({
    "input": input_text
})

print("\nFinal Output (Network Pattern):\n")
print(result["summary"])


# ============================================================
# 13. SEQUENTIAL / SUPERVISOR PATTERN
#     Agent 1 -> Agent 2 -> Supervisor
# ============================================================

supervisor_graph = StateGraph(AgentState)

# Add nodes
supervisor_graph.add_node("agent1", agent1)
supervisor_graph.add_node("agent2", agent2)
supervisor_graph.add_node("supervisor", supervisor)

# Sequential flow
supervisor_graph.add_edge(START, "agent1")
supervisor_graph.add_edge("agent1", "agent2")
supervisor_graph.add_edge("agent2", "supervisor")

# End
supervisor_graph.add_edge("supervisor", END)

# Compile
supervisor_app = supervisor_graph.compile()


# ============================================================
# 14. RUN SEQUENTIAL PATTERN
# ============================================================

print("\n" + "=" * 60)
print("SEQUENTIAL / SUPERVISOR PATTERN")
print("=" * 60)

result2 = supervisor_app.invoke({
    "input": input_text
})

print("\nFinal Output (Sequential / Supervisor Pattern):\n")
print(result2["summary"])