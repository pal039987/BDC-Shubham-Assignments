# !pip install -q -U faiss-cpu google-generativeai numpy python-dotenv

import os
import faiss
import numpy as np
import google.generativeai as genai
from dotenv import load_dotenv

# Load API key from .env
load_dotenv()

api_key = os.getenv("GOOGLE_API_KEY")
if not api_key:
    raise ValueError("GOOGLE_API_KEY not found in .env file.")

genai.configure(api_key=api_key)

# Models
embedding_model_name = "gemini-embedding-001"
text_model = genai.GenerativeModel("gemini-flash-lite-latest")


# ---------------------------------------------------------
# Embedding function
# ---------------------------------------------------------
def get_embedding(text, task_type="retrieval_document"):
    result = genai.embed_content(
        model=embedding_model_name,
        content=text,
        task_type=task_type
    )
    return np.array(result["embedding"], dtype=np.float32)


# ---------------------------------------------------------
# Sample documents
# ---------------------------------------------------------
docs = [
    "Photosynthesis allows green plants to convert sunlight into energy.",
    "Mitochondria is the powerhouse of the cell, generating ATP.",
    "The water cycle includes evaporation, condensation, and precipitation.",
    "Isaac Newton formulated the laws of motion and gravity.",
    "Artificial Intelligence enables machines to mimic human behavior."
]


# ---------------------------------------------------------
# Create document embeddings
# ---------------------------------------------------------
doc_embeddings = np.array(
    [get_embedding(doc, "retrieval_document") for doc in docs],
    dtype=np.float32
)

embedding_dim = doc_embeddings.shape[1]


# ---------------------------------------------------------
# FAISS index
# ---------------------------------------------------------
index = faiss.IndexFlatL2(embedding_dim)
index.add(doc_embeddings)


# ---------------------------------------------------------
# Cosine similarity
# ---------------------------------------------------------
def cosine_similarity(v1, v2):
    v1_norm = np.linalg.norm(v1)
    v2_norm = np.linalg.norm(v2)

    if v1_norm == 0 or v2_norm == 0:
        return 0.0

    return float(np.dot(v1, v2) / (v1_norm * v2_norm))


# ---------------------------------------------------------
# Adaptive RAG
# ---------------------------------------------------------
def adaptive_rag(query, top_k=2, similarity_threshold=0.75):
    # Step 1: Query embedding
    query_vec = get_embedding(query, "retrieval_query")

    # Step 2: Retrieve top-k documents
    D, I = index.search(
        np.array([query_vec], dtype=np.float32),
        top_k
    )

    # Step 3: Select relevant documents
    retrieved_docs = []

    for idx in I[0]:
        if idx < 0:
            continue

        doc_vec = doc_embeddings[idx]
        sim = cosine_similarity(query_vec, doc_vec)

        if sim >= similarity_threshold:
            retrieved_docs.append(docs[idx])

    # Step 4: Build prompt
    if retrieved_docs:
        context = "\n".join(retrieved_docs)

        full_prompt = f"""
You are a helpful question-answering assistant.

Use the provided context to answer the user's question.
If the context does not contain enough information, say that the
provided context does not contain enough information.

Context:
{context}

User Query:
{query}
"""
    else:
        # Zero-shot fallback
        full_prompt = f"""
Answer the following question directly using your general knowledge.

User Query:
{query}
"""

    # Step 5: Generate answer
    response = text_model.generate_content(full_prompt)

    # Step 6: Return clean text
    return response.text.strip()


# ---------------------------------------------------------
# Test 1: Relevant query -> RAG context should be used
# ---------------------------------------------------------
print("🔎 Q1: What is the role of mitochondria?")
print(adaptive_rag("What is the role of mitochondria?"))


# ---------------------------------------------------------
# Test 2: Irrelevant query -> Zero-shot fallback
# ---------------------------------------------------------
print("\n🔎 Q2: What are black holes?")
print(adaptive_rag("What are black holes?"))