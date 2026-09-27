import os
import random
from typing import Literal
from typing_extensions import TypedDict
from dotenv import load_dotenv
from tenacity import retry, stop_after_attempt, wait_fixed, retry_if_exception_type

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from pydantic import BaseModel, Field

from langgraph.graph import StateGraph, END

# --------------------------------------------------
# Task 1.1: API and LangSmith Configuration
# --------------------------------------------------
load_dotenv()
os.environ["GOOGLE_API_KEY"] = os.getenv("GOOGLE_API_KEY")

# Configure LangSmith (optional but recommended for tracing)
os.environ["LANGCHAIN_TRACING_V2"] = "true"
os.environ["LANGCHAIN_API_KEY"] = os.getenv("LANGCHAIN_API_KEY", "")
os.environ["LANGCHAIN_PROJECT"] = "LangGraph_Retry_Fallback_Assignment"

# gemini-pro is retired; use a current model
llm = ChatGoogleGenerativeAI(model="gemini-3.8-flash", temperature=0.7)

print("LLM and LangSmith configured!")

# --------------------------------------------------
# Task 1.2: Define Workflow State
# --------------------------------------------------
class ContentWorkflowState(TypedDict):
    topic: str
    generated_content: str
    review_feedback: str
    status: Literal["Draft", "Needs Review", "Approved", "Rejected", "Failed"]
    retries_left: int
    error_message: str

print("ContentWorkflowState defined!")


# --------------------------------------------------
# Custom exception to simulate a malformed/invalid LLM output
# (Pydantic v2's ValidationError can no longer be constructed manually,
#  so we use our own lightweight exception for the simulation)
# --------------------------------------------------
class SimulatedValidationError(Exception):
    """Simulates the LLM producing output that fails structured validation."""
    pass


# --------------------------------------------------
# Task 2.1: generate_content Node with Retry
# --------------------------------------------------
generation_prompt = ChatPromptTemplate.from_messages([
    ("system", "You are a content writer. Generate a short article (around 150-200 words) on the following topic."),
    ("user", "Topic: {topic}")
])

generation_chain = generation_prompt | llm


@retry(
    stop=stop_after_attempt(3),
    wait=wait_fixed(2),
    retry=retry_if_exception_type(RuntimeError),
    reraise=True
)
def _generate_content_inner(topic: str) -> str:
    if random.random() < 0.3:  # 30% chance of simulated failure
        raise RuntimeError("Simulated API error during content generation!")

    print(f"  Generating content for: {topic}...")
    response = generation_chain.invoke({"topic": topic})
    return response.content


def generate_content_node(state: ContentWorkflowState) -> dict:
    print("\n--- Node: Generating Content ---")
    topic = state["topic"]
    retries_left = state.get("retries_left", 3)

    if retries_left <= 0:
        print("  No retries left for content generation. Falling back...")
        return {"status": "Failed", "error_message": "Content generation failed after multiple retries."}

    try:
        content = _generate_content_inner(topic)
        print("  Content generated successfully.")
        return {"generated_content": content, "status": "Needs Review", "retries_left": 3, "error_message": ""}
    except RuntimeError as e:
        print(f"  Content generation failed: {e}. Retrying...")
        return {"status": "Draft", "retries_left": retries_left - 1, "error_message": str(e)}
    except Exception as e:
        print(f"  An unexpected error occurred during content generation: {e}. Escalating...")
        return {"status": "Failed", "error_message": f"Unexpected error in content generation: {e}"}

print("generate_content_node defined!")


# --------------------------------------------------
# Task 2.2: review_content Node with Fallback
# --------------------------------------------------
class ReviewOutput(BaseModel):
    status: Literal["Approved", "Rejected"]
    feedback: str = Field(description="Detailed feedback for approval or rejection.")

review_prompt = ChatPromptTemplate.from_messages([
    ("system", "You are a content reviewer. Review the following content for quality, relevance, and adherence to the topic. Provide feedback and categorize the content as 'Approved' or 'Rejected'."),
    ("user", "Topic: {topic}\n\nContent: {content}")
])

review_chain = review_prompt | llm.with_structured_output(ReviewOutput)


def review_content_node(state: ContentWorkflowState) -> dict:
    print("\n--- Node: Reviewing Content ---")
    topic = state["topic"]
    content = state["generated_content"]

    try:
        # Simulate the LLM producing malformed/invalid output
        if random.random() < 0.2:  # 20% chance
            print("  Simulating a validation error during review (malformed output).")
            raise SimulatedValidationError("Review output failed schema validation.")

        # Occasionally simulate a false 'Rejected' even for good content
        if random.random() < 0.1:  # 10% chance
            print("  Simulating a 'Rejected' review to trigger re-generation.")
            return {
                "review_feedback": "Content was unexpectedly rejected during review process, needs re-generation.",
                "status": "Rejected"
            }

        review_result = review_chain.invoke({"topic": topic, "content": content})
        print(f"  Review result: {review_result.status} - {review_result.feedback}")
        return {
            "review_feedback": review_result.feedback,
            "status": review_result.status,
            "error_message": ""
        }
    except SimulatedValidationError as e:
        print(f"  Review failed validation: {e}. Falling back to human review.")
        return {
            "status": "Failed",
            "error_message": f"Review output validation failed: {e}"
        }
    except Exception as e:
        print(f"  An unexpected error occurred during content review: {e}. Falling back to human review.")
        return {
            "status": "Failed",
            "error_message": f"Unexpected error in content review: {e}"
        }

print("review_content_node defined!")


# --------------------------------------------------
# Task 2.3: escalate_human_review Node
# --------------------------------------------------
def escalate_human_review_node(state: ContentWorkflowState) -> dict:
    print("\n--- Node: Escalating to Human Review ---")
    reason = state.get("error_message", "Unknown reason for escalation.")
    if state["status"] == "Rejected":
        reason = "Content rejected by automated review. Needs human re-evaluation."
    elif state["status"] == "Draft" and state.get("retries_left", 0) <= 0:
        reason = "Content generation failed after multiple retries. Needs human intervention."

    print(f"  Escalated. Reason: {reason}")
    return {
        "status": "Failed",
        "error_message": reason
    }

print("escalate_human_review_node defined!")


# --------------------------------------------------
# Task 3.1: Define Edges and Conditional Logic
# --------------------------------------------------
workflow = StateGraph(ContentWorkflowState)

workflow.add_node("generate", generate_content_node)
workflow.add_node("review", review_content_node)
workflow.add_node("escalate", escalate_human_review_node)

workflow.set_entry_point("generate")


def route_after_generate(state: ContentWorkflowState) -> Literal["review", "generate", "escalate"]:
    if state["status"] == "Needs Review":
        return "review"
    elif state["status"] == "Draft" and state["retries_left"] > 0:
        return "generate"
    else:
        return "escalate"

workflow.add_conditional_edges(
    "generate",
    route_after_generate,
    {
        "review": "review",
        "generate": "generate",
        "escalate": "escalate",
    },
)


def route_after_review(state: ContentWorkflowState) -> Literal["generate", "escalate", "__end__"]:
    if state["status"] == "Approved":
        return END
    elif state["status"] == "Rejected":
        return "generate"
    else:
        return "escalate"

workflow.add_conditional_edges(
    "review",
    route_after_review,
    {
        "generate": "generate",
        "escalate": "escalate",
        END: END,
    },
)

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
# Part 4: Testing and Tracing the Workflow
# --------------------------------------------------
def run_workflow_and_print_state(topic: str):
    print(f"\n\n=========== Processing Topic: '{topic}' ===========")
    initial_state = {
        "topic": topic,
        "generated_content": "",
        "review_feedback": "",
        "status": "Draft",
        "retries_left": 3,
        "error_message": ""
    }

    final_state = None
    try:
        for s in app.stream(initial_state):
            print(f"Current state: {s}")
            final_state = s
        print(f"Final state for '{topic}': {final_state}")
    except Exception as e:
        print(f"An unhandled error occurred during workflow execution: {e}")


test_topics = [
    'The benefits of sustainable agriculture',
    'The future of quantum computing',
    'Tips for healthy eating',
    'The history of artificial intelligence'
]

# Run each test case individually to analyze its LangSmith trace clearly
for topic in test_topics:
    run_workflow_and_print_state(topic)