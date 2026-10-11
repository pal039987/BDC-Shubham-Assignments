# ============================================================
# LANGFUSE LOCAL MONITORING ASSIGNMENT
# Complete Notebook - Single Cell
# ============================================================

# ------------------------------------------------------------
# 1. INSTALL REQUIRED LIBRARIES
# ------------------------------------------------------------

# !pip install -q -U langfuse langchain-google-genai python-dotenv


# ------------------------------------------------------------
# 2. IMPORTS
# ------------------------------------------------------------

import os
import time
from typing import List

from dotenv import load_dotenv

from langchain_google_genai import ChatGoogleGenerativeAI

from langfuse import get_client, observe


# ------------------------------------------------------------
# 3. LOAD ENVIRONMENT VARIABLES
# ------------------------------------------------------------

load_dotenv()

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
LANGFUSE_PUBLIC_KEY = os.getenv("LANGFUSE_PUBLIC_KEY")
LANGFUSE_SECRET_KEY = os.getenv("LANGFUSE_SECRET_KEY")
LANGFUSE_HOST = os.getenv(
    "LANGFUSE_HOST",
    "http://localhost:3000",
)


# ------------------------------------------------------------
# 4. VALIDATE ENVIRONMENT
# ------------------------------------------------------------

if not GOOGLE_API_KEY:
    raise ValueError(
        "GOOGLE_API_KEY not found in .env file."
    )

if not LANGFUSE_PUBLIC_KEY:
    raise ValueError(
        "LANGFUSE_PUBLIC_KEY not found in .env file."
    )

if not LANGFUSE_SECRET_KEY:
    raise ValueError(
        "LANGFUSE_SECRET_KEY not found in .env file."
    )

print("Environment variables loaded successfully.")
print("Langfuse host:", LANGFUSE_HOST)


# ------------------------------------------------------------
# 5. INITIALIZE GEMINI
# ------------------------------------------------------------

llm = ChatGoogleGenerativeAI(
    model="gemini-flash-lite-latest",
    temperature=0.3,
    google_api_key=GOOGLE_API_KEY,
    max_retries=2,
)

print("Gemini model initialized.")


# ------------------------------------------------------------
# 6. INITIALIZE LANGFUSE CLIENT
# ------------------------------------------------------------

langfuse = get_client()

print("Langfuse client initialized.")


# ------------------------------------------------------------
# 7. SIMPLE LLM FUNCTION WITH TRACE
# ------------------------------------------------------------

@observe()
def simple_llm_call(prompt: str) -> str:
    """
    Create a Langfuse trace for a complete LLM request.
    """

    with langfuse.start_as_current_observation(
        as_type="generation",
        name="gemini-generation",
        model="gemini-flash-lite-latest",
        input={
            "prompt": prompt
        },
    ) as generation:

        response = llm.invoke(prompt)

        output = str(response.content)

        generation.update(
            output=output
        )

    return output


# ------------------------------------------------------------
# 8. TEST SIMPLE LLM CALL
# ------------------------------------------------------------

print("\n" + "=" * 70)
print("TEST 1 - SIMPLE LLM CALL")
print("=" * 70)

response_1 = simple_llm_call(
    "Explain Generative AI in simple words."
)

print("\nResponse:")
print(response_1)


# ------------------------------------------------------------
# 9. RUN 5 DIFFERENT LLM CALLS
# ------------------------------------------------------------

prompts = [
    "What is Retrieval Augmented Generation?",
    "Explain LangGraph in simple terms.",
    "What is the purpose of vector embeddings?",
    "What is FastAPI used for?",
    "Explain multi-agent systems in simple words.",
]

print("\n" + "=" * 70)
print("MULTIPLE TRACE TESTS")
print("=" * 70)

for i, prompt in enumerate(
    prompts,
    start=1,
):

    print(f"\n--- Prompt {i} ---")
    print(prompt)

    answer = simple_llm_call(prompt)

    print("\nResponse:")
    print(answer)


# ------------------------------------------------------------
# 10. MULTI-STEP RAG-LIKE WORKFLOW
# ------------------------------------------------------------

DOCUMENTS = [
    (
        "Retrieval Augmented Generation combines document retrieval "
        "with language model generation to provide grounded answers."
    ),
    (
        "FAISS is a library for efficient similarity search over "
        "dense vectors."
    ),
    (
        "Sentence Transformers convert text into numerical embeddings "
        "that can be used for semantic search."
    ),
    (
        "LangGraph is a framework for building stateful and "
        "multi-step agent workflows."
    ),
    (
        "FastAPI is a Python framework used to build web APIs."
    ),
]


def retrieve_documents(
    query: str,
    top_k: int = 2,
) -> List[str]:

    query_words = set(
        query.lower().split()
    )

    scored_documents = []

    for document in DOCUMENTS:

        document_words = set(
            document.lower().split()
        )

        score = len(
            query_words.intersection(
                document_words
            )
        )

        scored_documents.append(
            (score, document)
        )

    scored_documents.sort(
        key=lambda item: item[0],
        reverse=True,
    )

    return [
        document
        for score, document in scored_documents[:top_k]
        if score > 0
    ]


@observe()
def rag_like_workflow(query: str) -> str:
    """
    Root trace containing:
    1. Retrieval span
    2. Generation span
    """

    # --------------------------------------------------------
    # RETRIEVAL SPAN
    # --------------------------------------------------------

    with langfuse.start_as_current_observation(
        as_type="span",
        name="retrieval",
        input={
            "query": query
        },
    ) as retrieval_span:

        retrieved_docs = retrieve_documents(
            query,
            top_k=2,
        )

        retrieval_span.update(
            output={
                "retrieved_documents": retrieved_docs
            }
        )


    # --------------------------------------------------------
    # GENERATION SPAN
    # --------------------------------------------------------

    context = "\n\n".join(
        retrieved_docs
    )

    generation_prompt = f"""
Answer the question using only the context below.

Context:
{context}

Question:
{query}

If the context does not contain enough information,
say that the information is not available.
"""

    with langfuse.start_as_current_observation(
        as_type="generation",
        name="generation",
        model="gemini-flash-lite-latest",
        input={
            "query": query,
            "context": retrieved_docs,
        },
    ) as generation_span:

        response = llm.invoke(
            generation_prompt
        )

        answer = str(
            response.content
        )

        generation_span.update(
            output=answer
        )

    return answer


# ------------------------------------------------------------
# 11. TEST MULTI-STEP WORKFLOW
# ------------------------------------------------------------

print("\n" + "=" * 70)
print("MULTI-STEP TRACE TEST")
print("=" * 70)

rag_query_1 = (
    "What is Retrieval Augmented Generation?"
)

rag_answer_1 = rag_like_workflow(
    rag_query_1
)

print("\nQuery:")
print(rag_query_1)

print("\nAnswer:")
print(rag_answer_1)


# ------------------------------------------------------------
# 12. RUN MULTI-STEP WORKFLOW MULTIPLE TIMES
# ------------------------------------------------------------

rag_queries = [
    "What is FAISS?",
    "What are embeddings?",
    "What is LangGraph?",
    "What is FastAPI?",
]

print("\n" + "=" * 70)
print("MULTIPLE MULTI-STEP TRACES")
print("=" * 70)

for i, query in enumerate(
    rag_queries,
    start=1,
):

    print(f"\n--- Workflow {i} ---")
    print("Query:", query)

    answer = rag_like_workflow(
        query
    )

    print("Answer:", answer)


# ------------------------------------------------------------
# 13. ADD SCORE / EVALUATION
# ------------------------------------------------------------

@observe()
def evaluated_llm_call(prompt: str) -> str:

    response = llm.invoke(
        prompt
    )

    output = str(
        response.content
    )

    return output


evaluation_prompt = (
    "Explain why monitoring LLM applications is useful."
)

evaluated_answer = evaluated_llm_call(
    evaluation_prompt
)

print("\n" + "=" * 70)
print("EVALUATION TEST")
print("=" * 70)

print("\nAnswer:")
print(evaluated_answer)


# Get current trace information
trace_id = langfuse.get_current_trace_id()

print(
    "\nCurrent trace ID:",
    trace_id
)


# ------------------------------------------------------------
# 14. FLUSH LANGFUSE EVENTS
# ------------------------------------------------------------

langfuse.flush()

print("\nLangfuse events flushed successfully.")


# ------------------------------------------------------------
# 15. LANGFUSE UI INFORMATION
# ------------------------------------------------------------

print("\n" + "=" * 70)
print("LANGFUSE UI")
print("=" * 70)

print(
    "\nOpen the Langfuse dashboard:"
)

print(
    "http://localhost:3000"
)

print(
    "\nThen open:"
)

print(
    "Traces → select a trace → inspect observations."
)


# ------------------------------------------------------------
# 16. ASSIGNMENT REFLECTION
# ------------------------------------------------------------

print("\n" + "=" * 70)
print("REFLECTION")
print("=" * 70)

print("""
Langfuse helps monitor LLM applications by making it possible
to inspect traces, observations, generations, inputs and outputs.

Benefits:

1. Debugging:
   Developers can inspect individual steps of an LLM workflow.

2. Trace visibility:
   A complete request can be viewed as a trace containing
   nested observations and generations.

3. Performance analysis:
   Developers can understand how long different operations take.

4. LLM monitoring:
   Inputs and outputs of generation calls can be inspected.

5. Multi-step workflow analysis:
   Retrieval, generation, tools, and other components can
   appear as separate observations.

6. Evaluation:
   Scores can be attached to traces/observations to support
   quality monitoring.
""")


# ------------------------------------------------------------
# 17. FINAL STATUS
# ------------------------------------------------------------

print("\n" + "=" * 70)
print("ASSIGNMENT NOTEBOOK COMPLETE")
print("=" * 70)

print("""
Completed:

✓ Langfuse SDK setup
✓ Gemini integration
✓ Basic LLM tracing
✓ Multiple traces
✓ Custom retrieval span
✓ Generation span
✓ Multi-step workflow
✓ Langfuse flush
✓ Reflection
""")