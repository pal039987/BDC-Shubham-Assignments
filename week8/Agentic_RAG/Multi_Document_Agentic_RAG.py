# !pip install -q -U faiss-cpu google-generativeai langchain langchain-community langchain-huggingface sentence-transformers tenacity python-dotenv

import os
import numpy as np
import google.generativeai as genai

from dotenv import load_dotenv
from tenacity import retry, stop_after_attempt, wait_fixed

from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEmbeddings


# ---------------------------------------------------------
# Load Gemini API key from .env
# ---------------------------------------------------------
load_dotenv()

api_key = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")

if not api_key:
    raise ValueError(
        "GOOGLE_API_KEY or GEMINI_API_KEY was not found in .env file."
    )

genai.configure(api_key=api_key)


# ---------------------------------------------------------
# Gemini model
# ---------------------------------------------------------
GENERATION_MODEL = "gemini-flash-lite-latest"


def get_gemini_response(prompt):
    try:
        model = genai.GenerativeModel(GENERATION_MODEL)
        response = model.generate_content(prompt)

        try:
            return response.text.strip()
        except Exception:
            if getattr(response, "candidates", None):
                parts = response.candidates[0].content.parts
                return "\n".join(
                    getattr(part, "text", "")
                    for part in parts
                    if getattr(part, "text", "")
                ).strip()

        return ""

    except Exception as e:
        return f"Gemini API Error: {e}"


# ---------------------------------------------------------
# Sample documents
# ---------------------------------------------------------
docs = [
    Document(
        page_content=(
            "The banking policy ensures that loans are regulated "
            "under RBI guidelines."
        )
    ),
    Document(
        page_content=(
            "Healthcare insurance covers hospitalization, "
            "maternity, and critical illness."
        )
    ),
    Document(
        page_content=(
            "Automobile insurance provides coverage for accidents, "
            "theft, and third-party liability."
        )
    ),
]


# ---------------------------------------------------------
# Split documents into chunks
# ---------------------------------------------------------
splitter = RecursiveCharacterTextSplitter(
    chunk_size=200,
    chunk_overlap=50
)

all_chunks = []

for doc in docs:
    all_chunks.extend(splitter.split_documents([doc]))


# ---------------------------------------------------------
# Local HuggingFace embeddings
# ---------------------------------------------------------
embedding_model = HuggingFaceEmbeddings(
    model_name="sentence-transformers/all-MiniLM-L6-v2"
)


# ---------------------------------------------------------
# Build FAISS vector store
# ---------------------------------------------------------
vectorstore = FAISS.from_documents(
    all_chunks,
    embedding_model
)


# ---------------------------------------------------------
# Agentic RAG
# ---------------------------------------------------------
@retry(
    stop=stop_after_attempt(3),
    wait=wait_fixed(2)
)
def agentic_rag(query):
    # -----------------------------------------------------
    # Step 1: Route query
    # -----------------------------------------------------
    routing_prompt = f"""
You are a query router.

Classify the user's query into exactly ONE of these categories:
- Banking
- Healthcare
- Automobile
- General

Return ONLY the category name.

Query:
{query}
"""

    route_response = get_gemini_response(routing_prompt)

    route = route_response.strip().lower()

    if "bank" in route:
        route = "Banking"
    elif "health" in route or "medical" in route or "insurance" in route:
        if "automobile" not in route:
            route = "Healthcare"
    elif "auto" in route or "vehicle" in route or "car" in route:
        route = "Automobile"
    else:
        route = "General"


    # -----------------------------------------------------
    # Step 2: Retrieve relevant chunks from FAISS
    # -----------------------------------------------------
    retrieved_docs = vectorstore.similarity_search(
        query,
        k=min(3, len(all_chunks))
    )

    context = "\n".join(
        doc.page_content
        for doc in retrieved_docs
    )


    # -----------------------------------------------------
    # Step 3: Generate final answer
    # -----------------------------------------------------
    reflection_prompt = f"""
You are an Agentic RAG system.

Domain Route:
{route}

Retrieved Facts:
{context}

User Query:
{query}

Answer the query clearly and accurately using the retrieved facts.

Rules:
1. Prefer the retrieved facts.
2. Do not invent document-specific facts.
3. If the retrieved context does not contain enough information,
   clearly state that the available documents do not contain
   sufficient information.
4. Keep the answer concise.
"""

    final_answer = get_gemini_response(
        reflection_prompt
    )

    return {
        "route": route,
        "answer": final_answer,
        "retrieved_documents": retrieved_docs
    }


# ---------------------------------------------------------
# Test queries
# ---------------------------------------------------------
queries = [
    "What are the rules for personal loans in banks?",
    "Does health insurance cover maternity?",
    "What is covered under automobile third-party insurance?"
]


for q in queries:
    result = agentic_rag(q)

    print("\n" + "=" * 70)
    print(f"Query: {q}")
    print(f"Routed To: {result['route']}")
    print(f"Answer: {result['answer']}")