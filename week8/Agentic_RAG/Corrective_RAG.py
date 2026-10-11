# !pip install -q -U faiss-cpu google-generativeai numpy python-dotenv

import os
import time
import requests
import faiss
import numpy as np
import google.generativeai as genai
from dotenv import load_dotenv

# ---------------------------------------------------------
# Step 1: Load Gemini API key from .env
# ---------------------------------------------------------
load_dotenv()

api_key = os.getenv("GOOGLE_API_KEY")
if not api_key:
    raise ValueError("GOOGLE_API_KEY not found in .env file.")

genai.configure(api_key=api_key)

# ---------------------------------------------------------
# Step 2: Load Gemini model
# ---------------------------------------------------------
generation_model = genai.GenerativeModel(
    "gemini-flash-lite-latest"
)

embedding_model_name = "gemini-embedding-001"


# ---------------------------------------------------------
# Helper: Safely extract text from Gemini response
# ---------------------------------------------------------
def get_response_text(response):
    try:
        return response.text.strip()
    except Exception:
        content = getattr(response, "candidates", None)

        if content:
            parts = content[0].content.parts
            return "\n".join(
                getattr(part, "text", "")
                for part in parts
                if getattr(part, "text", "")
            ).strip()

        return ""


# ---------------------------------------------------------
# Step 3: Embedding function
# ---------------------------------------------------------
def get_embedding(text, task_type="retrieval_document"):
    result = genai.embed_content(
        model=embedding_model_name,
        content=text,
        task_type=task_type
    )

    return np.array(
        result["embedding"],
        dtype=np.float32
    )


# ---------------------------------------------------------
# Step 4: Show installed Gemini package version
# ---------------------------------------------------------
print("google-generativeai version:", genai.__version__)


# ---------------------------------------------------------
# Step 5: Sample document knowledge base
# ---------------------------------------------------------
documents = [
    "Photosynthesis is the process by which green plants create food using sunlight and carbon dioxide.",
    "Mitochondria is an organelle that generates ATP, the energy currency of the cell.",
    "Gravity is a force that attracts two bodies toward each other based on their mass.",
    "The water cycle consists of processes such as evaporation, condensation, and precipitation.",
    "Artificial intelligence refers to machines mimicking human cognitive functions like learning and reasoning."
]


# ---------------------------------------------------------
# Step 6: Embed all documents with retry handling
# ---------------------------------------------------------
doc_vectors = []

for i, doc in enumerate(documents):
    retries = 3
    success = False

    for attempt in range(retries):
        try:
            print(
                f"Embedding document {i + 1}/{len(documents)} "
                f"(Attempt {attempt + 1}/{retries})"
            )

            vec = get_embedding(
                doc,
                task_type="retrieval_document"
            )

            doc_vectors.append(vec)
            print(
                f"Successfully embedded document "
                f"{i + 1}/{len(documents)}"
            )

            success = True
            break

        except requests.exceptions.ReadTimeout:
            print(
                f"Timeout embedding document {i + 1}. "
                f"Retrying in 2 seconds..."
            )
            time.sleep(2)

        except Exception as e:
            print(
                f"Unexpected error for document {i + 1}: {e}"
            )
            break

    if not success:
        print(
            f"Failed to embed document {i + 1} "
            f"after {retries} attempts."
        )


# ---------------------------------------------------------
# Step 7: Validate embeddings
# ---------------------------------------------------------
if not doc_vectors:
    raise RuntimeError(
        "No documents were successfully embedded. "
        "Cannot create FAISS index."
    )

doc_vectors = np.array(
    doc_vectors,
    dtype=np.float32
)

# Keep document list aligned with successfully embedded vectors
valid_documents = documents[:len(doc_vectors)]

dimension = doc_vectors.shape[1]


# ---------------------------------------------------------
# Step 8: Create FAISS index
# ---------------------------------------------------------
index = faiss.IndexFlatL2(dimension)
index.add(doc_vectors)

print("\nFAISS index created successfully.")
print("Embedding dimension:", dimension)
print("Indexed documents:", index.ntotal)


# ---------------------------------------------------------
# Step 9: Cosine similarity function
# ---------------------------------------------------------
def cosine_similarity(v1, v2):
    norm_v1 = np.linalg.norm(v1)
    norm_v2 = np.linalg.norm(v2)

    if norm_v1 == 0 or norm_v2 == 0:
        return 0.0

    return float(
        np.dot(v1, v2) / (norm_v1 * norm_v2)
    )


# ---------------------------------------------------------
# Step 10: Retrieve relevant documents
# ---------------------------------------------------------
def retrieve_documents(
    query,
    top_k=2,
    similarity_threshold=0.75
):
    query_vec = get_embedding(
        query,
        task_type="retrieval_query"
    )

    actual_k = min(top_k, index.ntotal)

    distances, indices = index.search(
        np.array([query_vec], dtype=np.float32),
        actual_k
    )

    retrieved_docs = []

    for idx in indices[0]:
        if idx < 0 or idx >= len(valid_documents):
            continue

        doc = valid_documents[idx]
        doc_vec = doc_vectors[idx]

        similarity = cosine_similarity(
            query_vec,
            doc_vec
        )

        if similarity >= similarity_threshold:
            retrieved_docs.append({
                "document": doc,
                "similarity": similarity
            })

    return retrieved_docs


# ---------------------------------------------------------
# Step 11: Corrective RAG
# ---------------------------------------------------------
def corrective_rag(
    query,
    top_k=2,
    similarity_threshold=0.75
):
    original_query = query

    # ---------------------------------------------
    # First retrieval
    # ---------------------------------------------
    retrieved_docs = retrieve_documents(
        query,
        top_k=top_k,
        similarity_threshold=similarity_threshold
    )

    corrected_query = query

    # ---------------------------------------------
    # If no relevant context, correct the query
    # ---------------------------------------------
    if not retrieved_docs:
        correction_prompt = f"""
The following user query did not retrieve relevant
information from a small knowledge base:

User Query:
{query}

Rewrite the query into a clearer, more specific question
that is likely to match information about:
photosynthesis, mitochondria, gravity, the water cycle,
or artificial intelligence.

Return only the corrected question.
"""

        correction_response = generation_model.generate_content(
            correction_prompt
        )

        corrected_query = get_response_text(
            correction_response
        )

        if not corrected_query:
            corrected_query = query

        print("\nCorrected Query:", corrected_query)

        # -----------------------------------------
        # Re-retrieve using corrected query
        # -----------------------------------------
        retrieved_docs = retrieve_documents(
            corrected_query,
            top_k=top_k,
            similarity_threshold=similarity_threshold
        )

    # ---------------------------------------------
    # Build context
    # ---------------------------------------------
    context = "\n".join(
        item["document"]
        for item in retrieved_docs
    )

    # ---------------------------------------------
    # Final generation
    # ---------------------------------------------
    if context:
        final_prompt = f"""
You are a helpful question-answering assistant.

Use the context below to answer the user's question.
Do not invent facts that are not supported by the context.

Context:
{context}

User Query:
{corrected_query}

Answer clearly and concisely.
"""
    else:
        final_prompt = f"""
Answer the following question using your general knowledge.

User Query:
{corrected_query}

Answer clearly and concisely.
"""

    response = generation_model.generate_content(
        final_prompt
    )

    answer = get_response_text(response)

    return {
        "original_query": original_query,
        "corrected_query": corrected_query,
        "retrieved_documents": retrieved_docs,
        "answer": answer
    }


# ---------------------------------------------------------
# Step 12: Test Query 1
# ---------------------------------------------------------
print("\n" + "=" * 60)
print("🔎 Query 1: How do plants make energy?")
print("=" * 60)

result_1 = corrective_rag(
    "How do plants make energy?"
)

print("\nAnswer:")
print(result_1["answer"])

print("\nRetrieved Documents:")
for item in result_1["retrieved_documents"]:
    print(
        f"- Similarity: {item['similarity']:.4f} | "
        f"{item['document']}"
    )


# ---------------------------------------------------------
# Step 13: Test Query 2
# ---------------------------------------------------------
print("\n" + "=" * 60)
print("🔎 Query 2: Explain jumping like astronaut.")
print("=" * 60)

result_2 = corrective_rag(
    "Explain jumping like astronaut."
)

print("\nAnswer:")
print(result_2["answer"])

print("\nRetrieved Documents:")
if result_2["retrieved_documents"]:
    for item in result_2["retrieved_documents"]:
        print(
            f"- Similarity: {item['similarity']:.4f} | "
            f"{item['document']}"
        )
else:
    print("- No relevant documents found.")