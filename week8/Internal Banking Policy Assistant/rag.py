# ============================================================
# create_vectorstore.py
# Create FAISS Vector Store for Banking Policy Documents
# ============================================================

import os
import shutil
from pathlib import Path

from dotenv import load_dotenv

from langchain_community.document_loaders import (
    PyPDFLoader,
    TextLoader,
    CSVLoader,
)

from langchain_text_splitters import (
    RecursiveCharacterTextSplitter,
)

from langchain_google_genai import (
    GoogleGenerativeAIEmbeddings,
)

from langchain_community.vectorstores import FAISS


# ============================================================
# 1. LOAD .ENV
# ============================================================

CURRENT_DIR = Path(__file__).resolve().parent

ENV_CANDIDATES = [
    CURRENT_DIR / ".env",
    CURRENT_DIR.parent / ".env",
    CURRENT_DIR.parent.parent / ".env",
]

for env_path in ENV_CANDIDATES:

    if env_path.exists():
        load_dotenv(env_path)
        print(
            f".env loaded from: {env_path}"
        )
        break

else:

    load_dotenv()
    print(
        ".env loaded using default lookup."
    )


# ============================================================
# 2. GET GOOGLE API KEY
# ============================================================

GOOGLE_API_KEY = os.getenv(
    "GOOGLE_API_KEY"
)

if not GOOGLE_API_KEY:

    raise RuntimeError(
        "GOOGLE_API_KEY not found in .env file."
    )

print(
    "Google API key loaded successfully."
)


# ============================================================
# 3. DOCUMENT PATHS
# ============================================================

PDF_PATH = "bank_policies.pdf"
TXT_PATH = "bank_policies.txt"
CSV_PATH = "bank_policies.csv"

# IMPORTANT:
# This must match the folder loaded by app.py.
VECTORSTORE_PATH = "embedding_store"


# ============================================================
# 4. LOAD DOCUMENTS
# ============================================================

def load_documents():

    if os.path.exists(PDF_PATH):

        print(
            f"Loading PDF: {PDF_PATH}"
        )

        loader = PyPDFLoader(
            PDF_PATH
        )

    elif os.path.exists(TXT_PATH):

        print(
            f"Loading TXT: {TXT_PATH}"
        )

        loader = TextLoader(
            TXT_PATH,
            encoding="utf-8",
        )

    elif os.path.exists(CSV_PATH):

        print(
            f"Loading CSV: {CSV_PATH}"
        )

        loader = CSVLoader(
            CSV_PATH
        )

    else:

        raise FileNotFoundError(
            "No policy document found.\n"
            "Expected one of:\n"
            f"- {PDF_PATH}\n"
            f"- {TXT_PATH}\n"
            f"- {CSV_PATH}"
        )

    documents = loader.load()

    if not documents:

        raise ValueError(
            "The selected document contains no data."
        )

    print(
        f"Loaded {len(documents)} document(s)."
    )

    return documents


# ============================================================
# 5. SPLIT DOCUMENTS INTO CHUNKS
# ============================================================

def chunk_documents(
    documents,
):

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=500,
        chunk_overlap=100,
    )

    chunks = splitter.split_documents(
        documents
    )

    if not chunks:

        raise ValueError(
            "No chunks were created from the documents."
        )

    print(
        f"Created {len(chunks)} document chunks."
    )

    return chunks


# ============================================================
# 6. CREATE GEMINI EMBEDDINGS
# ============================================================

def create_embeddings():

    print(
        "Initializing Gemini embedding model..."
    )

    embedding_model = GoogleGenerativeAIEmbeddings(
        model="gemini-embedding-001",
        google_api_key=GOOGLE_API_KEY,
    )

    print(
        "Gemini embedding model initialized."
    )

    return embedding_model


# ============================================================
# 7. CREATE AND SAVE FAISS VECTOR STORE
# ============================================================

def embed_chunks(
    chunks,
):

    embedding_model = create_embeddings()

    print(
        "Generating embeddings and creating FAISS index..."
    )

    vectorstore = FAISS.from_documents(
        chunks,
        embedding_model,
    )

    # Remove old store only for this project
    if os.path.exists(
        VECTORSTORE_PATH
    ):

        print(
            f"Removing old vector store: "
            f"{VECTORSTORE_PATH}"
        )

        shutil.rmtree(
            VECTORSTORE_PATH
        )

    vectorstore.save_local(
        VECTORSTORE_PATH
    )

    print(
        f"Vectorstore saved at ./{VECTORSTORE_PATH}"
    )


# ============================================================
# 8. MAIN
# ============================================================

def main():

    print(
        "\n" + "=" * 60
    )

    print(
        "BANKING POLICY VECTOR STORE CREATION"
    )

    print(
        "=" * 60
    )

    print(
        "\nStep 1: Loading documents..."
    )

    documents = load_documents()

    print(
        "\nStep 2: Splitting documents..."
    )

    chunks = chunk_documents(
        documents
    )

    print(
        "\nStep 3: Generating embeddings..."
    )

    embed_chunks(
        chunks
    )

    print(
        "\n" + "=" * 60
    )

    print(
        "VECTOR STORE CREATION COMPLETED"
    )

    print(
        "=" * 60
    )

    print(
        f"\nFAISS store: ./{VECTORSTORE_PATH}"
    )


# ============================================================
# 9. RUN
# ============================================================

if __name__ == "__main__":
    main()