# ============================================================
# app.py
# Streamlit Frontend for RAG QA Bot
# ============================================================

import requests
import streamlit as st


# ============================================================
# 1. PAGE CONFIGURATION
# ============================================================

st.set_page_config(
    page_title="RAG QA Bot",
    page_icon="🤖",
    layout="wide",
)


# ============================================================
# 2. BACKEND CONFIGURATION
# ============================================================

BACKEND_URL = "http://127.0.0.1:8000"


# ============================================================
# 3. SESSION STATE
# ============================================================

if "chat_history" not in st.session_state:
    st.session_state.chat_history = []


# ============================================================
# 4. TITLE
# ============================================================

st.title("🤖 RAG Question-Answering Bot")

st.write(
    """
Ask questions about Generative AI, RAG, FAISS,
Sentence Transformers, FastAPI, and related topics.

The Streamlit frontend sends your question to the
FastAPI RAG backend, which retrieves relevant documents
and generates an answer using Gemini.
"""
)


# ============================================================
# 5. SIDEBAR
# ============================================================

with st.sidebar:

    st.header("About")

    st.write(
        """
        This application demonstrates a simple
        Retrieval Augmented Generation workflow.

        Pipeline:

        User Query
        ↓
        FastAPI
        ↓
        Sentence Transformer
        ↓
        FAISS
        ↓
        Retrieved Context
        ↓
        Gemini
        ↓
        Answer
        """
    )

    st.subheader("Example Questions")

    st.write(
        "• What is RAG?"
    )

    st.write(
        "• What is FAISS used for?"
    )

    st.write(
        "• What is FastAPI?"
    )


# ============================================================
# 6. USER INPUT
# ============================================================

question = st.text_input(
    "Enter your question:",
    placeholder="Example: What is Retrieval Augmented Generation?",
)


# ============================================================
# 7. ASK BUTTON
# ============================================================

ask_button = st.button(
    "Ask",
    type="primary",
)


# ============================================================
# 8. PROCESS QUERY
# ============================================================

if ask_button:

    if not question.strip():

        st.warning(
            "Please enter a question first."
        )

    else:

        try:

            with st.spinner(
                "Searching documents and generating answer..."
            ):

                response = requests.post(
                    f"{BACKEND_URL}/chat",
                    json={
                        "query": question.strip()
                    },
                    timeout=60,
                )

            # ------------------------------------------------
            # Successful response
            # ------------------------------------------------

            if response.status_code == 200:

                data = response.json()

                answer = data.get(
                    "answer",
                    "No answer found.",
                )

                retrieved_docs = data.get(
                    "retrieved_docs",
                    [],
                )

                similarity_scores = data.get(
                    "similarity_scores",
                    [],
                )

                # Save conversation history
                st.session_state.chat_history.append(
                    {
                        "question": question.strip(),
                        "answer": answer,
                        "retrieved_docs": retrieved_docs,
                        "similarity_scores": similarity_scores,
                    }
                )

            # ------------------------------------------------
            # Backend errors
            # ------------------------------------------------

            else:

                try:
                    error_data = response.json()
                except ValueError:
                    error_data = {}

                detail = error_data.get(
                    "detail",
                    f"Backend returned status {response.status_code}.",
                )

                st.error(
                    f"Backend error: {detail}"
                )

        except requests.exceptions.ConnectionError:

            st.error(
                "Could not connect to the FastAPI backend. "
                "Make sure main.py is running on port 8000."
            )

        except requests.exceptions.Timeout:

            st.error(
                "The backend request timed out. "
                "Please try again."
            )

        except Exception as exc:

            st.error(
                f"Unexpected error: {str(exc)}"
            )


# ============================================================
# 9. DISPLAY LATEST ANSWER
# ============================================================

if st.session_state.chat_history:

    latest = st.session_state.chat_history[-1]

    st.subheader("Answer")

    st.success(
        latest["answer"]
    )

    # --------------------------------------------------------
    # Retrieved context
    # --------------------------------------------------------

    with st.expander(
        "Retrieved Context",
        expanded=True,
    ):

        if latest["retrieved_docs"]:

            for i, doc in enumerate(
                latest["retrieved_docs"],
                start=1,
            ):

                st.markdown(
                    f"**Document {i}**"
                )

                st.info(doc)

                if i <= len(
                    latest["similarity_scores"]
                ):

                    score = latest[
                        "similarity_scores"
                    ][i - 1]

                    st.caption(
                        f"Similarity score: {score:.4f}"
                    )

        else:

            st.write(
                "No relevant documents found."
            )


# ============================================================
# 10. CONVERSATION HISTORY
# ============================================================

if len(
    st.session_state.chat_history
) > 1:

    st.subheader(
        "Conversation History"
    )

    for index, chat in enumerate(
        st.session_state.chat_history[:-1],
        start=1,
    ):

        with st.expander(
            f"Question {index}: {chat['question']}"
        ):

            st.write(
                "**Answer:**"
            )

            st.write(
                chat["answer"]
            )