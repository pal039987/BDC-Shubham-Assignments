# ============================================================
# STREAMLIT QA BOT ASSIGNMENT
# Complete Notebook Code - Single Cell
# ============================================================

import os
import sys
import time
import subprocess
import requests

from pathlib import Path
from dotenv import load_dotenv


# ============================================================
# 1. INSTALL DEPENDENCIES
# ============================================================

# !pip install -q -U streamlit requests fastapi uvicorn pydantic sentence-transformers faiss-cpu torch transformers langchain langchain-google-genai python-dotenv


# ============================================================
# 2. LOAD ENVIRONMENT
# ============================================================

load_dotenv()

GOOGLE_API_KEY = os.getenv(
    "GOOGLE_API_KEY"
)

if not GOOGLE_API_KEY:

    raise ValueError(
        "GOOGLE_API_KEY not found in .env."
    )

print(
    "Google API key loaded successfully."
)


# ============================================================
# 3. CHECK FILES
# ============================================================

required_files = [
    "main.py",
    "app.py",
    "requirements.txt",
    "README.md",
]

print("\nChecking project files:")

for file_name in required_files:

    if Path(file_name).exists():

        print(
            f"SUCCESS: {file_name}"
        )

    else:

        print(
            f"WARNING: {file_name} not found"
        )


# ============================================================
# 4. TEST FASTAPI BACKEND
# ============================================================

print(
    "\nChecking FastAPI backend..."
)

try:

    health = requests.get(
        "http://127.0.0.1:8000/health",
        timeout=10,
    )

    print(
        "Backend status:",
        health.status_code
    )

    print(
        "Backend response:",
        health.json()
    )

except Exception as exc:

    print(
        "Backend is not running."
    )

    print(
        "Start it with:"
    )

    print(
        "uvicorn main:app --reload"
    )

    print(
        f"Error: {exc}"
    )


# ============================================================
# 5. RAG QUERY TEST 1
# ============================================================

query_1 = {
    "query": "What is Retrieval Augmented Generation?"
}

response_1 = requests.post(
    "http://127.0.0.1:8000/chat",
    json=query_1,
    timeout=60,
)

print("\n" + "=" * 70)
print("BACKEND TEST 1")
print("=" * 70)

print(
    "Status:",
    response_1.status_code
)

print(
    response_1.json()
)


# ============================================================
# 6. RAG QUERY TEST 2
# ============================================================

query_2 = {
    "query": "What is FAISS used for?"
}

response_2 = requests.post(
    "http://127.0.0.1:8000/chat",
    json=query_2,
    timeout=60,
)

print("\n" + "=" * 70)
print("BACKEND TEST 2")
print("=" * 70)

print(
    "Status:",
    response_2.status_code
)

print(
    response_2.json()
)


# ============================================================
# 7. RAG QUERY TEST 3
# ============================================================

query_3 = {
    "query": "What is FastAPI?"
}

response_3 = requests.post(
    "http://127.0.0.1:8000/chat",
    json=query_3,
    timeout=60,
)

print("\n" + "=" * 70)
print("BACKEND TEST 3")
print("=" * 70)

print(
    "Status:",
    response_3.status_code
)

print(
    response_3.json()
)


# ============================================================
# 8. ERROR HANDLING TEST
# ============================================================

invalid_query = {
    "query": ""
}

error_response = requests.post(
    "http://127.0.0.1:8000/chat",
    json=invalid_query,
    timeout=30,
)

print("\n" + "=" * 70)
print("ERROR HANDLING TEST")
print("=" * 70)

print(
    "Status:",
    error_response.status_code
)

print(
    error_response.json()
)


# ============================================================
# 9. STREAMLIT INFORMATION
# ============================================================

print("\n" + "=" * 70)
print("STREAMLIT APPLICATION")
print("=" * 70)

print(
    "Run the Streamlit application using:"
)

print(
    "streamlit run app.py --server.address 127.0.0.1 --server.port 8501"
)

print(
    "\nThen open:"
)

print(
    "http://127.0.0.1:8501"
)


# ============================================================
# 10. ASSIGNMENT ANALYSIS
# ============================================================

print("\n" + "=" * 70)
print("ASSIGNMENT ANALYSIS")
print("=" * 70)

print("""
Advantages of Streamlit:
- Very quick AI/ML UI development
- Simple Python-based interface
- Interactive widgets
- Easy integration with REST APIs
- Useful for rapid prototypes

Main challenge:
- Connecting the Streamlit frontend to the FastAPI backend
- Handling backend errors and timeouts
- Presenting retrieved RAG context clearly

Possible improvements:
- Better chat-style interface
- File upload support
- Conversation memory
- Source citations
- Response streaming
- Authentication
""")


# ============================================================
# 11. SCREENSHOT INSTRUCTIONS
# ============================================================

print("\n" + "=" * 70)
print("SCREENSHOTS REQUIRED")
print("=" * 70)

print("""
Take 3 screenshots from the Streamlit UI.

Screenshot 1:
Question: What is Retrieval Augmented Generation?

Screenshot 2:
Question: What is FAISS used for?

Screenshot 3:
Question: What is FastAPI?

Each screenshot should show:
- User question
- Answer
- Retrieved Context
- Similarity score
""")