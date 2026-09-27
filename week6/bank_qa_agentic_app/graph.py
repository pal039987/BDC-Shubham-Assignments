import os
from dotenv import load_dotenv
from typing import TypedDict
from langgraph.graph import StateGraph, END
from langchain_core.messages import HumanMessage
from langchain_google_genai import ChatGoogleGenerativeAI

load_dotenv()

GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-flash-lite-latest")
llm = ChatGoogleGenerativeAI(model=GEMINI_MODEL, google_api_key=os.getenv("GOOGLE_API_KEY"))


def extract_text(content) -> str:
    """Some models return content as a string, others as a list of content parts.
    This normalizes either case into a plain string."""
    if isinstance(content, str):
        return content.strip()
    if isinstance(content, list):
        parts = []
        for part in content:
            if isinstance(part, str):
                parts.append(part)
            elif isinstance(part, dict) and "text" in part:
                parts.append(part["text"])
        return "".join(parts).strip()
    return str(content).strip()


class GraphState(TypedDict):
    input: str
    answer: str
    compliance: str
    final_report: str


def retriever_node(state: GraphState) -> dict:
    q = state["input"]
    prompt = f"""You are a helpful internal banking assistant. Based on company policy, answer the following question:
    Question: {q}"""
    result = llm.invoke([HumanMessage(content=prompt)])
    return {"answer": extract_text(result.content)}


def compliance_node(state: GraphState) -> dict:
    answer = state["answer"]
    prompt = f"""Review the following internal response for banking policy compliance. Is it aligned with RBI/Bank regulations? Reply 'Compliant' or 'Needs Review' with reason:
    Answer: {answer}"""
    result = llm.invoke([HumanMessage(content=prompt)])
    return {"compliance": extract_text(result.content)}


def report_node(state: GraphState) -> dict:
    return {
        "final_report": f"""📋 **Answer:**\n{state.get("answer")}\n\n✅ **Compliance Check:** {state.get("compliance")}"""
    }


def build_graph():
    builder = StateGraph(GraphState)

    builder.add_node("Retriever", retriever_node)
    builder.add_node("Compliance", compliance_node)
    builder.add_node("Report", report_node)

    builder.set_entry_point("Retriever")
    builder.add_edge("Retriever", "Compliance")
    builder.add_edge("Compliance", "Report")
    builder.add_edge("Report", END)

    return builder.compile()