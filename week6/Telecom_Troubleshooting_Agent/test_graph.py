from graph import app_graph

config = {"configurable": {"thread_id": "customer_bob"}}

response = app_graph.invoke(
    {"messages": [{"role": "user", "content": "Why is my internet so slow? My customer ID is CUST502"}]},
    config=config
)

print(response["messages"][-1].content)