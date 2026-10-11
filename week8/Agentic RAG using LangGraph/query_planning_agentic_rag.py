# ============================================================
# QUERY PLANNING AGENTIC RAG USING LANGGRAPH
# Complete Notebook - Single Cell
# ============================================================


# ============================================================
# 1. INSTALL REQUIRED LIBRARIES
# ============================================================

# !pip install -q -U \
#     langgraph \
#     langchain \
#     langchain-community \
#     langchain-google-genai \
#     langchain-huggingface \
#     chromadb \
#     sentence-transformers \
#     python-dotenv \
#     graphviz


# ============================================================
# 2. IMPORTS
# ============================================================

import os
from pathlib import Path
from typing import List, TypedDict, Optional

from dotenv import load_dotenv

from langgraph.graph import StateGraph, START, END

from langchain_core.prompts import ChatPromptTemplate

from langchain_google_genai import ChatGoogleGenerativeAI

from langchain_huggingface import HuggingFaceEmbeddings

from langchain_chroma import Chroma


# ============================================================
# 3. LOAD .ENV
# ============================================================

CURRENT_DIR = Path.cwd()

ENV_CANDIDATES = [
    CURRENT_DIR / ".env",
    CURRENT_DIR.parent / ".env",
    CURRENT_DIR.parent.parent / ".env",
]

env_loaded = False

for env_path in ENV_CANDIDATES:

    if env_path.exists():

        load_dotenv(env_path)

        print(
            f".env loaded from: {env_path}"
        )

        env_loaded = True
        break


if not env_loaded:

    load_dotenv()

    print(
        ".env loaded using default lookup."
    )


# ============================================================
# 4. GOOGLE API KEY
# ============================================================

GOOGLE_API_KEY = os.getenv(
    "GOOGLE_API_KEY"
)

if not GOOGLE_API_KEY:

    raise ValueError(
        "GOOGLE_API_KEY not found in .env file."
    )

print(
    "Google API key loaded successfully."
)


# ============================================================
# 5. INITIALIZE GEMINI
# ============================================================

llm = ChatGoogleGenerativeAI(
    model="gemini-flash-lite-latest",
    temperature=0.0,
    google_api_key=GOOGLE_API_KEY,
    max_retries=2,
)

print(
    "Gemini model initialized."
)


# ============================================================
# 6. CREATE SAMPLE DOCUMENT FILE
# ============================================================

sample_docs_path = CURRENT_DIR / "sample_docs.txt"

sample_docs_text = """
Graph Neural Networks (GNNs) are neural networks designed to work
with graph-structured data. They can learn representations of
nodes, edges, and entire graphs.

One important application of Graph Neural Networks is social network
analysis. GNNs can model relationships between users and can be used
for tasks such as recommendation and link prediction.

GNNs are also useful in fraud detection. Financial transactions can
be represented as graphs, where accounts and transactions are nodes
and edges. Graph learning can help identify unusual relationships
and suspicious patterns.

Another application is molecular analysis. Molecules can be
represented as graphs in which atoms are nodes and chemical bonds
are edges. GNNs can learn representations that help predict
molecular properties.

Graph Neural Networks are also used in traffic prediction.
Road networks can be represented as graphs, allowing models to
learn relationships between different roads and intersections.

Recommendation systems can use graph structures to represent
relationships between users and products. GNNs can use these
relationships to improve personalized recommendations.

Knowledge graphs are another important use case. GNNs can learn
from entities and relationships in a knowledge graph and support
tasks such as entity prediction and relationship prediction.

GNNs are commonly used for node classification, link prediction,
graph classification, recommendation, fraud detection, molecular
property prediction, and other graph learning tasks.
""".strip()


if not sample_docs_path.exists():

    sample_docs_path.write_text(
        sample_docs_text,
        encoding="utf-8",
    )

    print(
        f"Created: {sample_docs_path}"
    )

else:

    print(
        f"Using existing: {sample_docs_path}"
    )


# ============================================================
# 7. READ DOCUMENT
# ============================================================

document_text = sample_docs_path.read_text(
    encoding="utf-8"
)

# Split paragraphs into individual documents
raw_docs = [
    paragraph.strip()
    for paragraph in document_text.split("\n\n")
    if paragraph.strip()
]

print(
    f"Loaded {len(raw_docs)} document chunks."
)


# ============================================================
# 8. INITIALIZE LOCAL EMBEDDING MODEL
# ============================================================

print(
    "Loading Hugging Face embedding model..."
)

embedding = HuggingFaceEmbeddings(
    model_name="sentence-transformers/all-MiniLM-L6-v2"
)

print(
    "Embedding model loaded."
)


# ============================================================
# 9. BUILD CHROMA VECTOR STORE
# ============================================================

documents_for_chroma = []

for i, text in enumerate(
    raw_docs,
    start=1,
):

    documents_for_chroma.append(
        {
            "page_content": text,
            "metadata": {
                "doc_id": f"doc-{i}"
            }
        }
    )


# Create LangChain Document objects
from langchain_core.documents import Document

chroma_documents = [
    Document(
        page_content=item["page_content"],
        metadata=item["metadata"],
    )
    for item in documents_for_chroma
]


print(
    "Building Chroma vector database..."
)

vectordb = Chroma.from_documents(
    documents=chroma_documents,
    embedding=embedding,
    collection_name="query_planning_rag",
)

print(
    "Chroma vector database created."
)


# ============================================================
# 10. CREATE RETRIEVER
# ============================================================

retriever = vectordb.as_retriever(
    search_type="similarity",
    search_kwargs={
        "k": 3
    },
)

print(
    "Retriever created."
)


# ============================================================
# 11. DEFINE LANGGRAPH STATE
# ============================================================

class AgentState(TypedDict):

    # Original user query
    query: str

    # AI-generated query plan
    plan: Optional[str]

    # Retrieved document texts
    context: List[str]

    # Retrieved document IDs
    context_ids: List[str]

    # Final answer
    answer: Optional[str]


# ============================================================
# 12. PLANNING PROMPT
# ============================================================

PLAN_PROMPT = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            """
You are a query-planning assistant for a RAG system.

Create a simple plan for answering the user's question.

The plan should:
1. Identify the main topic.
2. Identify what information should be retrieved.
3. Explain what the final answer should focus on.

Do not answer the question yet.
Return only the plan.
""",
        ),
        (
            "human",
            "User question: {query}",
        ),
    ]
)


# ============================================================
# 13. ANSWER PROMPT
# ============================================================

ANSWER_PROMPT = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            """
You are a factual RAG assistant.

Use ONLY the provided retrieved context.

Rules:
- Do not invent facts.
- Do not use outside knowledge.
- If the answer is not available in the context,
  say:
  "I don't have enough information in the provided context."
- Give a concise and clear answer.
""",
        ),
        (
            "human",
            """
Query Plan:
{plan}

Retrieved Context:
{context}

Question:
{query}

Final Answer:
""",
        ),
    ]
)


# ============================================================
# 14. HELPER TO CONVERT GEMINI RESPONSE TO TEXT
# ============================================================

def response_to_text(
    content,
) -> str:

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
# 15. NODE 1 - PLANNING
# ============================================================

def plan_node(
    state: AgentState,
):

    query = state["query"]

    print(
        "\n[Planning Node]"
    )

    print(
        "Query:",
        query
    )

    messages = PLAN_PROMPT.format_messages(
        query=query
    )

    response = llm.invoke(
        messages
    )

    plan = response_to_text(
        response.content
    )

    print(
        "Generated Plan:"
    )

    print(
        plan
    )

    return {
        "plan": plan
    }


# ============================================================
# 16. NODE 2 - RETRIEVAL
# ============================================================

def retrieve_node(
    state: AgentState,
):

    query = state["query"]

    print(
        "\n[Retrieval Node]"
    )

    print(
        "Searching Chroma..."
    )

    docs = retriever.invoke(
        query
    )

    context = [
        document.page_content
        for document in docs
    ]

    context_ids = [
        document.metadata.get(
            "doc_id",
            "unknown",
        )
        for document in docs
    ]

    print(
        f"Retrieved {len(context)} documents."
    )

    for doc_id in context_ids:

        print(
            " -",
            doc_id
        )

    return {
        "context": context,
        "context_ids": context_ids,
    }


# ============================================================
# 17. NODE 3 - ANSWER GENERATION
# ============================================================

def answer_node(
    state: AgentState,
):

    query = state["query"]

    plan = state["plan"] or ""

    context = "\n\n".join(
        f"[{doc_id}]\n{doc_text}"
        for doc_id, doc_text in zip(
            state["context_ids"],
            state["context"],
        )
    )

    print(
        "\n[Answer Node]"
    )

    prompt_messages = ANSWER_PROMPT.format_messages(
        query=query,
        plan=plan,
        context=context,
    )

    response = llm.invoke(
        prompt_messages
    )

    answer = response_to_text(
        response.content
    )

    print(
        "Generated Answer:"
    )

    print(
        answer
    )

    return {
        "answer": answer
    }


# ============================================================
# 18. BUILD LANGGRAPH
# ============================================================

workflow = StateGraph(
    AgentState
)


# Add nodes
workflow.add_node(
    "plan",
    plan_node,
)

workflow.add_node(
    "retrieve",
    retrieve_node,
)

workflow.add_node(
    "answer",
    answer_node,
)


# ============================================================
# 19. DEFINE GRAPH EDGES
# ============================================================

workflow.add_edge(
    START,
    "plan",
)

workflow.add_edge(
    "plan",
    "retrieve",
)

workflow.add_edge(
    "retrieve",
    "answer",
)

workflow.add_edge(
    "answer",
    END,
)


# ============================================================
# 20. COMPILE
# ============================================================

graph = workflow.compile()

print(
    "\nLangGraph workflow compiled successfully."
)


# ============================================================
# 21. HELPER FUNCTION FOR RUNNING THE GRAPH
# ============================================================

def run_query(
    query: str,
):

    initial_state: AgentState = {
        "query": query,
        "plan": None,
        "context": [],
        "context_ids": [],
        "answer": None,
    }

    result = graph.invoke(
        initial_state
    )

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
        result["query"]
    )

    print(
        "\nQuery Plan:"
    )

    print(
        result["plan"]
    )

    print(
        "\nRetrieved Documents:"
    )

    for doc_id, context in zip(
        result["context_ids"],
        result["context"],
    ):

        print(
            f"\n[{doc_id}]"
        )

        print(
            context
        )

    print(
        "\nFinal Answer:"
    )

    print(
        result["answer"]
    )

    return result


# ============================================================
# 22. TEST 1
# ============================================================

result_1 = run_query(
    "What are the main applications of Graph Neural Networks?"
)


# ============================================================
# 23. TEST 2
# ============================================================

result_2 = run_query(
    "How are Graph Neural Networks used in fraud detection?"
)


# ============================================================
# 24. TEST 3
# ============================================================

result_3 = run_query(
    "How can Graph Neural Networks help with molecules?"
)


# ============================================================
# 25. OUTSIDE-CONTEXT TEST
# ============================================================

result_4 = run_query(
    "What is the history of the Roman Empire?"
)


# ============================================================
# 26. GRAPH VISUALIZATION
# ============================================================

print(
    "\n" + "=" * 70
)

print(
    "GRAPH VISUALIZATION"
)

print(
    "=" * 70
)


try:

    from IPython.display import Image, display

    png_bytes = (
        graph
        .get_graph()
        .draw_mermaid_png()
    )

    output_file = (
        "Query_Planning_Agentic_RAG_langgraph.png"
    )

    with open(
        output_file,
        "wb",
    ) as f:

        f.write(
            png_bytes
        )

    display(
        Image(
            data=png_bytes
        )
    )

    print(
        f"\nGraph saved to: {output_file}"
    )


except Exception as exc:

    print(
        "Mermaid PNG rendering failed."
    )

    print(
        "Reason:",
        exc
    )

    print(
        "\nWorkflow:"
    )

    print(
        "START → PLAN → RETRIEVE → ANSWER → END"
    )


# ============================================================
# 27. FINAL SUMMARY
# ============================================================

print(
    "\n" + "=" * 70
)

print(
    "QUERY PLANNING AGENTIC RAG COMPLETE"
)

print(
    "=" * 70
)

print(
    """
Workflow:

User Query
    ↓
Planning Agent
    ↓
Chroma Retrieval
    ↓
Retrieved Context
    ↓
Gemini Answer Generation
    ↓
Final Answer

Components:

✓ LangGraph
✓ Gemini Flash-Lite
✓ Hugging Face embeddings
✓ Chroma vector store
✓ Query planning
✓ Retrieval
✓ Answer generation
✓ Outside-context test
✓ Graph visualization
"""
)