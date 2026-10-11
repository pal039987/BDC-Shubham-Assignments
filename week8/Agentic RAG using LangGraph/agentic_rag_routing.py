# ============================================================
# AGENTIC RAG WITH QUERY ROUTING
# Local Vector Search + Optional Web Search + Direct Answer
# LangGraph + FAISS + Gemini
# Complete Notebook - Single Cell
# ============================================================


# ============================================================
# 1. INSTALL REQUIRED LIBRARIES
# ============================================================

# !pip install -q -U \
#     langgraph \
#     langchain \
#     langchain-core \
#     langchain-community \
#     langchain-google-genai \
#     langchain-text-splitters \
#     faiss-cpu \
#     pypdf \
#     python-dotenv \
#     tavily-python \
#     graphviz


# ============================================================
# 2. IMPORTS
# ============================================================

import os
import json
import re

from pathlib import Path
from typing import (
    TypedDict,
    List,
    Literal,
    Optional,
    Dict,
    Any,
)

from dotenv import load_dotenv

from langgraph.graph import (
    StateGraph,
    START,
    END,
)

from langgraph.checkpoint.memory import MemorySaver

from langchain_google_genai import (
    ChatGoogleGenerativeAI,
    GoogleGenerativeAIEmbeddings,
)

from langchain_text_splitters import (
    RecursiveCharacterTextSplitter,
)

from langchain_community.vectorstores import FAISS

from langchain_community.document_loaders import (
    PyPDFLoader,
    TextLoader,
)

from langchain_core.documents import Document


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
# 4. GET GOOGLE API KEY
# ============================================================

GOOGLE_API_KEY = os.getenv(
    "GOOGLE_API_KEY"
)

if not GOOGLE_API_KEY:

    raise ValueError(
        "GOOGLE_API_KEY not found in .env file."
    )

print(
    "GOOGLE_API_KEY loaded successfully."
)


# ============================================================
# 5. OPTIONAL TAVILY KEY
# ============================================================

TAVILY_API_KEY = os.getenv(
    "TAVILY_API_KEY"
)

if TAVILY_API_KEY:

    print(
        "TAVILY_API_KEY found. Web search enabled."
    )

else:

    print(
        "TAVILY_API_KEY not found. "
        "Web route will use a safe fallback."
    )


# ============================================================
# 6. CONFIGURATION
# ============================================================

GEMINI_MODEL = (
    "gemini-flash-lite-latest"
)

EMBEDDING_MODEL = (
    "gemini-embedding-001"
)

TOP_K = 4


# ============================================================
# 7. INITIALIZE GEMINI
# ============================================================

llm = ChatGoogleGenerativeAI(
    model=GEMINI_MODEL,
    temperature=0.2,
    google_api_key=GOOGLE_API_KEY,
    max_retries=2,
)

print(
    f"Gemini initialized: {GEMINI_MODEL}"
)


# ============================================================
# 8. INITIALIZE GEMINI EMBEDDINGS
# ============================================================

embeddings = GoogleGenerativeAIEmbeddings(
    model=EMBEDDING_MODEL,
    google_api_key=GOOGLE_API_KEY,
)

print(
    f"Embedding model initialized: {EMBEDDING_MODEL}"
)


# ============================================================
# 9. DATA DIRECTORY
# ============================================================

DATA_DIR = CURRENT_DIR / "data"

DATA_DIR.mkdir(
    exist_ok=True
)


# ============================================================
# 10. CREATE DEMO DOCUMENT IF DATA IS EMPTY
# ============================================================

supported_files = []

for pattern in [
    "*.pdf",
    "*.txt",
    "*.md",
]:

    supported_files.extend(
        DATA_DIR.glob(pattern)
    )


if not supported_files:

    demo_file = (
        DATA_DIR / "sample_docs.txt"
    )

    demo_content = """
Generative AI is a branch of artificial intelligence
that can create new content such as text, images,
audio, video, and software code.

Retrieval Augmented Generation, commonly called RAG,
combines information retrieval with language model
generation. A RAG system retrieves relevant documents
before asking the language model to generate an answer.

FAISS is a library for efficient similarity search
over dense numerical vectors. It is frequently used
in semantic search and RAG applications.

LangGraph is a framework for building stateful,
multi-step and agentic workflows.

FastAPI is a Python framework for building APIs
using Python. It provides automatic API documentation
and request validation.

Vector embeddings represent text as numerical vectors.
Texts with similar meanings can have similar vector
representations, which makes semantic search possible.
""".strip()

    demo_file.write_text(
        demo_content,
        encoding="utf-8",
    )

    print(
        f"Created demo document: {demo_file}"
    )


# ============================================================
# 11. LOAD PDF / TXT / MARKDOWN DOCUMENTS
# ============================================================

docs: List[Document] = []

for file_path in DATA_DIR.rglob("*"):

    if not file_path.is_file():
        continue

    suffix = (
        file_path.suffix.lower()
    )

    try:

        if suffix == ".pdf":

            print(
                f"Loading PDF: {file_path.name}"
            )

            docs.extend(
                PyPDFLoader(
                    str(file_path)
                ).load()
            )

        elif suffix in [
            ".txt",
            ".md",
        ]:

            print(
                f"Loading text file: {file_path.name}"
            )

            docs.extend(
                TextLoader(
                    str(file_path),
                    encoding="utf-8",
                ).load()
            )

    except Exception as exc:

        print(
            f"Could not load {file_path.name}: {exc}"
        )


if not docs:

    raise RuntimeError(
        "No readable documents found in data/."
    )


print(
    f"\nLoaded {len(docs)} document page(s)."
)


# ============================================================
# 12. SPLIT DOCUMENTS INTO CHUNKS
# ============================================================

splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,
    chunk_overlap=200,
)

chunks = splitter.split_documents(
    docs
)

if not chunks:

    raise RuntimeError(
        "Document chunking produced no chunks."
    )


print(
    f"Created {len(chunks)} document chunks."
)


# ============================================================
# 13. CREATE FAISS VECTOR STORE
# ============================================================

print(
    "\nCreating FAISS vector store..."
)

vectordb = FAISS.from_documents(
    documents=chunks,
    embedding=embeddings,
)

print(
    "FAISS vector store ready."
)


# ============================================================
# 14. CREATE RETRIEVER
# ============================================================

retriever = vectordb.as_retriever(
    search_type="similarity",
    search_kwargs={
        "k": TOP_K
    },
)

print(
    f"Retriever ready. Top-k = {TOP_K}"
)


# ============================================================
# 15. AGENT STATE
# ============================================================

class AgentState(TypedDict):

    question: str

    plan: str

    route: Literal[
        "vector",
        "web",
        "direct",
    ]

    context: List[
        Dict[str, Any]
    ]

    web_results: List[
        Dict[str, Any]
    ]

    answer: str

    citations: List[str]

    error: Optional[str]

    history: List[
        Dict[str, str]
    ]


# ============================================================
# 16. ROUTER SYSTEM PROMPT
# ============================================================

ROUTER_SYSTEM_PROMPT = """
You are the routing controller for an Agentic RAG system.

Choose exactly ONE route:

"vector"
- Use this when the answer is likely available
  in the local uploaded documents.

"web"
- Use this when the question requires current,
  external, or internet information.

"direct"
- Use this for casual conversation or simple questions
  that do not require document retrieval or web search.

Return ONLY valid JSON:

{
  "route": "vector",
  "rationale": "short reason",
  "steps": [
    "step 1",
    "step 2"
  ]
}
"""


# ============================================================
# 17. ROUTE PARSER
# ============================================================

def parse_router_output(
    text: str,
) -> Dict[str, Any]:
    """
    Safely parse the router's JSON response.
    """

    allowed_routes = {
        "vector",
        "web",
        "direct",
    }

    if not text:

        return {
            "route": "vector",
            "rationale": "Empty router response.",
            "steps": [],
        }


    # --------------------------------------------------------
    # Direct JSON
    # --------------------------------------------------------

    try:

        parsed = json.loads(
            text
        )

        if (
            parsed.get("route")
            in allowed_routes
        ):

            return parsed

    except Exception:
        pass


    # --------------------------------------------------------
    # Remove Markdown code fences
    # --------------------------------------------------------

    cleaned = re.sub(
        r"```(?:json)?",
        "",
        text,
        flags=re.IGNORECASE,
    )

    cleaned = cleaned.replace(
        "```",
        ""
    ).strip()


    # --------------------------------------------------------
    # Try cleaned JSON
    # --------------------------------------------------------

    try:

        parsed = json.loads(
            cleaned
        )

        if (
            parsed.get("route")
            in allowed_routes
        ):

            return parsed

    except Exception:
        pass


    # --------------------------------------------------------
    # Find JSON object inside text
    # --------------------------------------------------------

    start = cleaned.find(
        "{"
    )

    end = cleaned.rfind(
        "}"
    )

    if (
        start != -1
        and end > start
    ):

        try:

            parsed = json.loads(
                cleaned[
                    start:end + 1
                ]
            )

            if (
                parsed.get("route")
                in allowed_routes
            ):

                return parsed

        except Exception:
            pass


    # --------------------------------------------------------
    # Safe fallback
    # --------------------------------------------------------

    return {
        "route": "vector",
        "rationale": (
            "Router output could not be parsed; "
            "falling back to local knowledge."
        ),
        "steps": [],
    }


# ============================================================
# 18. ROUTE QUESTION
# ============================================================

def route_question(
    question: str,
) -> Dict[str, Any]:
    """
    Ask Gemini to decide which route to use.
    """

    response = llm.invoke(
        [
            (
                "system",
                ROUTER_SYSTEM_PROMPT,
            ),
            (
                "human",
                f"Question: {question}",
            ),
        ]
    )

    return parse_router_output(
        str(
            response.content
        )
    )


# ============================================================
# 19. NODE 1 - PLAN / ROUTER
# ============================================================

def plan_node(
    state: AgentState,
):

    print(
        "\n[PLAN NODE]"
    )

    print(
        "Question:",
        state["question"]
    )

    route_data = route_question(
        state["question"]
    )

    route = route_data.get(
        "route",
        "vector",
    )

    if route not in {
        "vector",
        "web",
        "direct",
    }:

        route = "vector"


    rationale = str(
        route_data.get(
            "rationale",
            "",
        )
    )

    steps = route_data.get(
        "steps",
        [],
    )

    if not isinstance(
        steps,
        list,
    ):

        steps = []


    plan = rationale

    if steps:

        plan += (
            "\nPlanned steps:\n"
            + "\n".join(
                f"- {step}"
                for step in steps
            )
        )


    print(
        "Selected route:",
        route
    )

    print(
        "Rationale:",
        rationale
    )


    return {
        **state,
        "plan": plan,
        "route": route,
    }


# ============================================================
# 20. NODE 2 - LOCAL VECTOR RETRIEVAL
# ============================================================

def retrieve_node(
    state: AgentState,
):

    print(
        "\n[RETRIEVE NODE]"
    )

    try:

        documents = retriever.invoke(
            state["question"]
        )

        context = []

        citations = []

        for document in documents:

            source = document.metadata.get(
                "source",
                "local-document",
            )

            page = document.metadata.get(
                "page"
            )

            if page is not None:

                source = (
                    f"{source} "
                    f"(page {int(page) + 1})"
                )


            context.append(
                {
                    "text": document.page_content,
                    "source": source,
                }
            )

            citations.append(
                source
            )


        print(
            f"Retrieved {len(context)} local chunks."
        )


        return {
            **state,
            "context": context,
            "citations": citations,
        }


    except Exception as exc:

        print(
            "Retrieval error:",
            exc
        )

        return {
            **state,
            "context": [],
            "citations": [],
            "error": str(exc),
        }


# ============================================================
# 21. NODE 3 - OPTIONAL WEB SEARCH
# ============================================================

def web_node(
    state: AgentState,
):

    print(
        "\n[WEB NODE]"
    )


    if not TAVILY_API_KEY:

        print(
            "Tavily is not configured."
        )

        return {
            **state,
            "web_results": [],
            "error": (
                "Web search is disabled because "
                "TAVILY_API_KEY is not configured."
            ),
        }


    try:

        from tavily import TavilyClient

        tavily_client = TavilyClient(
            api_key=TAVILY_API_KEY
        )

        result = tavily_client.search(
            query=state["question"],
            max_results=3,
        )

        results = result.get(
            "results",
            [],
        )

        cleaned_results = []

        citations = list(
            state.get(
                "citations",
                []
            )
        )


        for item in results:

            title = item.get(
                "title",
                "",
            )

            content = item.get(
                "content",
                item.get(
                    "snippet",
                    "",
                ),
            )

            url = item.get(
                "url",
                "",
            )

            cleaned_results.append(
                {
                    "title": title,
                    "content": content,
                    "url": url,
                }
            )

            if url:
                citations.append(
                    url
                )


        print(
            f"Retrieved {len(cleaned_results)} web result(s)."
        )


        return {
            **state,
            "web_results": cleaned_results,
            "citations": citations,
        }


    except Exception as exc:

        print(
            "Web search error:",
            exc
        )

        return {
            **state,
            "web_results": [],
            "error": str(exc),
        }


# ============================================================
# 22. HELPER - GEMINI RESPONSE TO TEXT
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
# 23. NODE 4 - ANSWER GENERATION
# ============================================================

def answer_node(
    state: AgentState,
):

    print(
        "\n[ANSWER NODE]"
    )


    # --------------------------------------------------------
    # Local context
    # --------------------------------------------------------

    local_context = "\n\n".join(
        (
            f"Local Source: {item['source']}\n"
            f"{item['text']}"
        )
        for item in state.get(
            "context",
            []
        )
    )


    if not local_context:

        local_context = (
            "No local context available."
        )


    # --------------------------------------------------------
    # Web context
    # --------------------------------------------------------

    web_context_parts = []

    for item in state.get(
        "web_results",
        []
    ):

        web_context_parts.append(
            (
                f"Web Title: {item.get('title', '')}\n"
                f"Web URL: {item.get('url', '')}\n"
                f"Web Content: {item.get('content', '')}"
            )
        )


    web_context = "\n\n".join(
        web_context_parts
    )


    if not web_context:

        web_context = (
            "No web context available."
        )


    # --------------------------------------------------------
    # Prompt
    # --------------------------------------------------------

    prompt = f"""
You are a careful Agentic RAG assistant.

Answer the user's question accurately.

Important rules:
1. Prefer the provided local context when route is "vector".
2. Use web information when route is "web".
3. For route "direct", answer normally.
4. Never invent facts.
5. Clearly say when sufficient information is unavailable.
6. Cite local sources using [source].
7. For web results, cite URLs when useful.
8. Keep the answer concise.

Selected route:
{state["route"]}

Planning rationale:
{state["plan"]}

Local context:
{local_context}

Web context:
{web_context}

Question:
{state["question"]}

Answer:
"""


    # --------------------------------------------------------
    # Gemini generation
    # --------------------------------------------------------

    try:

        response = llm.invoke(
            prompt
        )

        answer = response_to_text(
            response.content
        )


    except Exception as exc:

        print(
            "Answer generation error:",
            exc
        )

        answer = (
            "Unable to generate an answer "
            "because the LLM request failed."
        )


    print(
        "Answer generated."
    )


    # --------------------------------------------------------
    # Update history
    # --------------------------------------------------------

    history = list(
        state.get(
            "history",
            []
        )
    )

    history.append(
        {
            "question": state["question"],
            "answer": answer,
        }
    )


    return {
        **state,
        "answer": answer,
        "history": history,
    }


# ============================================================
# 24. ROUTE DECIDER
# ============================================================

def route_decider(
    state: AgentState,
):

    route = state["route"]

    if route == "vector":

        return "retrieve"

    if route == "web":

        return "web"

    return "answer"


# ============================================================
# 25. BUILD LANGGRAPH WORKFLOW
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
    "web",
    web_node,
)

workflow.add_node(
    "answer",
    answer_node,
)


# ============================================================
# 26. DEFINE EDGES
# ============================================================

workflow.add_edge(
    START,
    "plan",
)

workflow.add_conditional_edges(
    "plan",
    route_decider,
    {
        "retrieve": "retrieve",
        "web": "web",
        "answer": "answer",
    },
)

workflow.add_edge(
    "retrieve",
    "answer",
)

workflow.add_edge(
    "web",
    "answer",
)

workflow.add_edge(
    "answer",
    END,
)


# ============================================================
# 27. COMPILE WITH MEMORY
# ============================================================

memory = MemorySaver()

graph = workflow.compile(
    checkpointer=memory
)

print(
    "\n✅ Agentic RAG graph ready."
)


# ============================================================
# 28. INITIAL STATE HELPER
# ============================================================

def create_initial_state(
    question: str,
) -> AgentState:

    return {
        "question": question,
        "plan": "",
        "route": "vector",
        "context": [],
        "web_results": [],
        "answer": "",
        "citations": [],
        "error": None,
        "history": [],
    }


# ============================================================
# 29. RUN QUERY FUNCTION
# ============================================================

def run_agentic_rag(
    question: str,
    thread_id: str = "demo-session",
):

    print(
        "\n" + "=" * 70
    )

    print(
        "RUNNING AGENTIC RAG"
    )

    print(
        "=" * 70
    )

    print(
        "Question:",
        question
    )


    initial_state = (
        create_initial_state(
            question
        )
    )


    result = graph.invoke(
        initial_state,
        config={
            "configurable": {
                "thread_id": thread_id
            }
        },
    )


    print(
        "\n" + "-" * 70
    )

    print(
        "ROUTE:"
    )

    print(
        result["route"]
    )


    print(
        "\nPLAN:"
    )

    print(
        result["plan"]
    )


    print(
        "\nANSWER:"
    )

    print(
        result["answer"]
    )


    print(
        "\nCITATIONS:"
    )

    for citation in result.get(
        "citations",
        []
    ):

        print(
            "-",
            citation
        )


    if result.get(
        "error"
    ):

        print(
            "\nWARNING:"
        )

        print(
            result["error"]
        )


    return result


# ============================================================
# 30. TEST 1 - LOCAL VECTOR ROUTE
# ============================================================

result_1 = run_agentic_rag(
    "What is Retrieval Augmented Generation?",
    thread_id="test-1",
)


# ============================================================
# 31. TEST 2 - LOCAL VECTOR ROUTE
# ============================================================

result_2 = run_agentic_rag(
    "What is FAISS used for?",
    thread_id="test-2",
)


# ============================================================
# 32. TEST 3 - DIRECT / SIMPLE QUERY
# ============================================================

result_3 = run_agentic_rag(
    "Hello, can you help me?",
    thread_id="test-3",
)


# ============================================================
# 33. TEST 4 - EXTERNAL/CURRENT QUERY
# ============================================================

result_4 = run_agentic_rag(
    "What are the latest developments in generative AI?",
    thread_id="test-4",
)


# ============================================================
# 34. TEST 5 - FILE SUMMARY
# ============================================================

result_5 = run_agentic_rag(
    "Summarize the main information in the uploaded files.",
    thread_id="test-5",
)


# ============================================================
# 35. DISPLAY GRAPH AS MERMAID
# ============================================================

print(
    "\n" + "=" * 70
)

print(
    "LANGGRAPH MERMAID GRAPH"
)

print(
    "=" * 70
)

mermaid_graph = (
    graph
    .get_graph()
    .draw_mermaid()
)

print(
    mermaid_graph
)


# ============================================================
# 36. CREATE GRAPH IMAGE WITH GRAPHVIZ
# ============================================================

try:

    from graphviz import Digraph

    dot = Digraph(
        name="Agentic_RAG_Workflow",
        format="png",
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
        "plan",
        "Plan / Router",
        shape="box",
    )

    dot.node(
        "retrieve",
        "Local FAISS\nRetrieval",
        shape="box",
    )

    dot.node(
        "web",
        "Tavily\nWeb Search",
        shape="box",
    )

    dot.node(
        "answer",
        "Gemini\nAnswer",
        shape="box",
    )

    dot.node(
        "END",
        "END",
        shape="doublecircle",
    )


    dot.edge(
        "START",
        "plan",
    )

    dot.edge(
        "plan",
        "retrieve",
        label="vector",
    )

    dot.edge(
        "plan",
        "web",
        label="web",
    )

    dot.edge(
        "plan",
        "answer",
        label="direct",
    )

    dot.edge(
        "retrieve",
        "answer",
    )

    dot.edge(
        "web",
        "answer",
    )

    dot.edge(
        "answer",
        "END",
    )


    graph_file = (
        "workflow_graph"
    )

    dot.render(
        graph_file,
        view=False,
    )

    print(
        f"\n✅ Graph saved as: "
        f"{graph_file}.png"
    )


    try:

        from IPython.display import (
            Image,
            display,
        )

        display(
            Image(
                filename=f"{graph_file}.png"
            )
        )

    except Exception:

        pass


except Exception as exc:

    print(
        "\nGraphviz image generation "
        "was not available:"
    )

    print(
        exc
    )


# ============================================================
# 37. FINAL SUMMARY
# ============================================================

print(
    "\n" + "=" * 70
)

print(
    "AGENTIC RAG WORKFLOW COMPLETE"
)

print(
    "=" * 70
)

print(
    """
Architecture:

                    START
                      |
                      v
                PLAN / ROUTER
                /      |      \\
               /       |       \\
          VECTOR       WEB     DIRECT
            |           |         |
            v           v         |
       FAISS Search  Tavily       |
            |           |         |
            +-----+-----+---------+
                  |
                  v
             GEMINI ANSWER
                  |
                  v
                 END


Completed:
✓ Local document loading
✓ PDF/TXT/Markdown support
✓ Document chunking
✓ Gemini embeddings
✓ FAISS retrieval
✓ Query routing
✓ Optional Tavily web search
✓ Direct Gemini route
✓ LangGraph conditional routing
✓ MemorySaver checkpointer
✓ Multiple test queries
✓ Citations
✓ Graph visualization
"""
)