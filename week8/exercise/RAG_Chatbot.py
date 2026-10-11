"""
RAG-powered Chatbot: document indexing, retrieval and basic RAG pipeline.

Run:  python rag_chatbot.py
Pipeline: Wikipedia download -> clean -> chunk -> embed (MiniLM) -> FAISS -> retrieve -> flan-t5 answer
"""
import os
import re
import glob
import json

os.environ["TOKENIZERS_PARALLELISM"] = "false"

import numpy as np
import nltk
from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer
from nltk.tokenize import sent_tokenize
from pypdf import PdfReader
import wikipediaapi
import faiss
from sentence_transformers import SentenceTransformer
from dotenv import load_dotenv
from google import genai

# ----------------------------------------------------------------------
# Config
# ----------------------------------------------------------------------
DOCS_DIR = "data/docs"
INDEX_DIR = "index"
INDEX_PATH = os.path.join(INDEX_DIR, "faiss.index")
CHUNKS_PATH = os.path.join(INDEX_DIR, "chunks.json")

EMBEDDING_MODEL = "all-MiniLM-L6-v2"
LLM_MODEL = "gemini-flash-lite-latest"

CHUNK_MAX_WORDS = 100       # sentence-based chunk size
CHUNK_OVERLAP_SENTENCES = 1
TOP_K = 3

TOPICS = [
    "Artificial intelligence", "Machine learning", "Deep learning", "Artificial neural network",
    "Natural language processing", "Computer vision", "Reinforcement learning",
    "Supervised learning", "Unsupervised learning", "Convolutional neural network",
    "Recurrent neural network", "Transformer (deep learning architecture)",
    "Large language model", "Generative artificial intelligence",
    "Generative adversarial network", "Backpropagation", "Gradient descent",
    "Support vector machine", "Decision tree learning", "Random forest",
    "K-means clustering", "Principal component analysis", "Linear regression",
    "Logistic regression", "Naive Bayes classifier", "K-nearest neighbors algorithm",
    "Overfitting", "Cross-validation (statistics)", "Feature engineering",
    "Transfer learning", "Word embedding", "Word2vec", "BERT (language model)",
    "GPT-3", "ChatGPT", "Speech recognition", "Machine translation",
    "Sentiment analysis", "Chatbot", "Expert system",
    "Knowledge representation and reasoning", "Robotics", "Self-driving car",
    "AI alignment", "Ethics of artificial intelligence", "Artificial general intelligence",
    "Turing test", "History of artificial intelligence", "AI winter", "Data mining",
    "Big data", "Recommender system", "Anomaly detection", "Autoencoder",
    "Attention (machine learning)", "Long short-term memory",
    "Retrieval-augmented generation", "Vector database",
]

SAMPLE_QUERIES = [
    "What is the difference between supervised and unsupervised learning?",
    "How does backpropagation train a neural network?",
    "What is the Turing test?",
    "Why did AI winters happen?",
    "How do transformers use attention?",
]

DEMO_QUERIES = [
    "What is the Turing test?",
    "What is the difference between supervised and unsupervised learning?",
    "What is retrieval-augmented generation?",
    "Who won the FIFA World Cup in 2018?",   # out of scope on purpose
]


# ----------------------------------------------------------------------
# Part 1: Dataset acquisition
# ----------------------------------------------------------------------
def download_dataset():
    """Download Wikipedia articles as .txt files (skipped if already downloaded)."""
    os.makedirs(DOCS_DIR, exist_ok=True)
    if len(glob.glob(os.path.join(DOCS_DIR, "*.txt"))) >= 50:
        print("Dataset already present, skipping download.")
        return

    wiki = wikipediaapi.Wikipedia(
        user_agent="RAGAssignment/1.0 (student project)", language="en"
    )
    saved, skipped = 0, []
    for title in TOPICS:
        page = wiki.page(title)
        if not page.exists():
            skipped.append(title)
            continue
        name = re.sub(r"[^A-Za-z0-9]+", "_", title).strip("_")
        with open(os.path.join(DOCS_DIR, f"{name}.txt"), "w", encoding="utf-8") as f:
            f.write(page.text)
        saved += 1
    print(f"Downloaded {saved} articles. Skipped: {skipped}")


# ----------------------------------------------------------------------
# Part 2: Loading, preprocessing, chunking
# ----------------------------------------------------------------------
def load_document(path):
    ext = os.path.splitext(path)[1].lower()
    if ext in (".txt", ".md"):
        with open(path, "r", encoding="utf-8") as f:
            return f.read()
    if ext == ".pdf":
        reader = PdfReader(path)
        return "\n".join(page.extract_text() or "" for page in reader.pages)
    return ""


def load_corpus():
    documents = []
    for path in sorted(glob.glob(os.path.join(DOCS_DIR, "*"))):
        text = load_document(path)
        if text.strip():
            documents.append({"source": os.path.basename(path), "text": text})
    total_words = sum(len(d["text"].split()) for d in documents)
    print(f"Documents loaded: {len(documents)} | Total words: {total_words}")
    print("Requirement met (>=50 docs, >=10,000 words):",
          len(documents) >= 50 and total_words >= 10000)
    return documents


def clean_text(text):
    """Light cleaning (used in the pipeline): keeps case, punctuation, stop words."""
    text = re.sub(r"\[\d+\]", " ", text)           # citation markers
    text = re.sub(r"={2,}.*?={2,}", " ", text)     # wiki headings
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def normalize_text(text):
    """Heavy normalization (lowercase, stop words, lemmatization). Shown for comparison only."""
    stop_words = set(stopwords.words("english"))
    lemmatizer = WordNetLemmatizer()
    tokens = re.findall(r"[a-z0-9]+", text.lower())
    return " ".join(lemmatizer.lemmatize(t) for t in tokens if t not in stop_words)


def fixed_size_chunks(text, chunk_size=200, overlap=50):
    words = text.split()
    step = chunk_size - overlap
    chunks = []
    for start in range(0, len(words), step):
        chunks.append(" ".join(words[start:start + chunk_size]))
        if start + chunk_size >= len(words):
            break
    return chunks


def sentence_chunks(text, max_words=CHUNK_MAX_WORDS, overlap_sentences=CHUNK_OVERLAP_SENTENCES):
    sentences = sent_tokenize(text)
    chunks, current, count = [], [], 0
    for s in sentences:
        n = len(s.split())
        if current and count + n > max_words:
            chunks.append(" ".join(current))
            current = current[-overlap_sentences:] if overlap_sentences else []
            count = sum(len(x.split()) for x in current)
        current.append(s)
        count += n
    if current:
        chunks.append(" ".join(current))
    return chunks


def compare_preprocessing_and_chunking(documents):
    print("\n--- Preprocessing comparison (first 300 chars of doc 0) ---")
    sample = documents[0]["text"][:300]
    print("ORIGINAL       :", sample)
    print("LIGHT CLEAN    :", clean_text(sample))
    print("HEAVY NORMALIZE:", normalize_text(sample))
    print("Chosen: light cleaning. Heavy normalization hurts Sentence-BERT embeddings "
          "and makes LLM context unreadable.")

    print("\n--- Chunking comparison on doc 0 ---")
    text = clean_text(documents[0]["text"])
    fixed = fixed_size_chunks(text, 200, 50)
    sent = sentence_chunks(text)
    print(f"Fixed-size (200w, 50 overlap): {len(fixed)} chunks, "
          f"avg {np.mean([len(c.split()) for c in fixed]):.0f} words")
    print(f"Sentence-based (~100w, 1 overlap): {len(sent)} chunks, "
          f"avg {np.mean([len(c.split()) for c in sent]):.0f} words")
    print("Chosen: sentence-based. Chunks keep whole sentences and fit within the "
          "256-token limit of MiniLM and the 512-token input of flan-t5.")


def build_chunks(documents):
    chunks = []
    for doc in documents:
        cleaned = clean_text(doc["text"])
        for i, ch in enumerate(sentence_chunks(cleaned)):
            chunks.append({"chunk_id": f"{doc['source']}::{i}",
                           "source": doc["source"], "text": ch})
    print(f"Total chunks: {len(chunks)}")
    return chunks


# ----------------------------------------------------------------------
# Part 3: Embeddings + FAISS vector store (with persistence)
# ----------------------------------------------------------------------
def build_or_load_index(embedding_model):
    os.makedirs(INDEX_DIR, exist_ok=True)

    if os.path.exists(INDEX_PATH) and os.path.exists(CHUNKS_PATH):
        index = faiss.read_index(INDEX_PATH)
        with open(CHUNKS_PATH, "r", encoding="utf-8") as f:
            chunks = json.load(f)
        print(f"Loaded saved index with {index.ntotal} vectors")
        return index, chunks

    documents = load_corpus()
    compare_preprocessing_and_chunking(documents)
    chunks = build_chunks(documents)

    texts = [c["text"] for c in chunks]
    embeddings = embedding_model.encode(
        texts, batch_size=64, show_progress_bar=True, normalize_embeddings=True
    ).astype("float32")

    # Inner product on normalized vectors == cosine similarity (exact search)
    index = faiss.IndexFlatIP(embeddings.shape[1])
    index.add(embeddings)

    faiss.write_index(index, INDEX_PATH)
    with open(CHUNKS_PATH, "w", encoding="utf-8") as f:
        json.dump(chunks, f)
    print(f"Built and saved index with {index.ntotal} vectors")
    return index, chunks


# ----------------------------------------------------------------------
# Part 4: Retrieval
# ----------------------------------------------------------------------
class Retriever:
    def __init__(self, embedding_model, index, chunks):
        self.model = embedding_model
        self.index = index
        self.chunks = chunks

    def embed_query(self, query):
        return self.model.encode([query], normalize_embeddings=True).astype("float32")

    def retrieve(self, query, k=TOP_K):
        scores, ids = self.index.search(self.embed_query(query), k)
        results = []
        for score, idx in zip(scores[0], ids[0]):
            c = self.chunks[idx]
            results.append({"score": float(score), "source": c["source"],
                            "chunk_id": c["chunk_id"], "text": c["text"]})
        return results

    def show(self, query, k=TOP_K):
        print("=" * 80)
        print("QUERY:", query)
        for i, r in enumerate(self.retrieve(query, k), 1):
            print(f"\n[{i}] score={r['score']:.3f} | {r['source']}")
            print(r["text"][:300] + "...")


def run_retrieval_evaluation(retriever):
    print("\n\n########## PART 4: RETRIEVAL EVALUATION ##########")
    print("\n--- Experimenting with k (scores of top-k chunks) ---")
    q = "How does backpropagation work?"
    for k in (3, 5, 10):
        print(f"k={k}:", [round(r["score"], 3) for r in retriever.retrieve(q, k)])
    print("Chosen k=3: scores drop after the top few chunks and the LLM prompt has limited space.")

    for query in SAMPLE_QUERIES:
        retriever.show(query, k=3)

    print("\nQualitative notes:")
    print("- Top chunks mostly come from the matching article, so embeddings capture meaning.")
    print("- Related-but-not-exact articles sometimes appear (e.g. Gradient descent for backpropagation).")
    print("- Improvements: cross-encoder re-ranking, hybrid BM25 + vector search, metadata filters, tuned chunk size.")


# ----------------------------------------------------------------------
# Part 5: RAG pipeline
# ----------------------------------------------------------------------
class RAGChatbot:
    def __init__(self, retriever):
        self.retriever = retriever
        load_dotenv()
        self.client = genai.Client(api_key=os.getenv("GOOGLE_API_KEY"))
        print(f"Using LLM: {LLM_MODEL}")

    @staticmethod
    def build_prompt(query, retrieved):
        context = "\n\n".join(f"[{i+1}] {r['text']}" for i, r in enumerate(retrieved))
        return (
            "Answer the question using only the context below. "
            "If the answer is not in the context, say \"I don't know.\"\n\n"
            f"Context:\n{context}\n\n"
            f"Question: {query}\nAnswer:"
        )

    def answer(self, query, k=TOP_K):
        retrieved = self.retriever.retrieve(query, k)
        prompt = self.build_prompt(query, retrieved)
        response = self.client.models.generate_content(model=LLM_MODEL, contents=prompt)
        sources = sorted({r["source"] for r in retrieved})
        return response.text, sources
            

    def chat(self, query, k=TOP_K):
        text, sources = self.answer(query, k)
        print("USER:", query)
        print("BOT :", text)
        print("SOURCES:", sources)
        print("-" * 80)


def run_demo(bot):
    print("\n\n########## PART 5: RAG CHATBOT DEMO ##########")
    for q in DEMO_QUERIES:
        bot.chat(q)
    print("\nStrengths: answers grounded in retrieved text, sources shown, runs locally on CPU.")
    print("Limitations: small LLM gives short answers, wrong retrieval -> wrong answer, "
          "512-token input limit, no conversation memory.")


def interactive_chat(bot):
    print("\nInteractive mode. Type a question (or 'exit' to quit).")
    while True:
        query = input("\nYou: ").strip()
        if query.lower() in ("exit", "quit", ""):
            print("Goodbye!")
            break
        bot.chat(query)


# ----------------------------------------------------------------------
# Main
# ----------------------------------------------------------------------
def main():
    for pkg in ["punkt", "punkt_tab", "stopwords", "wordnet"]:
        nltk.download(pkg, quiet=True)

    # Part 1
    download_dataset()

    # Parts 2 + 3
    embedding_model = SentenceTransformer(EMBEDDING_MODEL)
    print("Embedding dimension:", embedding_model.get_sentence_embedding_dimension())
    index, chunks = build_or_load_index(embedding_model)

    # Part 4
    retriever = Retriever(embedding_model, index, chunks)
    run_retrieval_evaluation(retriever)

    # Part 5
    bot = RAGChatbot(retriever)
    run_demo(bot)
    interactive_chat(bot)


if __name__ == "__main__":
    main()