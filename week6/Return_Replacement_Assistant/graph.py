from langchain_google_genai import ChatGoogleGenerativeAI
from langgraph.graph import StateGraph, END
from langgraph.checkpoint.memory import MemorySaver
from typing import TypedDict, Annotated
from operator import add
import os
from dotenv import load_dotenv

from tools import check_return_eligibility, check_replacement_status, calculate_refund_date

load_dotenv()

# Initialize the Gemini LLM and bind our tools to it
llm = ChatGoogleGenerativeAI(
    model="gemini-flash-lite-latest",
    google_api_key=os.getenv("GOOGLE_API_KEY")
)

tools = [check_return_eligibility, check_replacement_status, calculate_refund_date]
llm_with_tools = llm.bind_tools(tools)


# Define the shared state that flows through the graph
class AgentState(TypedDict):
    messages: Annotated[list, add]


# Node 1: The "brain" — decides what to say or which tool to call
def agent_node(state: AgentState):
    response = llm_with_tools.invoke(state["messages"])
    return {"messages": [response]}


# Node 2: Executes whichever tool the agent decided to call
def tool_node(state: AgentState):
    last_message = state["messages"][-1]
    tool_map = {t.name: t for t in tools}
    results = []

    for call in last_message.tool_calls:
        tool_fn = tool_map[call["name"]]
        output = tool_fn.invoke(call["args"])
        results.append({
            "role": "tool",
            "content": str(output),
            "tool_call_id": call["id"]
        })

    return {"messages": results}


# Routing logic: does the agent want to call a tool, or is it done?
def should_continue(state: AgentState):
    last_message = state["messages"][-1]
    if getattr(last_message, "tool_calls", None):
        return "call_tool"
    return END


# Build the graph
graph_builder = StateGraph(AgentState)
graph_builder.add_node("agent", agent_node)
graph_builder.add_node("call_tool", tool_node)

graph_builder.set_entry_point("agent")
graph_builder.add_conditional_edges("agent", should_continue, {"call_tool": "call_tool", END: END})
graph_builder.add_edge("call_tool", "agent")

# Memory checkpoint — enables persistence across turns for the same customer
memory = MemorySaver()
app_graph = graph_builder.compile(checkpointer=memory)