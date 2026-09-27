from graph import app_graph

config = {"configurable": {"thread_id": "customer_alice"}}

response = app_graph.invoke(
    {"messages": [{"role": "user", "content": "Is my order ORD1001 eligible for return?"}]},
    config=config
)

print(response["messages"][-1].content)

# Follow-up query — same thread_id, so it should remember context
response2 = app_graph.invoke(
    {"messages": [{"role": "user", "content": "What about replacement status for the same order?"}]},
    config=config  # same config = same thread_id = same customer
)
print(response2["messages"][-1].content)