import os
from dotenv import load_dotenv
from typing import TypedDict
from langchain_google_genai import ChatGoogleGenerativeAI
import google.generativeai as genai
from langgraph.graph import StateGraph, START, END

# Load API key securely from .env
load_dotenv()
genai.configure(api_key=os.environ["GOOGLE_API_KEY"])

# Define LLM instance
classification_llm = ChatGoogleGenerativeAI(
    model="gemini-flash-lite-latest",
    temperature=0.0
)


# ============================================================
# State definition (must come before functions that use it)
# ============================================================

class State(TypedDict):
    reviews: list[str]
    current_review: str
    classification: str
    buckets: dict[str, list[str]]


# ============================================================
# Node functions
# ============================================================

def load_reviews(state: State) -> State:
    state["reviews"] = [
        "Love this product! Works perfectly.",
        "Terrible quality. Broke after one day.",
        "Okay for the price. Not amazing.",
        "Excellent customer service and fast shipping."
    ]
    state["buckets"] = {"Positive": [], "Negative": []}
    return state


def pick_next(state: State) -> State:
    if state["reviews"]:
        state["current_review"] = state["reviews"].pop(0)
    else:
        state["current_review"] = ""
    return state


def classify(state: State) -> State:
    response = classification_llm.invoke(
        f'Classify this review as "Positive" or "Negative": "{state["current_review"]}"'
    )
    label = response.content.strip().split()[0]
    state["classification"] = label if label in ["Positive", "Negative"] else "Negative"
    return state


def bucket_review(state: State) -> State:
    state["buckets"][state["classification"]].append(state["current_review"])
    return state


def route_after_pick(state: State) -> str:
    return "classify" if state["current_review"] else END


# ============================================================
# Build the graph
# ============================================================

graph = StateGraph(State)
graph.add_node("load", load_reviews)
graph.add_node("pick", pick_next)
graph.add_node("classify", classify)
graph.add_node("bucket", bucket_review)

graph.add_edge(START, "load")
graph.add_edge("load", "pick")

graph.add_conditional_edges("pick", route_after_pick)
graph.add_edge("classify", "bucket")
graph.add_edge("bucket", "pick")

# Run the workflow
compiled = graph.compile()
final_state = compiled.invoke({})

print("✅ Results")
print("Positive:", final_state["buckets"]["Positive"])
print("Negative:", final_state["buckets"]["Negative"])