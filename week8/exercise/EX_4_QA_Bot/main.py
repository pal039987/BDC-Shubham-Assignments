# ============================================================
# main.py
# FastAPI RAG Backend
# ============================================================

import os
from typing import List, Tuple

import faiss
import numpy as np

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from sentence_transformers import SentenceTransformer
from langchain_google_genai import ChatGoogleGenerativeAI


# ============================================================
# 1. LOAD ENVIRONMENT VARIABLES
# ============================================================

load_dotenv()

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

if not GOOGLE_API_KEY:
    raise RuntimeError(
        "GOOGLE_API_KEY not found in .env file."
    )


# ============================================================
# 2. INITIALIZE GEMINI
# ============================================================

llm = ChatGoogleGenerativeAI(
    model="gemini-flash-lite-latest",
    temperature=0.2,
    google_api_key=GOOGLE_API_KEY,
    max_retries=2,
)


# ============================================================
# 3. DOCUMENT CORPUS
# ============================================================

DOCUMENTS = [
    (
        "Generative AI creates new content such as text, images, "
        "audio, video, and code using machine learning models."
    ),
    (
        "Large Language Models, or LLMs, are neural network models "
        "trained on large collections of text to understand and "
        "generate human language."
    ),
    (
        "Retrieval Augmented Generation, commonly called RAG, "
        "combines document retrieval with language model generation "
        "to produce answers grounded in external information."
    ),
    (
        "In a RAG system, a user's query is converted into an "
        "embedding and compared against document embeddings to "
        "retrieve semantically relevant information."
    ),
    (
        "FAISS is a library for efficient similarity search and "
        "clustering of dense vectors. It is commonly used for "
        "fast vector search systems."
    ),
    (
        "Sentence Transformers convert sentences and paragraphs "
        "into numerical embeddings that can be used for semantic "
        "search and similarity comparison."
    ),
    (
        "The all-MiniLM-L6-v2 model is a compact embedding model "
        "commonly used for semantic similarity and information "
        "retrieval."
    ),
    (
        "FastAPI is a Python web framework used to build APIs "
        "with automatic validation and interactive documentation."
    ),
    (
        "FastAPI automatically provides interactive Swagger UI "
        "documentation through the /docs endpoint."
    ),
    (
        "A POST request sends data to a server. FastAPI uses "
        "Pydantic models to validate JSON request bodies."
    ),
    (
        "Pydantic models provide data validation and structured "
        "serialization for FastAPI requests and responses."
    ),
    (
        "Uvicorn is an ASGI server commonly used to run FastAPI "
        "applications."
    ),
    (
        "A health check endpoint verifies whether an API service "
        "is running correctly."
    ),
    (
        "Semantic search retrieves information based on meaning "
        "rather than exact keyword matching."
    ),
    (
        "Cosine similarity compares the angle between vectors "
        "to measure their semantic similarity."
    ),
]


# ============================================================
# 4. RAG PIPELINE
# ============================================================

class RAGPipeline:

    def __init__(
        self,
        documents: List[str],
        embedding_model: str =
        "sentence-transformers/all-MiniLM-L6-v2",
    ):
        self.documents = documents

        print("Loading embedding model...")

        self.embedding_model = SentenceTransformer(
            embedding_model
        )

        print("Creating document embeddings...")

        embeddings = self.embedding_model.encode(
            self.documents,
            convert_to_numpy=True,
            normalize_embeddings=True,
            show_progress_bar=False,
        )

        embeddings = np.asarray(
            embeddings,
            dtype="float32",
        )

        dimension = embeddings.shape[1]

        self.index = faiss.IndexFlatIP(
            dimension
        )

        self.index.add(embeddings)

        print(
            f"RAG index created with "
            f"{len(self.documents)} documents."
        )

    # --------------------------------------------------------
    # Retrieve relevant documents
    # --------------------------------------------------------

    def retrieve(
        self,
        query: str,
        k: int = 3,
        min_similarity: float = 0.20,
    ) -> Tuple[List[str], List[float]]:

        if not query.strip():
            return [], []

        query_embedding = self.embedding_model.encode(
            [query],
            convert_to_numpy=True,
            normalize_embeddings=True,
            show_progress_bar=False,
        )

        query_embedding = np.asarray(
            query_embedding,
            dtype="float32",
        )

        k = min(
            k,
            len(self.documents)
        )

        scores, indices = self.index.search(
            query_embedding,
            k,
        )

        retrieved_docs = []
        similarity_scores = []

        for score, doc_index in zip(
            scores[0],
            indices[0],
        ):

            if doc_index == -1:
                continue

            score = float(score)

            if score < min_similarity:
                continue

            retrieved_docs.append(
                self.documents[doc_index]
            )

            similarity_scores.append(
                score
            )

        return (
            retrieved_docs,
            similarity_scores,
        )

    # --------------------------------------------------------
    # Convert Gemini output to text
    # --------------------------------------------------------

    @staticmethod
    def content_to_text(content) -> str:

        if isinstance(content, str):
            return content.strip()

        if isinstance(content, list):

            parts = []

            for item in content:

                if isinstance(item, dict):

                    text = item.get("text")

                    if text:
                        parts.append(
                            str(text)
                        )

                else:
                    parts.append(
                        str(item)
                    )

            return "\n".join(parts).strip()

        return str(content).strip()

    # --------------------------------------------------------
    # Generate answer
    # --------------------------------------------------------

    def generate(
        self,
        query: str,
        retrieved_docs: List[str],
    ) -> str:

        if not retrieved_docs:
            return (
                "I could not find relevant information "
                "in the available documents."
            )

        context = "\n\n".join(
            f"Document {i + 1}: {doc}"
            for i, doc in enumerate(
                retrieved_docs
            )
        )

        prompt = f"""
You are a helpful RAG-based QA assistant.

Answer the user's question using ONLY the provided context.

Do not invent facts.

If the answer is not available in the context,
say that the information is not available in
the provided documents.

Context:
{context}

Question:
{query}

Give a clear and concise answer.
"""

        response = llm.invoke(prompt)

        return self.content_to_text(
            response.content
        )

    # --------------------------------------------------------
    # Complete RAG query
    # --------------------------------------------------------

    def query(
        self,
        query: str,
        k: int = 3,
    ):

        retrieved_docs, scores = self.retrieve(
            query=query,
            k=k,
        )

        answer = self.generate(
            query=query,
            retrieved_docs=retrieved_docs,
        )

        return {
            "answer": answer,
            "retrieved_docs": retrieved_docs,
            "similarity_scores": scores,
        }


# ============================================================
# 5. INITIALIZE RAG PIPELINE
# ============================================================

rag_pipeline = RAGPipeline(
    documents=DOCUMENTS
)


# ============================================================
# 6. CREATE FASTAPI APP
# ============================================================

app = FastAPI(
    title="RAG QA API",
    description="RAG backend for Streamlit QA Bot",
    version="1.0.0",
)


# ============================================================
# 7. REQUEST MODEL
# ============================================================

class ChatRequest(BaseModel):

    query: str = Field(
        ...,
        min_length=3,
        max_length=500,
        description="Question for the QA bot",
    )


# ============================================================
# 8. RESPONSE MODEL
# ============================================================

class ChatResponse(BaseModel):

    answer: str
    retrieved_docs: List[str]
    similarity_scores: List[float]


# ============================================================
# 9. ROOT ENDPOINT
# ============================================================

@app.get("/")
async def root():

    return {
        "message": "RAG QA API is running.",
        "docs": "/docs",
    }


# ============================================================
# 10. HEALTH ENDPOINT
# ============================================================

@app.get("/health")
async def health():

    return {
        "status": "ok"
    }


# ============================================================
# 11. CHAT ENDPOINT
# ============================================================

@app.post(
    "/chat",
    response_model=ChatResponse,
)
async def chat(
    request: ChatRequest
):

    query = request.query.strip()

    if not query:
        raise HTTPException(
            status_code=400,
            detail="Query cannot be empty.",
        )

    try:

        result = rag_pipeline.query(
            query=query,
            k=3,
        )

        if not result["retrieved_docs"]:

            raise HTTPException(
                status_code=404,
                detail=(
                    "No relevant documents found."
                ),
            )

        return ChatResponse(
            answer=result["answer"],
            retrieved_docs=result["retrieved_docs"],
            similarity_scores=result[
                "similarity_scores"
            ],
        )

    except HTTPException:
        raise

    except Exception as exc:

        raise HTTPException(
            status_code=502,
            detail=(
                "RAG backend failed: "
                f"{str(exc)}"
            ),
        )


# ============================================================
# 12. RUN DIRECTLY
# ============================================================

if __name__ == "__main__":

    import uvicorn

    uvicorn.run(
        app,
        host="127.0.0.1",
        port=8000,
    )