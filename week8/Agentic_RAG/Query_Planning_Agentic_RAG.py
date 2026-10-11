# !pip install -q -U faiss-cpu google-generativeai numpy python-dotenv

import os
import re
import faiss
import numpy as np
import google.generativeai as genai
from dotenv import load_dotenv


# ---------------------------------------------------------
# Step 1: Load Gemini API key from .env
# ---------------------------------------------------------
load_dotenv()

api_key = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")

if not api_key:
    raise ValueError(
        "GOOGLE_API_KEY or GEMINI_API_KEY not found in .env file."
    )

genai.configure(api_key=api_key)


# ---------------------------------------------------------
# Step 2: Initialize Gemini model
# ---------------------------------------------------------
llm = genai.GenerativeModel(
    "gemini-flash-lite-latest"
)

embedding_model = "gemini-embedding-001"


# ---------------------------------------------------------
# Step 3: Example knowledge base
# ---------------------------------------------------------
documents = [
    {
        "id": "doc1",
        "text": "Python is a programming language widely used for AI and data science."
    },
    {
        "id": "doc2",
        "text": "FAISS is a library for efficient similarity search and clustering of dense vectors."
    },
    {
        "id": "doc3",
        "text": "Agentic RAG involves planning queries, orchestrating retrieval, and reasoning with agents."
    },
    {
        "id": "doc4",
        "text": "Gemini Flash is optimized for fast inference and multi-step reasoning tasks."
    },
]


# ---------------------------------------------------------
# Step 4: Metadata store
# ---------------------------------------------------------
metadata_store = {
    i: doc for i, doc in enumerate(documents)
}


# ---------------------------------------------------------
# Step 5: Embedding function
# ---------------------------------------------------------
def get_embedding(text, task_type="retrieval_document"):
    response = genai.embed_content(
        model=embedding_model,
        content=text,
        task_type=task_type
    )

    return np.array(
        response["embedding"],
        dtype=np.float32
    )


# ---------------------------------------------------------
# Step 6: Build FAISS index
# ---------------------------------------------------------
doc_vectors = np.array(
    [
        get_embedding(
            doc["text"],
            task_type="retrieval_document"
        )
        for doc in documents
    ],
    dtype=np.float32
)

dimension = doc_vectors.shape[1]

index = faiss.IndexFlatL2(dimension)
index.add(doc_vectors)

print(
    "FAISS index built with",
    index.ntotal,
    "documents"
)


# ---------------------------------------------------------
# Step 7: Query Planner
# ---------------------------------------------------------
def query_planner(question):
    """Uses Gemini to create focused retrieval sub-queries."""

    plan_prompt = f"""
You are a query planning agent.

Break the user's question into 2-3 specific search queries
that will help retrieve the relevant information from a
knowledge base.

User Question:
{question}

Return ONLY the search queries, one per line.
Do not number them.
"""

    response = llm.generate_content(plan_prompt)

    try:
        text = response.text.strip()
    except Exception:
        text = ""

    sub_queries = []

    for line in text.splitlines():
        line = re.sub(r"^\s*(?:[-*]|\d+[.)])\s*", "", line).strip()

        if line:
            sub_queries.append(line)

    return sub_queries[:3] if sub_queries else [question]


# ---------------------------------------------------------
# Step 8: FAISS Retrieval
# ---------------------------------------------------------
def retrieve_from_faiss(query, k=2):
    """Retrieve top-k documents from FAISS."""

    query_vector = get_embedding(
        query,
        task_type="retrieval_query"
    ).reshape(1, -1)

    actual_k = min(k, index.ntotal)

    distances, indices = index.search(
        query_vector,
        actual_k
    )

    results = []

    for idx in indices[0]:
        if idx != -1 and idx in metadata_store:
            results.append(metadata_store[idx])

    return results


# ---------------------------------------------------------
# Step 9: Agentic RAG
# ---------------------------------------------------------
def agentic_rag(question):
    # Step 1: Query Planning
    sub_queries = query_planner(question)

    print("\nPlanned Sub-queries:")
    for i, sub_query in enumerate(sub_queries, start=1):
        print(f"{i}. {sub_query}")

    # Step 2: Retrieve evidence
    retrieved_docs = []

    for sub_query in sub_queries:
        retrieved_docs.extend(
            retrieve_from_faiss(sub_query, k=2)
        )

    # Step 3: Remove duplicate documents
    unique_docs = {}

    for doc in retrieved_docs:
        unique_docs[doc["id"]] = doc["text"]

    context = "\n".join(unique_docs.values())

    # Step 4: Generate answer
    answer_prompt = f"""
You are an Agentic RAG assistant.

Use the following retrieved context to answer the user's question.

Context:
{context}

Question:
{question}

Instructions:
- Answer clearly and concisely.
- Use the retrieved context as the primary source.
- Do not invent facts that are not supported by the context.
- If the context is insufficient, say so clearly.
"""

    response = llm.generate_content(answer_prompt)

    try:
        return response.text.strip()
    except Exception:
        return "Unable to generate an answer."


# ---------------------------------------------------------
# Step 10: Run the Agentic RAG
# ---------------------------------------------------------
question = "How does FAISS help in Agentic RAG using Gemini models?"

answer = agentic_rag(question)

print("\nFinal Answer:\n")
print(answer)