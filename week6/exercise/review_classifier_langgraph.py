import os
from typing import Literal
from typing_extensions import TypedDict

from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from pydantic import BaseModel, Field

from langgraph.graph import StateGraph, END

# --------------------------------------------------
# Task 1.1: API Configuration and LLM Initialization
# --------------------------------------------------
load_dotenv()
os.environ["GOOGLE_API_KEY"] = os.getenv("GOOGLE_API_KEY")

# gemini-pro is retired; use a current model. temperature=0 for consistent classification.
llm = ChatGoogleGenerativeAI(model="gemini-3.8-flash", temperature=0.0)

print("LLM initialized with Gemini 3.8 Flash!")

# --------------------------------------------------
# Task 1.2: Define Workflow State
# --------------------------------------------------
class ReviewClassificationState(TypedDict):
    review_text: str
    classification: Literal["Positive", "Negative", "Neutral", "Ambiguous", "Escalated", "N/A"]
    clarification_needed: bool
    escalation_reason: str

print("ReviewClassificationState defined!")

# --------------------------------------------------
# Task 2.1: classify_review Node
# --------------------------------------------------
class ClassificationOutput(BaseModel):
    sentiment: Literal["Positive", "Negative", "Neutral", "Ambiguous"]
    reason: str = Field(description="Brief reason for the sentiment classification.")

classification_prompt = ChatPromptTemplate.from_messages([
    ("system", "You are an expert review sentiment classifier. Classify the user's review into one of 'Positive', 'Negative', 'Neutral', or 'Ambiguous'. Provide a brief reason."),
    ("user", "Review: {review_text}")
])

classification_chain = classification_prompt | llm.with_structured_output(ClassificationOutput)


def classify_review_node(state: ReviewClassificationState) -> dict:
    print("\n--- Node: Classifying Review ---")
    review_text = state["review_text"]

    try:
        classification_result = classification_chain.invoke({"review_text": review_text})
        print(f"Raw classification result: {classification_result}")

        new_classification = classification_result.sentiment

        return {
            "classification": new_classification,
            "clarification_needed": (new_classification == "Ambiguous"),
            "escalation_reason": ""
        }
    except Exception as e:
        print(f"Error classifying review: {e}")
        return {
            "classification": "Escalated",
            "clarification_needed": False,
            "escalation_reason": f"Classification failed: {e}"
        }

print("classify_review_node defined!")

# --------------------------------------------------
# Task 2.2: request_clarification Node
# --------------------------------------------------
clarification_prompt = ChatPromptTemplate.from_messages([
    ("system", "You are a helpful assistant. The following review is ambiguous. Generate a concise question to clarify its sentiment or intent. The question should be directed to the user, or an internal note for a human agent."),
    ("user", "Ambiguous Review: {review_text}")
])

clarification_chain = clarification_prompt | llm


def request_clarification_node(state: ReviewClassificationState) -> dict:
    print("\n--- Node: Requesting Clarification ---")
    review_text = state["review_text"]

    try:
        clarification_question = clarification_chain.invoke({"review_text": review_text}).content
        print(f"Clarification requested: {clarification_question}")
        return {
            "classification": "Ambiguous",
            "clarification_needed": True,
            "escalation_reason": f"Clarification needed: {clarification_question}"
        }
    except Exception as e:
        print(f"Error requesting clarification: {e}")
        return {
            "classification": "Escalated",
            "clarification_needed": False,
            "escalation_reason": f"Failed to request clarification: {e}"
        }

print("request_clarification_node defined!")

# --------------------------------------------------
# Task 2.3: escalate_review Node
# --------------------------------------------------
def escalate_review_node(state: ReviewClassificationState) -> dict:
    print("\n--- Node: Escalating Review ---")
    current_classification = state.get("classification", "N/A")
    current_reason = state.get("escalation_reason", "")

    if current_classification == "Ambiguous":
        reason = current_reason if current_reason else "Sentiment is ambiguous and requires human review."
    else:
        reason = current_reason if current_reason else "Review requires manual review due to unexpected scenario or LLM failure."

    print(f"Review escalated. Reason: {reason}")
    return {
        "classification": "Escalated",
        "clarification_needed": False,
        "escalation_reason": reason
    }

print("escalate_review_node defined!")

# --------------------------------------------------
# Task 3.1: Define Edges and Conditional Logic
# --------------------------------------------------
workflow = StateGraph(ReviewClassificationState)

workflow.add_node("classify", classify_review_node)
workflow.add_node("clarify", request_clarification_node)
workflow.add_node("escalate", escalate_review_node)

workflow.set_entry_point("classify")


def route_classification(state: ReviewClassificationState) -> Literal["clarify", "escalate", "__end__"]:
    classification = state["classification"]
    if classification == "Ambiguous":
        return "clarify"
    elif classification == "Escalated":
        return "escalate"
    else:
        return END

workflow.add_conditional_edges(
    "classify",
    route_classification,
    {
        "clarify": "clarify",
        "escalate": "escalate",
        END: END,
    },
)

workflow.add_edge("clarify", "escalate")
workflow.add_edge("escalate", END)

app = workflow.compile()

print("LangGraph workflow compiled!")

# Optional: Visualize the graph (requires 'graphviz' and 'pydotplus')
# try:
#     graph_png = app.get_graph().draw_mermaid_png()
#     with open("workflow_graph.png", "wb") as f:
#         f.write(graph_png)
#     print("Graph saved to workflow_graph.png")
# except Exception as e:
#     print(f"Could not generate graph visualization: {e}")

# --------------------------------------------------
# Part 4: Testing the LangGraph Workflow
# --------------------------------------------------
def run_workflow_and_print_state(review_text: str):
    print(f"\n\n=========== Processing Review: '{review_text}' ===========")
    initial_state = {
        "review_text": review_text,
        "classification": "N/A",
        "clarification_needed": False,
        "escalation_reason": ""
    }

    try:
        final_state = None
        for state in app.stream(initial_state):
            print(f"Current state: {state}")
            final_state = state
        print(f"Final state for '{review_text}': {final_state}")
    except Exception as e:
        print(f"An error occurred during workflow execution: {e}")


test_reviews = [
    "This product is absolutely amazing! Exceeded all my expectations. Five stars!",
    "Worst customer service ever. My order was late and damaged. Highly disappointed.",
    "The delivery was on time, and the packaging was adequate. The item itself is functional.",
    "It's okay, I guess. Not great, but not terrible. I'm just very confused about how to use it.",
    "Meh.",
    "I love the design, but it broke after one week and the return process is a nightmare. I want a refund but also think it's a great concept."
]

for review in test_reviews:
    run_workflow_and_print_state(review)