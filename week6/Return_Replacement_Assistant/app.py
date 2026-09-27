import streamlit as st
from graph import app_graph
import uuid

st.set_page_config(page_title="Return & Replacement Assistant", page_icon=None)
st.title("Intelligent Product Return & Replacement Assistant")

# Assign a unique thread/session ID per browser session so memory persists per customer
if "thread_id" not in st.session_state:
    st.session_state.thread_id = str(uuid.uuid4())

if "chat_history" not in st.session_state:
    st.session_state.chat_history = []

# Display past conversation
for role, message in st.session_state.chat_history:
    with st.chat_message(role):
        st.write(message)

# Chat input box
user_input = st.chat_input("Ask about your order (e.g. 'Is ORD1001 eligible for return?')")

if user_input:
    # Show user message immediately
    st.session_state.chat_history.append(("user", user_input))
    with st.chat_message("user"):
        st.write(user_input)

    # Call the LangGraph agent
    config = {"configurable": {"thread_id": st.session_state.thread_id}}
    response = app_graph.invoke(
        {"messages": [{"role": "user", "content": user_input}]},
        config=config
    )

    # Extract the final text response
    final_message = response["messages"][-1]
    if isinstance(final_message.content, list):
        # Handle structured content (list of text blocks)
        reply_text = " ".join(
            block.get("text", "") for block in final_message.content if isinstance(block, dict)
        )
    else:
        reply_text = final_message.content

    st.session_state.chat_history.append(("assistant", reply_text))
    with st.chat_message("assistant"):
        st.write(reply_text)