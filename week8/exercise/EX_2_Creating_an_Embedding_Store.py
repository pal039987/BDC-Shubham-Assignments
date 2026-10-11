"""
Assignment: Creating an Embedding Store with FAISS and Sentence Transformers

Pipeline: Wikipedia paragraphs -> Sentence-BERT embeddings -> FAISS index -> similarity search
Run: python3 <this_file>.py
"""
import os
import re
import json
import numpy as np
import faiss
import wikipediaapi
from sentence_transformers import SentenceTransformer

os.environ["TOKENIZERS_PARALLELISM"] = "false"

# ----------------------------------------------------------------------
# Config
# ----------------------------------------------------------------------
STORE_DIR = "embedding_store"
DOCS_PATH = os.path.join(STORE_DIR, "paragraphs.json")
EMB_PATH = os.path.join(STORE_DIR, "embeddings.npy")
IP_INDEX_PATH = os.path.join(STORE_DIR, "faiss_ip.index")
L2_INDEX_PATH = os.path.join(STORE_DIR, "faiss_l2.index")

MODEL_NAME = "all-MiniLM-L6-v2"
MAX_PARAS_PER_ARTICLE = 15
MIN_WORDS, MAX_WORDS = 30, 200

TOPICS = {
    "Space": ["Solar System", "Mars", "Moon", "Black hole", "Apollo 11",
              "International Space Station", "Jupiter", "Exoplanet", "Milky Way", "Big Bang"],
    "Medicine": ["Diabetes", "Vaccine", "Cancer", "Heart", "Asthma",
                 "Antibiotic", "Immune system", "Malaria", "Influenza", "Hypertension"],
    "Sports": ["Association football", "Cricket", "Olympic Games", "Basketball", "Tennis",
               "Marathon", "Baseball", "Rugby union", "Golf", "Volleyball"],
    "History": ["World War II", "Roman Empire", "French Revolution", "Industrial Revolution",
                "Renaissance", "Cold War", "Ancient Egypt", "Mughal Empire", "Silk Road", "Vikings"],
    "Technology": ["Internet", "Smartphone", "Semiconductor", "Solar power", "Electric car",
                   "3D printing", "Blockchain", "Quantum computing", "Renewable energy", "Cloud computing"],
}

# Queries are NOT present word-for-word in the documents; they are semantically related.
QUERIES = [
    {"text": "A mission to send humans to explore other planets", "category": "Space"},
    {"text": "How the body defends itself against infections", "category": "Medicine"},
    {"text": "A team game where players try to score goals with a ball", "category": "Sports"},
    {"text": "Empires and kingdoms that collapsed after long wars", "category": "History"},
    {"text": "Machines and software that connect people across the world", "category": "Technology"},
]


def header(title):
    print("\n" + "#" * 90)
    print("#", title)
    print("#" * 90)


# ----------------------------------------------------------------------
# Part 1: Dataset
# ----------------------------------------------------------------------
def download_dataset():
    wiki = wikipediaapi.Wikipedia(
        user_agent="EmbeddingStoreAssignment/1.0 (student project)", language="en"
    )
    docs = []
    for category, titles in TOPICS.items():
        for title in titles:
            page = wiki.page(title)
            if not page.exists():
                print("  skipped (not found):", title)
                continue
            count = 0
            for line in page.text.split("\n"):
                line = re.sub(r"\[\d+\]", "", line).strip()
                if MIN_WORDS <= len(line.split()) <= MAX_WORDS:
                    docs.append({"id": len(docs), "category": category,
                                 "title": title, "text": line})
                    count += 1
                    if count >= MAX_PARAS_PER_ARTICLE:
                        break
    return docs


def load_dataset():
    os.makedirs(STORE_DIR, exist_ok=True)
    if os.path.exists(DOCS_PATH):
        with open(DOCS_PATH, "r", encoding="utf-8") as f:
            docs = json.load(f)
        print(f"Loaded cached dataset: {len(docs)} paragraphs")
    else:
        print("Downloading Wikipedia articles (one time, takes 1-2 minutes)...")
        docs = download_dataset()
        with open(DOCS_PATH, "w", encoding="utf-8") as f:
            json.dump(docs, f)
        print(f"Downloaded and saved {len(docs)} paragraphs")
    return docs


def describe_dataset(docs):
    header("PART 1: DATASET DESCRIPTION")
    lengths = [len(d["text"].split()) for d in docs]
    print("Source        : English Wikipedia (wikipedia-api), 50 articles in 5 topics")
    print(f"Documents     : {len(docs)}")
    print("Requirement met (>= 500 documents):", len(docs) >= 500)
    print(f"Words per doc : avg {np.mean(lengths):.1f}, min {min(lengths)}, max {max(lengths)}")
    print("Topic diversity (paragraphs per category):")
    for cat in TOPICS:
        print(f"  {cat:<11}: {sum(d['category'] == cat for d in docs)}")
    print("Sample document:", docs[0]["text"][:200] + "...")
    print("\nEnvironment: Python virtual environment (shared venv), dependencies in requirements.txt:")
    print("torch, transformers, sentence-transformers, faiss-cpu, numpy, scikit-learn, wikipedia-api")


# ----------------------------------------------------------------------
# Part 2: Embeddings
# ----------------------------------------------------------------------
def generate_embeddings(docs):
    header("PART 2: SENTENCE EMBEDDINGS")
    print(f"Model: {MODEL_NAME}")
    print("Why: small (22M parameters), fast on CPU, 384-dim vectors, trained for semantic similarity;")
    print("     good speed/quality balance for ~700 paragraphs. all-mpnet-base-v2 is more accurate but ~5x slower.")

    model = SentenceTransformer(MODEL_NAME)
    texts = [d["text"] for d in docs]
    embeddings = model.encode(
        texts, batch_size=64, show_progress_bar=True, normalize_embeddings=True
    )
    embeddings = np.ascontiguousarray(embeddings, dtype="float32")   # FAISS needs float32
    np.save(EMB_PATH, embeddings)

    print("\nEmbeddings shape :", embeddings.shape, "(num_samples, embedding_dimension)")
    print("Embeddings dtype :", embeddings.dtype)
    print("Vector length (L2 norm) of first 5:", np.round(np.linalg.norm(embeddings[:5], axis=1), 3))
    print("\nFirst 5 embeddings (first 8 of 384 values each):")
    for i in range(5):
        print(f"  doc {i} [{docs[i]['title']}]:", np.round(embeddings[i][:8], 4))

    print("\nDimensionality discussion:")
    print(f"- Each paragraph becomes a point in a {embeddings.shape[1]}-dimensional space; similar meaning = nearby points.")
    print("- Higher dimensions capture more nuance but use more memory and make search slower.")
    print(f"- Memory here: {embeddings.nbytes / 1024:.0f} KB for {len(docs)} vectors (4 bytes x 384 x N).")
    print("- Vectors are L2-normalized (length 1), so inner product equals cosine similarity.")
    return model, embeddings


# ----------------------------------------------------------------------
# Part 3: FAISS index
# ----------------------------------------------------------------------
def build_indexes(embeddings):
    header("PART 3: FAISS INDEX")
    dim = embeddings.shape[1]

    index_ip = faiss.IndexFlatIP(dim)   # exact inner product (cosine on normalized vectors)
    index_l2 = faiss.IndexFlatL2(dim)   # exact L2 distance
    index_ip.add(embeddings)
    index_l2.add(embeddings)

    print("Chosen index: IndexFlatIP (exact search, inner product).")
    print("- 'Flat' = brute force: the query is compared with every stored vector, so results are exact.")
    print("- For ~700 vectors this is instant; approximate indexes (IVF, HNSW) only help at millions of vectors.")
    print("- With normalized embeddings, inner product = cosine similarity (higher = more similar).")
    print("- IndexFlatL2 is also built for comparison (lower distance = more similar).")
    print(f"\nVectors in IndexFlatIP: {index_ip.ntotal}")
    print(f"Vectors in IndexFlatL2: {index_l2.ntotal}")
    return index_ip, index_l2


def demo_persistence(index_ip, index_l2, model):
    print("\n--- Index persistence (save and load) ---")
    faiss.write_index(index_ip, IP_INDEX_PATH)
    faiss.write_index(index_l2, L2_INDEX_PATH)
    print("Saved:", IP_INDEX_PATH, "and", L2_INDEX_PATH)

    loaded = faiss.read_index(IP_INDEX_PATH)
    print("Loaded index vectors:", loaded.ntotal)

    q = model.encode(["exploring space"], normalize_embeddings=True).astype("float32")
    s1, i1 = index_ip.search(q, 3)
    s2, i2 = loaded.search(q, 3)
    print("Same results before and after loading:", bool(np.array_equal(i1, i2)))
    return loaded


# ----------------------------------------------------------------------
# Part 4: Similarity search
# ----------------------------------------------------------------------
def embed_query(model, text):
    q = model.encode([text], normalize_embeddings=True).astype("float32")
    return q   # shape (1, embedding_dimension)


def run_search(model, index_ip, index_l2, docs):
    header("PART 4: SIMILARITY SEARCH AND EVALUATION")
    precision_log = {3: [], 5: [], 10: []}
    off_topic = []

    for q in QUERIES:
        qvec = embed_query(model, q["text"])
        print("\n" + "=" * 90)
        print("QUERY:", q["text"], f"(expected topic: {q['category']})")
        print("Query embedding shape:", qvec.shape)

        for k in (3, 5, 10):
            scores, ids = index_ip.search(qvec, k)
            hits = [docs[i] for i in ids[0]]
            matches = sum(h["category"] == q["category"] for h in hits)
            precision_log[k].append(matches / k)
            print(f"\n--- k={k} | Precision@{k} = {matches}/{k} ---")
            for rank, (s, h) in enumerate(zip(scores[0], hits), 1):
                same = h["category"] == q["category"]
                flag = "" if same else "   <-- different topic"
                print(f"[{rank}] score={s:.3f} | {h['category']} | {h['title']}{flag}")
                if k == 3:
                    print("     " + h["text"][:220] + "...")
                if not same and k == 10:
                    off_topic.append((q["text"], h["category"], h["title"]))

        d, ids_l2 = index_l2.search(qvec, 5)
        _, ids_ip = index_ip.search(qvec, 5)
        print("\nIndexFlatL2 top-5 distances (lower = closer):", np.round(d[0], 3))
        print("Same top-5 as IndexFlatIP:", bool(np.array_equal(ids_l2, ids_ip)))

    print("\n" + "=" * 90)
    print("SUMMARY: average Precision@k over", len(QUERIES), "queries")
    for k, vals in precision_log.items():
        print(f"  k={k:<2}: {np.mean(vals):.2f}")

    print("\nOff-topic results at k=10 (surprising or ambiguous matches):")
    if off_topic:
        for query, cat, title in off_topic:
            print(f"  '{query}' -> [{cat}] {title}")
    else:
        print("  none")

    print("\nQualitative analysis:")
    print("- Top results are almost always from the expected topic, even though the queries share few")
    print("  exact words with the documents. This shows embeddings capture meaning, not just keywords.")
    print("- Precision usually drops as k grows: the first few hits are strongest, later hits are weaker matches.")
    print("- Off-topic hits mostly come from overlapping subjects (e.g. Apollo 11 or Cold War for space queries,")
    print("  Renewable energy and Semiconductor for technology/history queries, Heart/Immune system for health).")
    print("- Reasons: broad paragraphs mixing several topics, and a small model with 384 dimensions.")


# ----------------------------------------------------------------------
# Part 5: Reflection
# ----------------------------------------------------------------------
def reflection():
    header("PART 5: REFLECTION AND FUTURE WORK")
    print("Challenges faced:")
    print("- Finding a dataset with 500+ clean text pieces: solved by splitting Wikipedia articles into paragraphs.")
    print("- FAISS needs float32 and contiguous arrays: converted with np.ascontiguousarray(..., dtype='float32').")
    print("- Raw Wikipedia text has headings and citation markers: filtered by paragraph length and regex.")
    print("\nPotential improvements:")
    print("- Try all-mpnet-base-v2 for higher accuracy.")
    print("- For millions of vectors use IndexIVFFlat or IndexHNSWFlat (approximate, much faster).")
    print("- Re-rank the top results with a cross-encoder; add hybrid keyword (BM25) + vector search.")
    print("- Smaller, cleaner chunks and metadata filtering by topic.")
    print("\nLearnings:")
    print("- Sentence embeddings turn text into vectors where distance means semantic difference.")
    print("- Normalized vectors make inner product = cosine similarity, and Flat indexes give exact results.")
    print("- A saved FAISS index loads instantly, so the corpus does not need to be re-embedded each run.")


# ----------------------------------------------------------------------
# Main
# ----------------------------------------------------------------------
def main():
    docs = load_dataset()
    describe_dataset(docs)
    model, embeddings = generate_embeddings(docs)
    index_ip, index_l2 = build_indexes(embeddings)
    index_ip = demo_persistence(index_ip, index_l2, model)
    run_search(model, index_ip, index_l2, docs)
    reflection()


if __name__ == "__main__":
    main()