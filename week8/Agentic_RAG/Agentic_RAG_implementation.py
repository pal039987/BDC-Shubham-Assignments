# !pip install -q -U langchain langchain-classic langchain-google-genai langchain-chroma langchain-community chromadb langchain-text-splitters python-dotenv

import os
from dotenv import load_dotenv

from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from langchain_classic.chains import RetrievalQA
from langchain_chroma import Chroma
from langchain_community.document_loaders import TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_classic.agents import initialize_agent, AgentType
from langchain_core.tools import Tool

# ---------------------------------------------------------
# Step 1: Load API key from .env
# ---------------------------------------------------------
load_dotenv()

api_key = os.getenv("GOOGLE_API_KEY")
if not api_key:
    raise ValueError("GOOGLE_API_KEY not found in .env file.")

os.environ["GOOGLE_API_KEY"] = api_key


# ---------------------------------------------------------
# Step 2: Set up Gemini LLM
# ---------------------------------------------------------
llm = ChatGoogleGenerativeAI(
    model="gemini-flash-lite-latest",
    temperature=0.3,
)


# ---------------------------------------------------------
# Step 3: Load and chunk document
# ---------------------------------------------------------
file_path = "rag_sample.txt"

if not os.path.exists(file_path):
    raise FileNotFoundError(
        f"'{file_path}' not found. Please place rag_sample.txt in the notebook's working directory."
    )

loader = TextLoader(
    file_path,
    encoding="utf-8"
)

docs = loader.load()

splitter = RecursiveCharacterTextSplitter(
    chunk_size=300,
    chunk_overlap=50
)

chunks = splitter.split_documents(docs)


# ---------------------------------------------------------
# Step 4: Create vector store using Gemini embeddings
# ---------------------------------------------------------
embeddings = GoogleGenerativeAIEmbeddings(
    model="gemini-embedding-001"
)

vectorstore = Chroma.from_documents(
    documents=chunks,
    embedding=embeddings,
    collection_name="rag_agent_collection"
)

retriever = vectorstore.as_retriever(
    search_kwargs={"k": 3}
)


# ---------------------------------------------------------
# Step 5: Create RAG pipeline
# ---------------------------------------------------------
qa_chain = RetrievalQA.from_chain_type(
    llm=llm,
    chain_type="stuff",
    retriever=retriever,
    return_source_documents=True
)


# ---------------------------------------------------------
# Step 6: Create RAG tool
# ---------------------------------------------------------
def rag_tool_func(query: str) -> str:
    result = qa_chain.invoke({"query": query})
    return result["result"]


rag_tool = Tool(
    name="RAG_Tool",
    func=rag_tool_func,
    description=(
        "Use this tool to answer questions based on the content "
        "of the provided document."
    )
)


# ---------------------------------------------------------
# Step 7: Create agent
# ---------------------------------------------------------
agent_executor = initialize_agent(
    tools=[rag_tool],
    llm=llm,
    agent=AgentType.ZERO_SHOT_REACT_DESCRIPTION,
    verbose=True,
    handle_parsing_errors=True
)


# ---------------------------------------------------------
# Step 8: Ask question
# ---------------------------------------------------------
query = "What is the main topic of the document?"

response = agent_executor.invoke({
    "input": query
})

print("\nAgent Response:\n")
print(response["output"])