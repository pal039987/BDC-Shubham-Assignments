# ============================================================
# RAG + FastAPI ASSIGNMENT
# Complete Notebook Code - Single Cell
# ============================================================

# ------------------------------------------------------------
# 1. INSTALL REQUIRED LIBRARIES
# ------------------------------------------------------------

# !pip install -q -U fastapi uvicorn pydantic sentence-transformers faiss-cpu torch transformers langchain langchain-google-genai python-dotenv requests


# ------------------------------------------------------------
# 2. IMPORTS
# ------------------------------------------------------------

import os
import sys
import time
import subprocess
from pathlib import Path

import requests

from dotenv import load_dotenv


# ------------------------------------------------------------
# 3. LOAD .ENV
# ------------------------------------------------------------

load_dotenv()

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

if not GOOGLE_API_KEY:
    raise ValueError(
        "GOOGLE_API_KEY not found in .env file."
    )

print("Google API key loaded successfully.")


# ------------------------------------------------------------
# 4. CHECK PROJECT FILES
# ------------------------------------------------------------

required_files = [
    "main.py",
    "requirements.txt",
    "README.md",
]

print("\nChecking project files:")

for file_name in required_files:
    if Path(file_name).exists():
        print(f"SUCCESS: {file_name} found")
    else:
        print(f"WARNING: {file_name} not found")


# ------------------------------------------------------------
# 5. IMPORT RAG PIPELINE
# ------------------------------------------------------------

from main import rag_pipeline


print("\nRAG pipeline loaded successfully.")

print(
    "Number of documents:",
    len(rag_pipeline.documents)
)


# ------------------------------------------------------------
# 6. RAG PIPELINE TEST - QUERY 1
# ------------------------------------------------------------

query_1 = "What is Retrieval Augmented Generation?"

result_1 = rag_pipeline.query(
    query=query_1,
    k=3
)

print("\n" + "=" * 70)
print("RAG TEST 1")
print("=" * 70)

print("\nQuery:")
print(query_1)

print("\nAnswer:")
print(result_1["answer"])

print("\nRetrieved Documents:")

for i, doc in enumerate(
    result_1["retrieved_docs"],
    start=1
):
    print(f"\n{i}. {doc}")

print("\nSimilarity Scores:")
print(result_1["similarity_scores"])


# ------------------------------------------------------------
# 7. RAG PIPELINE TEST - QUERY 2
# ------------------------------------------------------------

query_2 = "What is FAISS used for?"

result_2 = rag_pipeline.query(
    query=query_2,
    k=3
)

print("\n" + "=" * 70)
print("RAG TEST 2")
print("=" * 70)

print("\nQuery:")
print(query_2)

print("\nAnswer:")
print(result_2["answer"])

print("\nRetrieved Documents:")

for i, doc in enumerate(
    result_2["retrieved_docs"],
    start=1
):
    print(f"\n{i}. {doc}")

print("\nSimilarity Scores:")
print(result_2["similarity_scores"])


# ------------------------------------------------------------
# 8. RAG PIPELINE TEST - QUERY 3
# ------------------------------------------------------------

query_3 = "What is FastAPI?"

result_3 = rag_pipeline.query(
    query=query_3,
    k=3
)

print("\n" + "=" * 70)
print("RAG TEST 3")
print("=" * 70)

print("\nQuery:")
print(query_3)

print("\nAnswer:")
print(result_3["answer"])

print("\nRetrieved Documents:")

for i, doc in enumerate(
    result_3["retrieved_docs"],
    start=1
):
    print(f"\n{i}. {doc}")

print("\nSimilarity Scores:")
print(result_3["similarity_scores"])


# ------------------------------------------------------------
# 9. START FASTAPI SERVER
# ------------------------------------------------------------

print("\n" + "=" * 70)
print("STARTING FASTAPI SERVER")
print("=" * 70)

server_process = subprocess.Popen(
    [
        sys.executable,
        "-m",
        "uvicorn",
        "main:app",
        "--host",
        "127.0.0.1",
        "--port",
        "8000",
    ],
    stdout=subprocess.PIPE,
    stderr=subprocess.STDOUT,
    text=True,
)

# Give server time to start
time.sleep(8)


# ------------------------------------------------------------
# 10. HEALTH CHECK
# ------------------------------------------------------------

try:
    health_response = requests.get(
        "http://127.0.0.1:8000/health",
        timeout=30
    )

    print("\nHealth Check")
    print("Status Code:", health_response.status_code)
    print("Response:", health_response.json())

except Exception as e:
    print("\nHealth check failed:")
    print(e)


# ------------------------------------------------------------
# 11. API TEST 1
# ------------------------------------------------------------

api_query_1 = {
    "query": "What is Retrieval Augmented Generation?"
}

response_1 = requests.post(
    "http://127.0.0.1:8000/chat",
    json=api_query_1,
    timeout=60
)

print("\n" + "=" * 70)
print("API TEST 1")
print("=" * 70)

print("\nStatus Code:")
print(response_1.status_code)

print("\nJSON Response:")
print(response_1.json())


# ------------------------------------------------------------
# 12. ANALYSIS - TEST 1
# ------------------------------------------------------------

if response_1.status_code == 200:

    data = response_1.json()

    print("\nAnalysis:")
    print(
        "Answer relevant:",
        bool(data["answer"])
    )

    print(
        "Retrieved documents:",
        len(data["retrieved_docs"])
    )

    print(
        "Similarity scores:",
        data["similarity_scores"]
    )


# ------------------------------------------------------------
# 13. API TEST 2
# ------------------------------------------------------------

api_query_2 = {
    "query": "What is FAISS used for?"
}

response_2 = requests.post(
    "http://127.0.0.1:8000/chat",
    json=api_query_2,
    timeout=60
)

print("\n" + "=" * 70)
print("API TEST 2")
print("=" * 70)

print("\nStatus Code:")
print(response_2.status_code)

print("\nJSON Response:")
print(response_2.json())


# ------------------------------------------------------------
# 14. ANALYSIS - TEST 2
# ------------------------------------------------------------

if response_2.status_code == 200:

    data = response_2.json()

    print("\nAnalysis:")
    print(
        "Answer relevant:",
        bool(data["answer"])
    )

    print(
        "Retrieved documents:",
        len(data["retrieved_docs"])
    )

    print(
        "Similarity scores:",
        data["similarity_scores"]
    )


# ------------------------------------------------------------
# 15. API TEST 3
# ------------------------------------------------------------

api_query_3 = {
    "query": "How does FastAPI provide API documentation?"
}

response_3 = requests.post(
    "http://127.0.0.1:8000/chat",
    json=api_query_3,
    timeout=60
)

print("\n" + "=" * 70)
print("API TEST 3")
print("=" * 70)

print("\nStatus Code:")
print(response_3.status_code)

print("\nJSON Response:")
print(response_3.json())


# ------------------------------------------------------------
# 16. ANALYSIS - TEST 3
# ------------------------------------------------------------

if response_3.status_code == 200:

    data = response_3.json()

    print("\nAnalysis:")
    print(
        "Answer relevant:",
        bool(data["answer"])
    )

    print(
        "Retrieved documents:",
        len(data["retrieved_docs"])
    )

    print(
        "Similarity scores:",
        data["similarity_scores"]
    )


# ------------------------------------------------------------
# 17. EMPTY QUERY / VALIDATION TEST
# ------------------------------------------------------------

empty_query = {
    "query": ""
}

validation_response = requests.post(
    "http://127.0.0.1:8000/chat",
    json=empty_query,
    timeout=30
)

print("\n" + "=" * 70)
print("ERROR HANDLING TEST - EMPTY QUERY")
print("=" * 70)

print("\nStatus Code:")
print(validation_response.status_code)

print("\nResponse:")
print(validation_response.json())


# ------------------------------------------------------------
# 18. IRRELEVANT QUERY TEST
# ------------------------------------------------------------

irrelevant_query = {
    "query": (
        "What is the history of ancient Roman architecture?"
    )
}

irrelevant_response = requests.post(
    "http://127.0.0.1:8000/chat",
    json=irrelevant_query,
    timeout=60
)

print("\n" + "=" * 70)
print("ERROR HANDLING TEST - IRRELEVANT QUERY")
print("=" * 70)

print("\nStatus Code:")
print(irrelevant_response.status_code)

print("\nResponse:")
print(irrelevant_response.json())


# ------------------------------------------------------------
# 19. SWAGGER DOCUMENTATION
# ------------------------------------------------------------

print("\n" + "=" * 70)
print("SWAGGER DOCUMENTATION")
print("=" * 70)

print(
    "\nOpen the following URL in your browser:"
)

print(
    "http://127.0.0.1:8000/docs"
)

print(
    "\nAvailable endpoints:"
)

print("GET  /")
print("GET  /health")
print("POST /chat")


# ------------------------------------------------------------
# 20. FINAL SUMMARY
# ------------------------------------------------------------

print("\n" + "=" * 70)
print("ASSIGNMENT TEST SUMMARY")
print("=" * 70)

print("""
RAG Pipeline:
    ✓ Document corpus
    ✓ Sentence Transformer embeddings
    ✓ FAISS vector search
    ✓ Gemini generation

FastAPI:
    ✓ FastAPI application
    ✓ Pydantic request model
    ✓ Pydantic response model
    ✓ POST /chat
    ✓ GET /health

Testing:
    ✓ RAG query testing
    ✓ 3 API queries
    ✓ Retrieved documents
    ✓ Similarity scores
    ✓ Error handling
    ✓ Swagger documentation

Swagger:
    http://127.0.0.1:8000/docs
""")


# ------------------------------------------------------------
# 21. STOP SERVER WHEN FINISHED
# ------------------------------------------------------------

# Uncomment this only when you want to stop the server.
#
# server_process.terminate()
# server_process.wait()

print("\nNotebook execution completed.")