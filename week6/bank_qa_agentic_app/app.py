import streamlit as st
from graph import build_graph
from dotenv import load_dotenv

load_dotenv()
graph = build_graph()

st.set_page_config(page_title="Bank Q&A Agentic AI", layout="centered")
st.title("🏦 Internal Banking Q&A")
st.markdown("Ask internal questions related to loans, credit, compliance, KYC, etc.")

user_q = st.text_area("🔍 Ask a banking question:")

if st.button("Get Answer"):
    if not user_q.strip():
        st.warning("Please enter a question first.")
    else:
        with st.spinner("Thinking..."):
            response = graph.invoke({"input": user_q})
            st.success(response["final_report"])