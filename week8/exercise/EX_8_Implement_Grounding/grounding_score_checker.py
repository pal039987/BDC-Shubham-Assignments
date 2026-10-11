# ============================================================
# GROUNDING SCORE CHECKER + LOGGING
# Complete Assignment - Single Notebook Cell
# ============================================================


# ============================================================
# 1. INSTALL REQUIRED LIBRARIES
# ============================================================

# !pip install -q -U \
#     numpy \
#     torch \
#     sentence-transformers \
#     scikit-learn \
#     langchain-google-genai \
#     python-dotenv


# ============================================================
# 2. IMPORTS
# ============================================================

import os
import re
import logging
from typing import List, Tuple

import numpy as np

from dotenv import load_dotenv

from sentence_transformers import SentenceTransformer

from sklearn.metrics.pairwise import cosine_similarity

from langchain_google_genai import ChatGoogleGenerativeAI


# ============================================================
# 3. CONFIGURE LOGGING
# ============================================================

logger = logging.getLogger("grounding_checker")

logger.setLevel(logging.DEBUG)

# Remove previously attached handlers
logger.handlers.clear()

console_handler = logging.StreamHandler()

console_handler.setLevel(logging.DEBUG)

formatter = logging.Formatter(
    "%(asctime)s | %(levelname)s | %(message)s"
)

console_handler.setFormatter(formatter)

logger.addHandler(console_handler)

logger.propagate = False

logger.info("Grounding checker logging initialized.")


# ============================================================
# 4. LOAD ENVIRONMENT VARIABLES
# ============================================================

load_dotenv()

GOOGLE_API_KEY = os.getenv(
    "GOOGLE_API_KEY"
)

if not GOOGLE_API_KEY:

    raise ValueError(
        "GOOGLE_API_KEY not found in .env file."
    )

logger.info(
    "Google API key loaded successfully from .env."
)


# ============================================================
# 5. INITIALIZE EMBEDDING MODEL
# ============================================================

logger.info(
    "Loading sentence-transformer embedding model..."
)

embedding_model = SentenceTransformer(
    "sentence-transformers/all-MiniLM-L6-v2"
)

logger.info(
    "Embedding model loaded successfully."
)


# ============================================================
# 6. INITIALIZE GEMINI
# ============================================================

llm = ChatGoogleGenerativeAI(
    model="gemini-flash-lite-latest",
    google_api_key=GOOGLE_API_KEY,
    temperature=0.0,
    max_retries=2,
)

logger.info(
    "Gemini model initialized."
)


# ============================================================
# 7. DOCUMENT CORPUS
# ============================================================

DOCUMENTS = [
    (
        "NovaTech AI was founded in 2021 in Bengaluru, India. "
        "The company focuses on artificial intelligence software "
        "for business automation."
    ),

    (
        "NovaTech AI launched its flagship product NovaAssist "
        "in 2024. NovaAssist is designed to help employees "
        "search company knowledge and answer internal questions."
    ),

    (
        "NovaAssist uses retrieval augmented generation, or RAG, "
        "to retrieve relevant information from a company knowledge "
        "base before generating an answer."
    ),

    (
        "The retrieval component of NovaAssist converts questions "
        "into vector embeddings and compares them with stored "
        "document embeddings to find relevant information."
    ),

    (
        "FAISS is used by the prototype to perform efficient "
        "similarity search over dense document vectors."
    ),

    (
        "Sentence Transformers are used to convert documents "
        "and user questions into numerical vector embeddings "
        "for semantic similarity search."
    ),

    (
        "NovaAssist is intended for internal business use cases "
        "such as policy lookup, product documentation search, "
        "and employee knowledge assistance."
    ),

    (
        "The system is designed to provide answers based on "
        "retrieved company information rather than relying "
        "only on the language model's internal knowledge."
    ),
]


logger.info(
    "Document corpus loaded with %d documents.",
    len(DOCUMENTS)
)


# ============================================================
# 8. GENERATE EMBEDDINGS
# ============================================================

def generate_embeddings(
    text_list: List[str],
) -> np.ndarray:
    """
    Generate normalized embeddings for a list of texts.
    """

    if not text_list:

        return np.empty(
            (0, 384),
            dtype=np.float32
        )

    embeddings = embedding_model.encode(
        text_list,
        convert_to_numpy=True,
        normalize_embeddings=True,
        show_progress_bar=False,
    )

    return np.asarray(
        embeddings,
        dtype=np.float32
    )


# ============================================================
# 9. PRE-COMPUTE DOCUMENT EMBEDDINGS
# ============================================================

logger.info(
    "Generating document embeddings..."
)

document_embeddings = generate_embeddings(
    DOCUMENTS
)

logger.info(
    "Document embeddings generated. Shape: %s",
    document_embeddings.shape
)


# ============================================================
# 10. RETRIEVE DOCUMENTS
# ============================================================

def retrieve_documents(
    query: str,
    document_embeddings: np.ndarray,
    documents: List[str],
    k: int = 3,
) -> Tuple[List[str], List[float]]:
    """
    Retrieve top-k documents using cosine similarity.
    """

    logger.info(
        "Retrieving documents for query: %s",
        query
    )

    if not query.strip():

        logger.warning(
            "Empty query received."
        )

        return [], []

    query_embedding = generate_embeddings(
        [query]
    )

    similarities = cosine_similarity(
        query_embedding,
        document_embeddings
    )[0]

    top_indices = np.argsort(
        similarities
    )[::-1][:k]

    retrieved_documents = [
        documents[i]
        for i in top_indices
    ]

    retrieved_scores = [
        float(similarities[i])
        for i in top_indices
    ]

    logger.debug(
        "Retrieved documents: %s",
        retrieved_documents
    )

    logger.debug(
        "Retrieval similarity scores: %s",
        retrieved_scores
    )

    return (
        retrieved_documents,
        retrieved_scores
    )


# ============================================================
# 11. CONVERT GEMINI RESPONSE TO TEXT
# ============================================================

def response_to_text(
    content,
) -> str:
    """
    Safely convert Gemini response content into a string.
    """

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

        return "\n".join(
            parts
        ).strip()

    return str(content).strip()


# ============================================================
# 12. GENERATE RAG RESPONSE
# ============================================================

def generate_response(
    query: str,
    context: List[str],
) -> str:
    """
    Generate a response using only retrieved context.
    """

    if not context:

        logger.warning(
            "No context available for generation."
        )

        return (
            "The answer is not available in "
            "the provided context."
        )

    context_text = "\n\n".join(
        f"Context {i + 1}: {doc}"
        for i, doc in enumerate(context)
    )

    prompt = f"""
You are a grounded question-answering assistant.

Answer the user's question using ONLY the context below.

Do not use outside knowledge.
Do not invent names, dates, companies, people, or facts.

If the answer is not contained in the context,
say exactly:

"The answer is not available in the provided context."

Context:
{context_text}

User question:
{query}

Give a concise answer based only on the context.
"""

    logger.info(
        "Generating LLM response..."
    )

    try:

        response = llm.invoke(
            prompt
        )

        answer = response_to_text(
            response.content
        )

        logger.info(
            "LLM response: %s",
            answer
        )

        return answer

    except Exception as exc:

        logger.error(
            "LLM generation failed: %s",
            exc
        )

        return (
            "The response could not be generated "
            "because the LLM request failed."
        )


# ============================================================
# 13. SPLIT TEXT INTO SENTENCES
# ============================================================

def split_into_sentences(
    text: str,
) -> List[str]:
    """
    Simple rule-based sentence segmentation.
    """

    if not text or not text.strip():

        return []

    sentences = re.split(
        r"(?<=[.!?])\s+",
        text.strip()
    )

    return [
        sentence.strip()
        for sentence in sentences
        if sentence.strip()
    ]


# ============================================================
# 14. CALCULATE SENTENCE GROUNDING
# ============================================================

def calculate_grounding_score(
    response_sentence: str,
    context_sentences: List[str],
    embedding_model,
    threshold: float = 0.70,
) -> Tuple[bool, float]:
    """
    Compare one response sentence against all context
    sentences.

    Returns:
        grounded: True/False
        max_similarity: highest cosine similarity
    """

    if (
        not response_sentence.strip()
        or not context_sentences
    ):

        return False, 0.0

    response_embedding = embedding_model.encode(
        [response_sentence],
        convert_to_numpy=True,
        normalize_embeddings=True,
        show_progress_bar=False,
    )

    context_embeddings = embedding_model.encode(
        context_sentences,
        convert_to_numpy=True,
        normalize_embeddings=True,
        show_progress_bar=False,
    )

    similarities = cosine_similarity(
        response_embedding,
        context_embeddings
    )[0]

    max_similarity = float(
        np.max(similarities)
    )

    grounded = (
        max_similarity >= threshold
    )

    return (
        grounded,
        max_similarity
    )


# ============================================================
# 15. OVERALL GROUNDING
# ============================================================

def get_overall_grounding(
    llm_response: str,
    retrieved_context: List[str],
    embedding_model,
    threshold: float = 0.70,
):
    """
    Calculate percentage of response sentences that
    are grounded in the retrieved context.

    Returns:
        overall_score
        sentence_details
    """

    response_sentences = (
        split_into_sentences(
            llm_response
        )
    )

    context_sentences = []

    for document in retrieved_context:

        context_sentences.extend(
            split_into_sentences(
                document
            )
        )

    if not response_sentences:

        logger.warning(
            "No response sentences found."
        )

        return 0.0, []

    if not context_sentences:

        logger.warning(
            "No context sentences found."
        )

        return 0.0, [
            (
                sentence,
                False,
                0.0
            )
            for sentence in response_sentences
        ]

    grounded_count = 0

    details = []

    for sentence in response_sentences:

        grounded, max_similarity = (
            calculate_grounding_score(
                response_sentence=sentence,
                context_sentences=context_sentences,
                embedding_model=embedding_model,
                threshold=threshold,
            )
        )

        if grounded:

            grounded_count += 1

        details.append(
            (
                sentence,
                grounded,
                max_similarity,
            )
        )

        logger.debug(
            "Sentence grounding | grounded=%s | "
            "similarity=%.4f | sentence=%s",
            grounded,
            max_similarity,
            sentence,
        )

    overall_score = (
        grounded_count
        / len(response_sentences)
    ) * 100

    logger.info(
        "Overall grounding score: %.2f%% "
        "(threshold=%.2f)",
        overall_score,
        threshold,
    )

    return (
        overall_score,
        details
    )


# ============================================================
# 16. COMPLETE RAG + GROUNDING PIPELINE
# ============================================================

def run_grounding_pipeline(
    query: str,
    k: int = 3,
    threshold: float = 0.70,
):
    """
    Execute:
        Query
        → Retrieval
        → LLM generation
        → Grounding evaluation
    """

    logger.info(
        "================================================"
    )

    logger.info(
        "Received query: %s",
        query
    )

    retrieved_docs, retrieval_scores = (
        retrieve_documents(
            query=query,
            document_embeddings=document_embeddings,
            documents=DOCUMENTS,
            k=k,
        )
    )

    response = generate_response(
        query=query,
        context=retrieved_docs,
    )

    grounding_score, details = (
        get_overall_grounding(
            llm_response=response,
            retrieved_context=retrieved_docs,
            embedding_model=embedding_model,
            threshold=threshold,
        )
    )

    logger.info(
        "Pipeline completed."
    )

    return {
        "query": query,
        "retrieved_docs": retrieved_docs,
        "retrieval_scores": retrieval_scores,
        "response": response,
        "grounding_score": grounding_score,
        "sentence_details": details,
    }


# ============================================================
# 17. TEST 1 - STRONGLY GROUNDED
# ============================================================

print("\n" + "=" * 70)
print("TEST 1 - STRONGLY GROUNDED QUERY")
print("=" * 70)

result_1 = run_grounding_pipeline(
    query=(
        "When was NovaTech AI founded and where?"
    ),
    k=3,
    threshold=0.70,
)

print("\nQuery:")
print(result_1["query"])

print("\nRetrieved Context:")

for i, doc in enumerate(
    result_1["retrieved_docs"],
    start=1,
):

    print(
        f"{i}. {doc}"
    )

print("\nLLM Response:")
print(result_1["response"])

print(
    f"\nGrounding Score: "
    f"{result_1['grounding_score']:.2f}%"
)

print("\nSentence-level grounding:")

for sentence, grounded, similarity in (
    result_1["sentence_details"]
):

    print(
        f"- [{grounded}] "
        f"{similarity:.4f} "
        f"{sentence}"
    )


# ============================================================
# 18. TEST 2 - STRONGLY GROUNDED
# ============================================================

print("\n" + "=" * 70)
print("TEST 2 - GROUNDED QUERY")
print("=" * 70)

result_2 = run_grounding_pipeline(
    query=(
        "What is NovaAssist used for and "
        "when was it launched?"
    ),
    k=3,
    threshold=0.70,
)

print("\nQuery:")
print(result_2["query"])

print("\nLLM Response:")
print(result_2["response"])

print(
    f"\nGrounding Score: "
    f"{result_2['grounding_score']:.2f}%"
)

print("\nSentence-level grounding:")

for sentence, grounded, similarity in (
    result_2["sentence_details"]
):

    print(
        f"- [{grounded}] "
        f"{similarity:.4f} "
        f"{sentence}"
    )


# ============================================================
# 19. TEST 3 - OUTSIDE / POORLY GROUNDED QUERY
# ============================================================

print("\n" + "=" * 70)
print("TEST 3 - OUTSIDE CONTEXT")
print("=" * 70)

result_3 = run_grounding_pipeline(
    query=(
        "Who is the CEO of NovaTech AI "
        "and what is their favorite programming language?"
    ),
    k=3,
    threshold=0.70,
)

print("\nQuery:")
print(result_3["query"])

print("\nLLM Response:")
print(result_3["response"])

print(
    f"\nGrounding Score: "
    f"{result_3['grounding_score']:.2f}%"
)

print("\nSentence-level grounding:")

for sentence, grounded, similarity in (
    result_3["sentence_details"]
):

    print(
        f"- [{grounded}] "
        f"{similarity:.4f} "
        f"{sentence}"
    )


# ============================================================
# 20. THRESHOLD COMPARISON
# ============================================================

print("\n" + "=" * 70)
print("THRESHOLD COMPARISON")
print("=" * 70)

thresholds = [
    0.60,
    0.70,
    0.80,
]

for threshold in thresholds:

    score, details = (
        get_overall_grounding(
            llm_response=result_1["response"],
            retrieved_context=result_1["retrieved_docs"],
            embedding_model=embedding_model,
            threshold=threshold,
        )
    )

    print(
        f"Threshold {threshold:.2f} "
        f"→ Grounding {score:.2f}%"
    )


# ============================================================
# 21. REFLECTION / ANALYSIS
# ============================================================

print("\n" + "=" * 70)
print("REFLECTION AND ANALYSIS")
print("=" * 70)

print(
    """
Grounding Score Interpretation:

1. A high grounding score means that most response
   sentences have a context sentence with cosine
   similarity above the selected threshold.

2. A low grounding score means that one or more response
   sentences are not semantically supported strongly
   enough by the retrieved context.

3. A threshold of 0.70 is used as a practical starting
   point for this demonstration. Increasing the threshold
   makes the checker stricter, while decreasing it makes
   the checker more permissive.

4. Semantic similarity is not a proof of factual
   correctness. Two sentences can be semantically similar
   while still making different factual claims.

5. Therefore, this grounding score should be treated as
   an observability signal rather than a perfect
   hallucination detector.

6. The outside-context test is especially useful because
   the response should not invent information that does
   not appear in the retrieved documents.
"""
)


# ============================================================
# 22. LIMITATIONS
# ============================================================

print("\n" + "=" * 70)
print("LIMITATIONS OF SEMANTIC-SIMILARITY GROUNDING")
print("=" * 70)

print(
    """
Semantic similarity alone has several limitations:

- High similarity does not guarantee factual entailment.
- Paraphrased incorrect statements may still score highly.
- Numerical contradictions can be missed.
- Negation can be difficult to detect.
- Thresholds depend on the embedding model and dataset.
- A response can be partially correct but receive a low score.

Possible improvements:

- Natural Language Inference / entailment models
- Fact verification
- LLM-as-a-judge evaluation
- Claim-level verification
- Retrieval confidence scores
- Structured factual consistency checks
"""
)


# ============================================================
# 23. LANGFUSE / OBSERVABILITY INTEGRATION DISCUSSION
# ============================================================

print("\n" + "=" * 70)
print("TRACING INTEGRATION")
print("=" * 70)

print(
    """
The grounding score checker can be integrated with Langfuse
or another observability system.

A trace could contain:

    Query
      ↓
    Retrieval span
      ↓
    LLM generation span
      ↓
    Grounding evaluation
      ↓
    Grounding score

The grounding score can be recorded as a trace score.

This makes it possible to compare:
- LLM responses
- retrieved context
- latency
- similarity scores
- grounding scores
- failures
"""
)


# ============================================================
# 24. PRACTICAL APPLICATIONS
# ============================================================

print("\n" + "=" * 70)
print("PRACTICAL APPLICATIONS")
print("=" * 70)

print(
    """
Grounding checks can be useful in:

- Enterprise RAG systems
- HR policy assistants
- Customer support bots
- Legal document assistants
- Medical information systems
- Financial document analysis
- Product documentation assistants
- Compliance systems
- Knowledge-base chatbots
"""
)


# ============================================================
# 25. FINAL STATUS
# ============================================================

logger.info(
    "Grounding score checker assignment completed."
)

print("\n" + "=" * 70)
print("ASSIGNMENT COMPLETE")
print("=" * 70)

print(
    """
✓ Environment setup
✓ Document corpus
✓ Sentence Transformer embeddings
✓ Cosine similarity retrieval
✓ Gemini response generation
✓ Sentence segmentation
✓ Sentence-level grounding
✓ Overall grounding percentage
✓ Three test queries
✓ Threshold comparison
✓ INFO logging
✓ DEBUG logging
✓ Reflection and limitations
✓ Tracing integration discussion
"""
)