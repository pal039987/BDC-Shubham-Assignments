# ============================================================
# STREAMLIT QA BOT
# Banking Policy Assistant
# ============================================================

import os
from pathlib import Path

import streamlit as st

from dotenv import load_dotenv

from langchain_community.vectorstores import FAISS
from langchain_google_genai import (
    ChatGoogleGenerativeAI,
    GoogleGenerativeAIEmbeddings,
)


# ============================================================
# 1. LOAD ENVIRONMENT VARIABLES
# ============================================================

# Current file is inside:
# week8/exercise/<this-project-folder>/
#
# .env is in:
# week8/.env
#
# Therefore we search upward and load it safely.

CURRENT_DIR = Path(__file__).resolve().parent

ENV_CANDIDATES = [
    CURRENT_DIR / ".env",
    CURRENT_DIR.parent / ".env",
    CURRENT_DIR.parent.parent / ".env",
]

for env_path in ENV_CANDIDATES:

    if env_path.exists():
        load_dotenv(env_path)
        break

else:
    load_dotenv()


# ============================================================
# 2. GET GOOGLE API KEY
# ============================================================

GOOGLE_API_KEY = os.getenv(
    "GOOGLE_API_KEY"
)

if not GOOGLE_API_KEY:
    raise RuntimeError(
        "GOOGLE_API_KEY not found in .env file."
    )


# ============================================================
# 3. STREAMLIT PAGE CONFIG
# ============================================================

st.set_page_config(
    page_title="Internal Banking Policy Assistant",
    page_icon="🏦",
    layout="wide",
)


# ============================================================
# 4. PAGE TITLE / INTRODUCTION
# ============================================================

st.title(
    "🏦 Internal Banking Policy Assistant"
)

st.write(
    """
Ask questions about internal banking policies,
KYC rules, loan eligibility, compliance, and
other policy information.

The application retrieves relevant documents
from a local FAISS vector store and then uses
Gemini to generate a grounded answer.
"""
)


# ============================================================
# 5. VECTOR STORE LOCATION
# ============================================================

# From your VS Code structure:
#
# week8/
# └── exercise/
#     ├── embedding_store/
#     └── EX_.../
#
# So embedding_store is one level above this project.

VECTORSTORE_CANDIDATES = [
    CURRENT_DIR / "embedding_store",
    CURRENT_DIR.parent / "embedding_store",
    CURRENT_DIR.parent.parent / "embedding_store",
    CURRENT_DIR / "vectorstore",
    CURRENT_DIR.parent / "vectorstore",
]

VECTORSTORE_PATH = None

for path in VECTORSTORE_CANDIDATES:

    if path.exists() and path.is_dir():

        VECTORSTORE_PATH = path
        break


if VECTORSTORE_PATH is None:

    raise FileNotFoundError(
        """
FAISS vector store was not found.

Expected folder:
exercise/embedding_store/

Please verify that your existing FAISS
vector store is present.
"""
    )


# ============================================================
# 6. LOAD FAISS VECTOR STORE
# ============================================================

@st.cache_resource
def load_vectorstore():

    # IMPORTANT:
    # The embedding model used here must be the same
    # embedding model that was used when the FAISS
    # vector store was originally created.

    embedding_model = GoogleGenerativeAIEmbeddings(
        model="gemini-embedding-001",
        google_api_key=GOOGLE_API_KEY,
    )

    vectorstore = FAISS.load_local(
        str(VECTORSTORE_PATH),
        embedding_model,
        allow_dangerous_deserialization=True,
    )

    return vectorstore


# ============================================================
# 7. LOAD VECTOR STORE WITH ERROR HANDLING
# ============================================================

try:

    vectorstore = load_vectorstore()

except Exception as exc:

    st.error(
        "Could not load the FAISS vector store."
    )

    st.exception(exc)

    st.stop()


# ============================================================
# 8. INITIALIZE GEMINI LLM
# ============================================================

@st.cache_resource
def load_llm():

    return ChatGoogleGenerativeAI(
        model="gemini-flash-lite-latest",
        google_api_key=GOOGLE_API_KEY,
        temperature=0.3,
        max_retries=2,
    )


llm = load_llm()


# ============================================================
# 9. CREATE RETRIEVER
# ============================================================

retriever = vectorstore.as_retriever(
    search_kwargs={
        "k": 3
    }
)


# ============================================================
# 10. QUERY FUNCTION
# ============================================================

def answer_question(
    query: str
):
    """
    Retrieve relevant policy documents and generate
    a grounded answer with Gemini.
    """

    # --------------------------------------------------------
    # Retrieve documents
    # --------------------------------------------------------

    documents = retriever.invoke(
        query
    )

    if not documents:

        return (
            "Sorry, the policy information is not available.",
            [],
        )


    # --------------------------------------------------------
    # Build context
    # --------------------------------------------------------

    context_parts = []

    for i, document in enumerate(
        documents,
        start=1,
    ):

        context_parts.append(
            f"Document {i}:\n"
            f"{document.page_content}"
        )

    context = "\n\n".join(
        context_parts
    )


    # --------------------------------------------------------
    # Grounded prompt
    # --------------------------------------------------------

    prompt = f"""
You are a helpful internal banking policy assistant.

Answer the user's question using ONLY the
provided policy context.

Rules:
- Do not invent policy information.
- Do not use outside knowledge.
- Do not make assumptions.
- If the answer is not present in the context,
  say exactly:
  "Sorry, the policy information is not available."

Policy Context:
{context}

User Question:
{query}

Give a clear and concise answer.
"""


    # --------------------------------------------------------
    # Generate response
    # --------------------------------------------------------

    response = llm.invoke(
        prompt
    )


    # --------------------------------------------------------
    # Convert response to text
    # --------------------------------------------------------

    if isinstance(
        response.content,
        str,
    ):

        answer = response.content.strip()

    elif isinstance(
        response.content,
        list,
    ):

        parts = []

        for item in response.content:

            if isinstance(
                item,
                dict,
            ):

                text = item.get(
                    "text"
                )

                if text:
                    parts.append(
                        str(text)
                    )

            else:

                parts.append(
                    str(item)
                )

        answer = "\n".join(
            parts
        ).strip()

    else:

        answer = str(
            response.content
        ).strip()


    return (
        answer,
        documents,
    )


# ============================================================
# 11. SIDEBAR
# ============================================================

with st.sidebar:

    st.header("📌 Example Queries")

    st.write(
        "• What are the KYC rules?"
    )

    st.write(
        "• What are the loan eligibility requirements?"
    )

    st.write(
        "• What documents are required?"
    )

    st.divider()

    st.write(
        f"📁 Vector store: "
        f"{VECTORSTORE_PATH.name}"
    )


# ============================================================
# 12. USER INPUT
# ============================================================

query = st.text_input(
    "Enter your query:",
    placeholder=(
        "E.g. What are the KYC rules for "
        "opening a savings account?"
    ),
)


# ============================================================
# 13. ASK BUTTON
# ============================================================

if st.button(
    "🔍 Ask",
    type="primary",
):

    if not query.strip():

        st.warning(
            "Please enter a query."
        )

    else:

        with st.spinner(
            "Searching policy documents and generating answer..."
        ):

            try:

                answer, documents = (
                    answer_question(
                        query.strip()
                    )
                )


                # ==================================================
                # ANSWER
                # ==================================================

                st.subheader(
                    "📄 Answer"
                )

                st.write(
                    answer
                )


                # ==================================================
                # RETRIEVED CONTEXT
                # ==================================================

                st.subheader(
                    "📚 Retrieved Context"
                )

                if documents:

                    for i, document in enumerate(
                        documents,
                        start=1,
                    ):

                        with st.expander(
                            f"Source Document {i}",
                            expanded=False,
                        ):

                            source = (
                                document.metadata.get(
                                    "source",
                                    "Unknown",
                                )
                            )

                            st.markdown(
                                f"**File:** `{source}`"
                            )

                            st.write(
                                document.page_content
                            )

                else:

                    st.info(
                        "No relevant source documents found."
                    )


            except Exception as exc:

                st.error(
                    "An error occurred while processing "
                    "your query."
                )

                st.exception(
                    exc
                )


# ============================================================
# 14. FOOTER
# ============================================================

st.divider()

st.caption(
    "Internal Banking Policy Assistant • "
    "FAISS + Gemini + Streamlit"
)