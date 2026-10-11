# ============================================================
# RAG + REFLECTION WORKFLOW USING LANGGRAPH
# Complete Notebook Code - Single Cell
# ============================================================


# ============================================================
# 1. INSTALL REQUIRED LIBRARIES
# ============================================================

# !pip install -q -U \
#     langgraph \
#     langchain \
#     langchain-community \
#     langchain-google-genai \
#     faiss-cpu \
#     python-dotenv \
#     graphviz


# ============================================================
# 2. IMPORTS
# ============================================================

import os
from typing import List, TypedDict, Optional

from dotenv import load_dotenv

from langgraph.graph import StateGraph, START, END

from langchain_core.prompts import PromptTemplate
from langchain_core.documents import Document

from langchain_google_genai import (
    ChatGoogleGenerativeAI,
    GoogleGenerativeAIEmbeddings,
)

from langchain_community.vectorstores import FAISS


# ============================================================
# 3. LOAD ENVIRONMENT VARIABLES
# ============================================================

# Try current directory first, then parent directories.
# This works with the week8/.env structure used in your setup.

from pathlib import Path

current_dir = Path.cwd()

env_candidates = [
    current_dir / ".env",
    current_dir.parent / ".env",
    current_dir.parent.parent / ".env",
]

env_loaded = False

for env_path in env_candidates:
    if env_path.exists():
        load_dotenv(env_path)
        print(f".env loaded from: {env_path}")
        env_loaded = True
        break

if not env_loaded:
    load_dotenv()
    print(".env loaded using default lookup.")


# ============================================================
# 4. GET GOOGLE API KEY
# ============================================================

GOOGLE_API_KEY = os.getenv(
    "GOOGLE_API_KEY"
)

if not GOOGLE_API_KEY:
    raise ValueError(
        "GOOGLE_API_KEY not found in .env file.\n"
        "Please add:\n"
        "GOOGLE_API_KEY=YOUR_API_KEY"
    )

print("Google API key loaded successfully.")


# ============================================================
# 5. INITIALIZE GEMINI LLM
# ============================================================

llm = ChatGoogleGenerativeAI(
    model="gemini-flash-lite-latest",
    temperature=0.2,
    google_api_key=GOOGLE_API_KEY,
    max_retries=2,
)

# Separate judge model for reflection
judge_llm = ChatGoogleGenerativeAI(
    model="gemini-flash-lite-latest",
    temperature=0.0,
    google_api_key=GOOGLE_API_KEY,
    max_retries=2,
)

print("Gemini LLM initialized.")


# ============================================================
# 6. INITIALIZE GEMINI EMBEDDINGS
# ============================================================

# IMPORTANT:
# This is NOT the same as the chat model.
# It is used only to create vector embeddings.

embedder = GoogleGenerativeAIEmbeddings(
    model="gemini-embedding-001",
    google_api_key=GOOGLE_API_KEY,
)

print("Gemini embedding model initialized.")


# ============================================================
# 7. KNOWLEDGE BASE
# ============================================================

DOCS = [
    {
        "id": "doc-1",
        "text": (
            "Mitochondria are the powerhouses of the cell. "
            "They generate ATP via oxidative phosphorylation."
        ),
    },
    {
        "id": "doc-2",
        "text": (
            "Photosynthesis occurs in chloroplasts, converting "
            "light energy into chemical energy in plants."
        ),
    },
    {
        "id": "doc-3",
        "text": (
            "A black hole is a region of spacetime where gravity "
            "is so strong that nothing can escape."
        ),
    },
    {
        "id": "doc-4",
        "text": (
            "RAG systems combine retrieval from a knowledge base "
            "with generation to answer questions grounded in facts."
        ),
    },
]


# ============================================================
# 8. BUILD FAISS VECTOR STORE
# ============================================================

def build_faiss_index(
    docs: List[dict],
) -> FAISS:
    """
    Build a FAISS index from the supplied documents.
    """

    texts = [
        document["text"]
        for document in docs
    ]

    metadatas = [
        {
            "id": document["id"]
        }
        for document in docs
    ]

    vectorstore = FAISS.from_texts(
        texts=texts,
        embedding=embedder,
        metadatas=metadatas,
    )

    return vectorstore


print("\nBuilding FAISS index...")

vectorstore = build_faiss_index(
    DOCS
)

print(
    f"FAISS index created with {len(DOCS)} documents."
)


# ============================================================
# 9. CREATE RETRIEVER
# ============================================================

retriever = vectorstore.as_retriever(
    search_type="similarity",
    search_kwargs={
        "k": 3
    },
)

print("Retriever created.")


# ============================================================
# 10. DEFINE LANGGRAPH STATE
# ============================================================

class RAGState(TypedDict):
    """
    State shared by all LangGraph nodes.
    """

    question: str

    rewritten_question: Optional[str]

    context_docs: List[Document]

    draft: Optional[str]

    final: Optional[str]

    reflection: Optional[str]


# ============================================================
# 11. GENERATION PROMPT
# ============================================================

GEN_PROMPT = PromptTemplate.from_template(
    """
You are a careful factual assistant.

Use ONLY the provided context to answer the question.

Rules:
- Do not invent facts.
- Do not use outside knowledge.
- If the answer is not in the context, say:
  "I don't have enough information in the provided context."
- Keep the answer concise.
- Cite document IDs in brackets when possible.

Question:
{question}

Context:
{context}

Answer:
"""
)


# ============================================================
# 12. REFLECTION PROMPT
# ============================================================

REFLECT_PROMPT = PromptTemplate.from_template(
    """
You are a strict factual reviewer.

Check whether the draft answer is completely supported
by the provided context.

Question:
{question}

Draft Answer:
{draft}

Context:
{context}

If the draft is fully supported by the context,
return exactly:

PASS

Otherwise, return ONLY a corrected concise answer
that uses information from the context.
Do not add explanations about the correction.
"""
)


# ============================================================
# 13. HELPER: CONVERT GEMINI RESPONSE TO TEXT
# ============================================================

def response_to_text(
    content,
) -> str:
    """
    Safely convert Gemini response content to a plain string.
    """

    if isinstance(
        content,
        str,
    ):
        return content.strip()

    if isinstance(
        content,
        list,
    ):

        parts = []

        for item in content:

            if isinstance(
                item,
                dict,
            ):

                text = item.get(
                    "text"
                )

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

    return str(
        content
    ).strip()


# ============================================================
# 14. NODE 1: RETRIEVE
# ============================================================

def retrieve_node(
    state: RAGState,
):
    """
    Retrieve relevant documents from FAISS.
    """

    question = (
        state.get("rewritten_question")
        or state["question"]
    )

    print(
        f"\n[Retrieve] Query: {question}"
    )

    documents = retriever.invoke(
        question
    )

    print(
        f"[Retrieve] Retrieved {len(documents)} document(s)."
    )

    for document in documents:

        print(
            f"  - {document.metadata.get('id', 'unknown')}"
        )

    return {
        "context_docs": documents
    }


# ============================================================
# 15. NODE 2: GENERATE
# ============================================================

def generate_node(
    state: RAGState,
):
    """
    Generate an initial answer using retrieved context.
    """

    question = (
        state.get("rewritten_question")
        or state["question"]
    )

    context = "\n\n".join(
        (
            f"[{document.metadata.get('id', 'unknown')}]\n"
            f"{document.page_content}"
        )
        for document in state["context_docs"]
    )

    formatted_prompt = GEN_PROMPT.format(
        question=question,
        context=context,
    )

    print(
        "\n[Generate] Generating draft answer..."
    )

    response = llm.invoke(
        formatted_prompt
    )

    draft = response_to_text(
        response.content
    )

    print(
        f"[Generate] Draft: {draft}"
    )

    return {
        "draft": draft
    }


# ============================================================
# 16. NODE 3: REFLECT
# ============================================================

def reflect_node(
    state: RAGState,
):
    """
    Check whether the draft is supported by context.
    """

    question = (
        state.get("rewritten_question")
        or state["question"]
    )

    context = "\n\n".join(
        (
            f"[{document.metadata.get('id', 'unknown')}]\n"
            f"{document.page_content}"
        )
        for document in state["context_docs"]
    )

    formatted_prompt = REFLECT_PROMPT.format(
        question=question,
        draft=state["draft"] or "",
        context=context,
    )

    print(
        "\n[Reflect] Reviewing draft..."
    )

    response = judge_llm.invoke(
        formatted_prompt
    )

    reflection = response_to_text(
        response.content
    )

    print(
        f"[Reflect] Result: {reflection}"
    )

    # --------------------------------------------------------
    # Draft is correct
    # --------------------------------------------------------

    if reflection.strip().upper() == "PASS":

        print(
            "[Reflect] Draft passed validation."
        )

        return {
            "reflection": reflection,
            "final": state["draft"],
        }

    # --------------------------------------------------------
    # Draft needs correction
    # --------------------------------------------------------

    print(
        "[Reflect] Draft was corrected."
    )

    return {
        "reflection": reflection,
        "final": reflection,
    }


# ============================================================
# 17. BUILD LANGGRAPH WORKFLOW
# ============================================================

workflow = StateGraph(
    RAGState
)

# Add nodes
workflow.add_node(
    "retrieve",
    retrieve_node,
)

workflow.add_node(
    "generate",
    generate_node,
)

workflow.add_node(
    "reflect",
    reflect_node,
)


# ============================================================
# 18. DEFINE EDGES
# ============================================================

workflow.add_edge(
    START,
    "retrieve",
)

workflow.add_edge(
    "retrieve",
    "generate",
)

workflow.add_edge(
    "generate",
    "reflect",
)

workflow.add_edge(
    "reflect",
    END,
)


# ============================================================
# 19. COMPILE GRAPH
# ============================================================

graph = workflow.compile()

print(
    "\nLangGraph workflow compiled successfully."
)


# ============================================================
# 20. CREATE INITIAL STATE
# ============================================================

query = "What do mitochondria do?"

initial_state: RAGState = {
    "question": query,
    "rewritten_question": None,
    "context_docs": [],
    "draft": None,
    "final": None,
    "reflection": None,
}


# ============================================================
# 21. RUN GRAPH
# ============================================================

print(
    "\n" + "=" * 70
)

print(
    "RUNNING RAG REFLECTION WORKFLOW"
)

print(
    "=" * 70
)

result = graph.invoke(
    initial_state
)


# ============================================================
# 22. DISPLAY FINAL RESULT
# ============================================================

print(
    "\n" + "=" * 70
)

print(
    "FINAL RESULT"
)

print(
    "=" * 70
)

print(
    "\nQuestion:"
)

print(
    result["question"]
)

print(
    "\nRetrieved Documents:"
)

for document in result["context_docs"]:

    print(
        f"- {document.metadata.get('id', 'unknown')}: "
        f"{document.page_content}"
    )

print(
    "\nDraft Answer:"
)

print(
    result["draft"]
)

print(
    "\nReflection:"
)

print(
    result["reflection"]
)

print(
    "\nFinal Answer:"
)

print(
    result["final"]
)


# ============================================================
# 23. SECOND TEST
# ============================================================

query_2 = (
    "Where does photosynthesis occur?"
)

result_2 = graph.invoke(
    {
        "question": query_2,
        "rewritten_question": None,
        "context_docs": [],
        "draft": None,
        "final": None,
        "reflection": None,
    }
)

print(
    "\n" + "=" * 70
)

print(
    "SECOND TEST"
)

print(
    "=" * 70
)

print(
    "\nQuestion:"
)

print(
    result_2["question"]
)

print(
    "\nFinal Answer:"
)

print(
    result_2["final"]
)


# ============================================================
# 24. THIRD TEST
# ============================================================

query_3 = (
    "What is RAG?"
)

result_3 = graph.invoke(
    {
        "question": query_3,
        "rewritten_question": None,
        "context_docs": [],
        "draft": None,
        "final": None,
        "reflection": None,
    }
)

print(
    "\n" + "=" * 70
)

print(
    "THIRD TEST"
)

print(
    "=" * 70
)

print(
    "\nQuestion:"
)

print(
    result_3["question"]
)

print(
    "\nFinal Answer:"
)

print(
    result_3["final"]
)


# ============================================================
# 25. OUTSIDE-CONTEXT TEST
# ============================================================

query_4 = (
    "Who is the president of France?"
)

result_4 = graph.invoke(
    {
        "question": query_4,
        "rewritten_question": None,
        "context_docs": [],
        "draft": None,
        "final": None,
        "reflection": None,
    }
)

print(
    "\n" + "=" * 70
)

print(
    "OUTSIDE-CONTEXT TEST"
)

print(
    "=" * 70
)

print(
    "\nQuestion:"
)

print(
    result_4["question"]
)

print(
    "\nFinal Answer:"
)

print(
    result_4["final"]
)


# ============================================================
# 26. GRAPH VISUALIZATION
# ============================================================

print(
    "\n" + "=" * 70
)

print(
    "GRAPH STRUCTURE"
)

print(
    "=" * 70
)

try:

    from graphviz import Digraph

    dot = Digraph(
        comment="RAG Reflection Workflow"
    )

    dot.attr(
        rankdir="LR"
    )

    dot.node(
        "START",
        "START",
        shape="circle",
    )

    dot.node(
        "retrieve",
        "Retrieve",
        shape="box",
    )

    dot.node(
        "generate",
        "Generate",
        shape="box",
    )

    dot.node(
        "reflect",
        "Reflect",
        shape="box",
    )

    dot.node(
        "END",
        "END",
        shape="doublecircle",
    )

    dot.edge(
        "START",
        "retrieve",
    )

    dot.edge(
        "retrieve",
        "generate",
    )

    dot.edge(
        "generate",
        "reflect",
    )

    dot.edge(
        "reflect",
        "END",
    )

    output_path = "/tmp/rag_reflection_workflow"

    dot.render(
        output_path,
        format="png",
        view=False,
    )

    print(
        f"Graph image created at: {output_path}.png"
    )

    try:

        from IPython.display import Image, display

        display(
            Image(
                filename=f"{output_path}.png"
            )
        )

    except Exception:

        print(
            "Graph image created successfully."
        )

except Exception as exc:

    print(
        "Graphviz rendering was not available."
    )

    print(
        f"Reason: {exc}"
    )

    print(
        "\nWorkflow:"
    )

    print(
        "START → RETRIEVE → GENERATE → REFLECT → END"
    )


# ============================================================
# 27. FINAL SUMMARY
# ============================================================

print(
    "\n" + "=" * 70
)

print(
    "WORKFLOW SUMMARY"
)

print(
    "=" * 70
)

print(
    """
Question
   ↓
Retrieve from FAISS
   ↓
Generate Draft Answer with Gemini
   ↓
Reflect / Validate with Gemini
   ↓
Final Answer
"""
)

print(
    "RAG + Reflection workflow completed successfully."
)