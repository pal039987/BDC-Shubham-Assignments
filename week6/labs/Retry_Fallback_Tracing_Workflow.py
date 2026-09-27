import os
from dotenv import load_dotenv
import google.generativeai as genai
from langchain_google_genai import ChatGoogleGenerativeAI
from typing import TypedDict
from langgraph.graph import StateGraph, START, END

# Load API keys securely from .env
load_dotenv()
genai.configure(api_key=os.environ["GOOGLE_API_KEY"])

# Enable LangSmith tracing
os.environ["LANGCHAIN_TRACING_V2"] = "true"

# Initialize Gemini Flash model
llm = ChatGoogleGenerativeAI(model="gemini-flash-lite-latest", temperature=0.3)


# ============================================================
# State definition
# ============================================================

class State(TypedDict):
    task: str
    answer: str
    fallback_answer: str
    attempt: int


# ============================================================
# Node functions
# ============================================================

def init_node(state: State) -> State:
    state["attempt"] = 0
    state["answer"] = ""
    state["fallback_answer"] = ""
    return state


def llm_node(state: State) -> State:
    state["attempt"] += 1
    prompt = f"Answer clearly: {state['task']}"
    try:
        resp = llm.invoke(prompt)
        state["answer"] = resp.content.strip()
    except Exception:
        state["answer"] = ""
    return state


def fallback_node(state: State) -> State:
    if not state["answer"] and state["attempt"] >= 2:
        state["fallback_answer"] = f"😔 Sorry, I couldn't answer: {state['task']}"
    return state


def route_after_llm(state: State) -> str:
    if state["answer"]:
        return END
    elif state["attempt"] < 2:
        return "call_llm"
    else:
        return "fallback"


# ============================================================
# Build the graph
# ============================================================

graph = StateGraph(State)
graph.add_node("init", init_node)
graph.add_node("call_llm", llm_node)
graph.add_node("fallback", fallback_node)

graph.add_edge(START, "init")
graph.add_edge("init", "call_llm")
graph.add_conditional_edges("call_llm", route_after_llm)
graph.add_edge("fallback", END)

compiled_graph = graph.compile()


# ============================================================
# Run the workflow
# ============================================================

input_state = {"task": "Explain quantum entanglement in simple terms."}
final_state = compiled_graph.invoke(input_state)

print("✅ Final Output")
print("Answer:", final_state["answer"])
print("Fallback:", final_state["fallback_answer"])
print("Attempts:", final_state["attempt"])