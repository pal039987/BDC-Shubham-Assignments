import os
from typing import TypedDict, List

from dotenv import load_dotenv

from langchain_core.documents import Document
from langchain_core.prompts import ChatPromptTemplate
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_community.document_loaders import PyPDFLoader
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_text_splitters import RecursiveCharacterTextSplitter

from langgraph.graph import StateGraph, START, END


# ============================================================
# 1. ENVIRONMENT
# ============================================================

load_dotenv()

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

if not GOOGLE_API_KEY:
    raise ValueError("GOOGLE_API_KEY not found in .env")


# ============================================================
# 2. MODELS
# ============================================================

llm = ChatGoogleGenerativeAI(
    model="gemini-flash-lite-latest",
    google_api_key=GOOGLE_API_KEY,
    temperature=0
)

embeddings = HuggingFaceEmbeddings(
    model_name="sentence-transformers/all-MiniLM-L6-v2"
)


# ============================================================
# 3. SAFE GEMINI TEXT EXTRACTION
# ============================================================

def get_text(response):

    content = getattr(response, "content", response)

    if isinstance(content, str):
        return content.strip()

    if isinstance(content, list):

        parts = []

        for item in content:

            if isinstance(item, str):
                parts.append(item)

            elif isinstance(item, dict):

                if "text" in item:
                    parts.append(str(item["text"]))

        return "\n".join(parts).strip()

    return str(content).strip()


# ============================================================
# 4. PDF FILES
# ============================================================

PDF_FILES = [
    "Health_Policy_Terms.pdf",
    "Auto_Claim_Manual.pdf",
    "Insurance_Regulations_2024.pdf",
]


# ============================================================
# 5. LOAD PDF DOCUMENTS
# ============================================================

def load_documents():

    all_documents = []

    for pdf_file in PDF_FILES:

        if not os.path.exists(pdf_file):
            print(f"Warning: {pdf_file} not found")
            continue

        loader = PyPDFLoader(pdf_file)

        docs = loader.load()

        for doc in docs:
            doc.metadata["source_file"] = pdf_file

        all_documents.extend(docs)

    if not all_documents:
        raise FileNotFoundError(
            "No PDF files found. Make sure all 3 PDFs are in the project folder."
        )

    return all_documents


# ============================================================
# 6. CREATE VECTOR STORE
# ============================================================

def create_vector_store():

    print("Loading PDF documents...")

    documents = load_documents()

    print(f"Loaded {len(documents)} PDF pages.")

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=150
    )

    chunks = splitter.split_documents(documents)

    print(f"Created {len(chunks)} document chunks.")

    vectorstore = FAISS.from_documents(
        chunks,
        embeddings
    )

    vectorstore.save_local("faiss_index")

    print("FAISS index created successfully.")

    return vectorstore


# ============================================================
# 7. LOAD / CREATE FAISS
# ============================================================

if os.path.exists("faiss_index/index.faiss"):

    print("Loading existing FAISS index...")

    vectorstore = FAISS.load_local(
        "faiss_index",
        embeddings,
        allow_dangerous_deserialization=True
    )

else:

    vectorstore = create_vector_store()


retriever = vectorstore.as_retriever(
    search_kwargs={"k": 5}
)


# ============================================================
# 8. LANGGRAPH STATE
# ============================================================

class AgentState(TypedDict, total=False):

    question: str
    category: str
    retrieved_docs: List[Document]
    interpreted_answer: str
    final_answer: str


# ============================================================
# 9. QUERY AGENT
# ============================================================

def query_agent(state: AgentState):

    question = state["question"]

    prompt = ChatPromptTemplate.from_template(
        """
You are the Query Agent for an insurance assistant.

Classify the user's question into exactly one category:

HEALTH
AUTO
REGULATION
GENERAL

User question:
{question}

Return ONLY one category name.
"""
    )

    chain = prompt | llm

    response = chain.invoke(
        {"question": question}
    )

    category = get_text(response).upper()

    if "HEALTH" in category:
        category = "HEALTH"

    elif "AUTO" in category:
        category = "AUTO"

    elif "REGULATION" in category:
        category = "REGULATION"

    else:
        category = "GENERAL"

    return {
        "category": category
    }


# ============================================================
# 10. DOCUMENT RETRIEVER AGENT
# ============================================================

def document_retriever(state: AgentState):

    question = state["question"]

    category = state["category"]

    search_query = f"{category} insurance policy {question}"

    docs = retriever.invoke(search_query)

    filtered_docs = []

    for doc in docs:

        source = doc.metadata.get(
            "source_file",
            ""
        ).lower()

        if category == "HEALTH" and "health" in source:
            filtered_docs.append(doc)

        elif category == "AUTO" and "auto" in source:
            filtered_docs.append(doc)

        elif category == "REGULATION" and "regulation" in source:
            filtered_docs.append(doc)

    if not filtered_docs:
        filtered_docs = docs

    return {
        "retrieved_docs": filtered_docs
    }


# ============================================================
# 11. POLICY INTERPRETER AGENT
# ============================================================

def policy_interpreter(state: AgentState):

    question = state["question"]

    docs = state.get(
        "retrieved_docs",
        []
    )

    if not docs:

        return {
            "interpreted_answer": (
                "No relevant information was found "
                "in the provided insurance documents."
            )
        }

    context_parts = []

    for i, doc in enumerate(docs, start=1):

        source = doc.metadata.get(
            "source_file",
            "Unknown document"
        )

        page = doc.metadata.get(
            "page",
            "Unknown"
        )

        context_parts.append(
            f"""
Document {i}
Source: {source}
Page: {page}

Content:
{doc.page_content}
"""
        )

    context = "\n".join(context_parts)

    prompt = ChatPromptTemplate.from_template(
        """
You are the Policy Interpreter Agent.

Interpret the insurance policy information using ONLY
the provided documents.

Do not use outside knowledge.

User question:
{question}

Retrieved policy information:
{context}

Determine:

1. What policy rule is relevant?
2. What conditions or limitations apply?
3. What important details should the final answer include?

If the documents do not provide enough information,
clearly say that the evidence is insufficient.

Provide a concise interpretation.
"""
    )

    chain = prompt | llm

    response = chain.invoke(
        {
            "question": question,
            "context": context
        }
    )

    return {
        "interpreted_answer": get_text(response)
    }


# ============================================================
# 12. FINAL RESPONDER AGENT
# ============================================================

def final_responder(state: AgentState):

    question = state["question"]

    interpretation = state.get(
        "interpreted_answer",
        ""
    )

    docs = state.get(
        "retrieved_docs",
        []
    )

    sources = []

    for doc in docs:

        source = doc.metadata.get(
            "source_file",
            "Unknown"
        )

        page = doc.metadata.get(
            "page",
            "Unknown"
        )

        source_text = f"{source}, page {page}"

        if source_text not in sources:
            sources.append(source_text)

    source_text = "\n".join(
        f"- {source}"
        for source in sources
    )

    prompt = ChatPromptTemplate.from_template(
        """
You are the Final Responder Agent for an insurance advisor assistant.

Answer the user's question using the policy interpretation.

Rules:

- Use only information supported by the provided policy documents.
- Do not invent policy details.
- Do not provide unsupported legal or financial advice.
- Be clear and professional.
- If evidence is insufficient, say so.
- Mention relevant source documents when useful.

User question:
{question}

Policy interpretation:
{interpretation}

Source documents:
{sources}

Final answer:
"""
    )

    chain = prompt | llm

    response = chain.invoke(
        {
            "question": question,
            "interpretation": interpretation,
            "sources": source_text
        }
    )

    return {
        "final_answer": get_text(response)
    }


# ============================================================
# 13. BUILD LANGGRAPH
# ============================================================

graph = StateGraph(AgentState)

graph.add_node(
    "query_agent",
    query_agent
)

graph.add_node(
    "document_retriever",
    document_retriever
)

graph.add_node(
    "policy_interpreter",
    policy_interpreter
)

graph.add_node(
    "final_responder",
    final_responder
)


# ============================================================
# 14. WORKFLOW
# ============================================================

graph.add_edge(
    START,
    "query_agent"
)

graph.add_edge(
    "query_agent",
    "document_retriever"
)

graph.add_edge(
    "document_retriever",
    "policy_interpreter"
)

graph.add_edge(
    "policy_interpreter",
    "final_responder"
)

graph.add_edge(
    "final_responder",
    END
)


agentic_rag = graph.compile()


# ============================================================
# 15. STREAMLIT FUNCTION
# ============================================================

def ask_question(question: str):

    result = agentic_rag.invoke(
        {
            "question": question
        }
    )

    return {
        "answer": result.get(
            "final_answer",
            "Unable to generate an answer."
        ),

        "category": result.get(
            "category",
            "GENERAL"
        ),

        "sources": [
            {
                "file": doc.metadata.get(
                    "source_file",
                    "Unknown"
                ),
                "page": doc.metadata.get(
                    "page",
                    "Unknown"
                )
            }

            for doc in result.get(
                "retrieved_docs",
                []
            )
        ]
    }