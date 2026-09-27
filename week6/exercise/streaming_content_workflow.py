import os
from typing import TypedDict

from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.messages import BaseMessage

from langgraph.graph import StateGraph, END

# --------------------------------------------------
# Task 1.1: API Configuration and LLM Initialization
# --------------------------------------------------
load_dotenv()
os.environ["GOOGLE_API_KEY"] = os.getenv("GOOGLE_API_KEY")

# Model name is read from .env so it can be swapped without touching code
# (run check_models.py if you're unsure which models are currently available)
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.8-flash")
llm = ChatGoogleGenerativeAI(model=GEMINI_MODEL, temperature=0.7, streaming=True)

print(f"LLM initialized with {GEMINI_MODEL} and streaming enabled!")

# --------------------------------------------------
# Define Workflow State
# --------------------------------------------------
class ContentWorkflowState(TypedDict):
    topic: str
    generated_article: str
    summary: str

print("ContentWorkflowState defined!")

# --------------------------------------------------
# Content Generation Node (Streaming)
# --------------------------------------------------
generation_prompt = ChatPromptTemplate.from_messages([
    ("system", "You are a helpful assistant. Generate a short, informative article (around 200-300 words) on the given topic."),
    ("user", "Topic: {topic}")
])

generation_chain = generation_prompt | llm


def generate_article_node(state: ContentWorkflowState) -> dict:
    print("\n--- Node: Generating Article (Streaming) ---")
    topic = state["topic"]
    full_article = ""

    print(f"Generating article on '{topic}':")
    for chunk in generation_chain.stream({"topic": topic}):
        if isinstance(chunk, BaseMessage) and chunk.content:
            print(chunk.content, end="", flush=True)
            full_article += chunk.content
        elif isinstance(chunk, str):
            print(chunk, end="", flush=True)
            full_article += chunk

    print("\n--- Article Generation Complete ---")
    return {"generated_article": full_article}

print("generate_article_node defined!")

# --------------------------------------------------
# Summarization Node (Streaming)
# --------------------------------------------------
summarization_prompt = ChatPromptTemplate.from_messages([
    ("system", "You are a helpful assistant. Summarize the following article concisely, focusing on key points and main ideas."),
    ("user", "Article: {article_text}")
])

summarization_chain = summarization_prompt | llm


def summarize_article_node(state: ContentWorkflowState) -> dict:
    print("\n--- Node: Summarizing Article (Streaming) ---")
    article_text = state["generated_article"]
    full_summary = ""

    print("Generating summary:")
    for chunk in summarization_chain.stream({"article_text": article_text}):
        if isinstance(chunk, BaseMessage) and chunk.content:
            print(chunk.content, end="", flush=True)
            full_summary += chunk.content
        elif isinstance(chunk, str):
            print(chunk, end="", flush=True)
            full_summary += chunk

    print("\n--- Summary Generation Complete ---")
    return {"summary": full_summary}

print("summarize_article_node defined!")

# --------------------------------------------------
# Build the Graph
# --------------------------------------------------
workflow = StateGraph(ContentWorkflowState)

workflow.add_node("generate_article", generate_article_node)
workflow.add_node("summarize_article", summarize_article_node)

workflow.set_entry_point("generate_article")

workflow.add_edge("generate_article", "summarize_article")
workflow.add_edge("summarize_article", END)

app = workflow.compile()

print("LangGraph workflow compiled!")

# --------------------------------------------------
# Run the Workflow
# --------------------------------------------------
sample_topic = "The Benefits of Renewable Energy Sources"

print(f"\n\n=========== Starting Workflow for Topic: '{sample_topic}' ===========")
initial_state = {
    "topic": sample_topic,
    "generated_article": "",
    "summary": ""
}

final_state = None
try:
    for state_update in app.stream(initial_state):
        print(f"\n[LangGraph State Update]: {state_update}")
        final_state = state_update

    print("\n--- Workflow Execution Complete --- ")

    # final_state is a dict keyed by the last node name that ran
    last_node_output = list(final_state.values())[0] if final_state else {}
    print("\nFinal Summary:\n", last_node_output.get("summary", "N/A"))
except Exception as e:
    print(f"An error occurred during workflow execution: {e}")