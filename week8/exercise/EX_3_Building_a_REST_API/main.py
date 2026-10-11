# ============================================================
# main.py
# RAG Pipeline + FastAPI REST API
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
# 3. SAMPLE DOCUMENT CORPUS
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
        "clustering of dense vectors. It is commonly used to build "
        "fast vector search systems."
    ),
    (
        "Sentence Transformers can convert sentences and paragraphs "
        "into fixed-size numerical embeddings that can be used for "
        "semantic search."
    ),
    (
        "The all-MiniLM-L6-v2 model produces compact embeddings and "
        "is commonly used for semantic similarity and information "
        "retrieval tasks."
    ),
    (
        "FastAPI is a Python web framework used to create APIs with "
        "automatic validation and interactive documentation."
    ),
    (
        "FastAPI automatically provides Swagger UI documentation "
        "through the /docs endpoint and OpenAPI documentation."
    ),
    (
        "A POST request sends data to a server. In FastAPI, a "
        "Pydantic model can validate the JSON request body."
    ),
    (
        "Pydantic models provide data validation and structured "
        "serialization for FastAPI request and response objects."
    ),
    (
        "Uvicorn is an ASGI server commonly used to run FastAPI "
        "applications."
    ),
    (
        "A health check endpoint can be used to verify whether "
        "an API service is running correctly."
    ),
    (
        "Semantic search focuses on the meaning of a query rather "
        "than requiring exact keyword matches."
    ),
    (
        "Cosine similarity measures how similar two vectors are by "
        "comparing the angle between them."
    ),
]


# ============================================================
# 4. RAG PIPELINE CLASS
# ============================================================

class RAGPipeline:
    """
    Simple RAG pipeline using:
    - Sentence Transformers for embeddings
    - FAISS for vector search
    - Gemini for answer generation
    """

    def __init__(
        self,
        documents: List[str],
        embedding_model: str = "sentence-transformers/all-MiniLM-L6-v2",
    ):
        self.documents = documents

        print("Loading embedding model...")
        self.embedding_model = SentenceTransformer(
            embedding_model
        )

        print("Creating document embeddings...")

        document_embeddings = self.embedding_model.encode(
            self.documents,
            convert_to_numpy=True,
            normalize_embeddings=True,
            show_progress_bar=False,
        )

        document_embeddings = np.asarray(
            document_embeddings,
            dtype="float32",
        )

        dimension = document_embeddings.shape[1]

        # Inner Product on normalized vectors = cosine similarity
        self.index = faiss.IndexFlatIP(dimension)

        self.index.add(document_embeddings)

        print(
            f"RAG index ready with {len(self.documents)} documents."
        )

    # --------------------------------------------------------
    # RETRIEVAL
    # --------------------------------------------------------

    def retrieve(
        self,
        query: str,
        k: int = 3,
        min_similarity: float = 0.20,
    ) -> Tuple[List[str], List[float]]:
        """
        Retrieve top-k relevant documents.
        """

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

        k = min(k, len(self.documents))

        scores, indices = self.index.search(
            query_embedding,
            k,
        )

        retrieved_docs = []
        similarity_scores = []

        for score, index in zip(
            scores[0],
            indices[0],
        ):
            if index == -1:
                continue

            score = float(score)

            if score < min_similarity:
                continue

            retrieved_docs.append(
                self.documents[index]
            )

            similarity_scores.append(score)

        return retrieved_docs, similarity_scores

    # --------------------------------------------------------
    # RESPONSE CONTENT HELPER
    # --------------------------------------------------------

    @staticmethod
    def _content_to_text(content) -> str:
        """
        Safely convert Gemini response content into text.
        """

        if isinstance(content, str):
            return content.strip()

        if isinstance(content, list):
            parts = []

            for item in content:
                if isinstance(item, dict):
                    text = item.get("text")

                    if text:
                        parts.append(str(text))
                else:
                    parts.append(str(item))

            return "\n".join(parts).strip()

        return str(content).strip()

    # --------------------------------------------------------
    # GENERATION
    # --------------------------------------------------------

    def generate(
        self,
        query: str,
        retrieved_docs: List[str],
    ) -> str:
        """
        Generate an answer using retrieved context.
        """

        if not retrieved_docs:
            return (
                "I could not find relevant information "
                "in the available documents."
            )

        context = "\n\n".join(
            f"Document {i + 1}: {doc}"
            for i, doc in enumerate(retrieved_docs)
        )

        prompt = f"""
You are a helpful RAG assistant.

Answer the user's question using ONLY the information
provided in the context below.

Do not invent facts.
If the context does not contain enough information,
say that the information is not available in the
provided documents.

Context:
{context}

Question:
{query}

Provide a clear and concise answer.
"""

        response = llm.invoke(prompt)

        return self._content_to_text(
            response.content
        )

    # --------------------------------------------------------
    # COMPLETE RAG QUERY
    # --------------------------------------------------------

    def query(
        self,
        query: str,
        k: int = 3,
    ):
        """
        Run retrieval + generation.
        """

        retrieved_docs, similarity_scores = self.retrieve(
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
            "similarity_scores": similarity_scores,
        }


# ============================================================
# 5. INITIALIZE RAG PIPELINE
# ============================================================

rag_pipeline = RAGPipeline(
    documents=DOCUMENTS
)


# ============================================================
# 6. FASTAPI APPLICATION
# ============================================================

app = FastAPI(
    title="RAG Pipeline REST API",
    description=(
        "REST API for a Retrieval Augmented Generation "
        "pipeline using Sentence Transformers, FAISS, "
        "and Gemini."
    ),
    version="1.0.0",
)


# ============================================================
# 7. PYDANTIC REQUEST MODEL
# ============================================================

class ChatRequest(BaseModel):
    query: str = Field(
        ...,
        min_length=3,
        max_length=500,
        description="User question",
    )


# ============================================================
# 8. PYDANTIC RESPONSE MODEL
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
        "message": "RAG FastAPI API is running.",
        "docs": "/docs",
    }


# ============================================================
# 10. HEALTH CHECK
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
async def chat(request: ChatRequest):
    """
    Receive a user query, retrieve relevant documents,
    generate a Gemini answer, and return the result.
    """

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
                    "No relevant documents found "
                    "for this query."
                ),
            )

        return ChatResponse(
            answer=result["answer"],
            retrieved_docs=result["retrieved_docs"],
            similarity_scores=result["similarity_scores"],
        )

    except HTTPException:
        raise

    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail=(
                "RAG generation failed. "
                f"Error: {str(exc)}"
            ),
        )


# ============================================================
# 12. LOCAL TEST
# ============================================================

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="127.0.0.1",
        port=8000,
        reload=True,
    )