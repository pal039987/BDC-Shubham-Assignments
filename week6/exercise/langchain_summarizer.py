import os
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_community.document_loaders import PyPDFLoader, TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_classic.chains.summarize import load_summarize_chain

# --------------------------------------------------
# Task 1.1: API Configuration and LLM Initialization
# --------------------------------------------------
load_dotenv()
os.environ["GOOGLE_API_KEY"] = os.getenv("GOOGLE_API_KEY")

# gemini-pro is retired; use a current model
llm = ChatGoogleGenerativeAI(model="gemini-3.8-flash", temperature=0.7)

print("LangChain LLM initialized with Gemini 3.8 Flash!")

# --------------------------------------------------
# Task 1.2: Document Loading and Splitting
# --------------------------------------------------
# Replace with your actual file path
file_path = "sample_document.pdf"  # Make sure this file exists in your directory
loader = PyPDFLoader("/home/bdcadmin/BDC-Shubham/week6/exercise/Shubham_Pal_Resume_FrontendDeveloper.pdf")
# If using a .txt file instead:
# loader = TextLoader("sample_document.txt")

documents = loader.load()

text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,
    chunk_overlap=200,
    length_function=len,
    is_separator_regex=False,
)

chunks = text_splitter.split_documents(documents)

print(f"Original document loaded into {len(documents)} document(s).")
print(f"Document split into {len(chunks)} chunks.")
print(f"First chunk example (first 200 chars):\n{chunks[0].page_content[:200]}...")

# --------------------------------------------------
# Task 2.1: 'Stuff' Chain Summarization
# --------------------------------------------------
print("\n--- Running 'Stuff' Chain Summarization ---")
try:
    stuff_chain = load_summarize_chain(llm, chain_type="stuff")

    # If your document is long, 'stuff' may exceed the context window.
    # Uncomment the line below to summarize only the first few chunks:
    # summary_stuff = stuff_chain.invoke(chunks[:5])["output_text"]

    summary_stuff = stuff_chain.invoke(chunks)["output_text"]

    print("\n--- 'Stuff' Summary ---")
    print(summary_stuff)
except Exception as e:
    print(f"Error with 'Stuff' chain: {e}")
    print("This often means your document is too long for the model's context window.")
    print("Try reducing the number of chunks passed to the chain (e.g., chunks[:5]) or using a smaller document.")

# --------------------------------------------------
# Task 2.2: 'Map-Reduce' Chain Summarization
# --------------------------------------------------
print("\n--- Running 'Map-Reduce' Chain Summarization ---")
map_reduce_chain = load_summarize_chain(llm, chain_type="map_reduce")

try:
    summary_map_reduce = map_reduce_chain.invoke(chunks)["output_text"]
    print("\n--- 'Map-Reduce' Summary ---")
    print(summary_map_reduce)
except Exception as e:
    print(f"Error with 'Map-Reduce' chain: {e}")

# --------------------------------------------------
# Task 2.3: 'Refine' Chain Summarization
# --------------------------------------------------
print("\n--- Running 'Refine' Chain Summarization ---")
refine_chain = load_summarize_chain(llm, chain_type="refine")

try:
    summary_refine = refine_chain.invoke(chunks)["output_text"]
    print("\n--- 'Refine' Summary ---")
    print(summary_refine)
except Exception as e:
    print(f"Error with 'Refine' chain: {e}")