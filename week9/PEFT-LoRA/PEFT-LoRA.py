# ============================================================
# PDF QUESTION ANSWERING WITH FAISS, SENTENCE TRANSFORMERS,
# HUGGING FACE TRANSFORMERS, AND LoRA
#
# Note:
# This script adds LoRA adapters but DOES NOT train them.
# It performs retrieval-augmented question answering (RAG).
# ============================================================

# Install dependencies in a separate Colab cell if needed:
# %pip install -q torch transformers accelerate peft bitsandbytes
# %pip install -q pypdf sentence-transformers faiss-cpu numpy

import warnings
from pathlib import Path

import faiss
import numpy as np
import torch

from pypdf import PdfReader
from sentence_transformers import SentenceTransformer
from transformers import (
    AutoTokenizer,
    AutoModelForCausalLM,
    BitsAndBytesConfig,
)
from peft import (
    LoraConfig,
    TaskType,
    get_peft_model,
    prepare_model_for_kbit_training,
)

warnings.filterwarnings("ignore")


# ============================================================
# 1. EXTRACT TEXT FROM PDF
# ============================================================

def extract_text_from_pdf(pdf_path):
    """Extract text from a PDF file."""

    pdf_path = Path(pdf_path)

    if not pdf_path.is_file():
        raise FileNotFoundError(f"PDF file not found: {pdf_path}")

    if pdf_path.suffix.lower() != ".pdf":
        raise ValueError("Please provide a valid PDF file.")

    reader = PdfReader(str(pdf_path))
    pages_text = []

    for page_number, page in enumerate(reader.pages, start=1):
        page_text = page.extract_text() or ""

        if page_text.strip():
            pages_text.append(page_text.strip())

    text = "\n\n".join(pages_text).strip()

    if not text:
        raise ValueError(
            "No extractable text was found in the PDF. "
            "If it is a scanned PDF, run OCR first."
        )

    return text


# ============================================================
# 2. SPLIT TEXT INTO OVERLAPPING CHUNKS
# ============================================================

def chunk_text(text, chunk_size=500, overlap=50):
    """Split text into word-based chunks with overlap."""

    if chunk_size <= 0:
        raise ValueError("chunk_size must be greater than zero.")

    if overlap < 0 or overlap >= chunk_size:
        raise ValueError(
            "overlap must be non-negative and smaller than chunk_size."
        )

    words = text.split()

    if not words:
        return []

    step = chunk_size - overlap
    chunks = []

    for start in range(0, len(words), step):
        chunk = " ".join(words[start:start + chunk_size])

        if chunk.strip():
            chunks.append(chunk)

        if start + chunk_size >= len(words):
            break

    return chunks


# ============================================================
# 3. VECTOR DATABASE USING SENTENCE TRANSFORMERS AND FAISS
# ============================================================

class SimpleVectorDB:
    """Store and retrieve document chunks using cosine similarity."""

    def __init__(self, model_name="sentence-transformers/all-MiniLM-L6-v2"):
        self.encoder = SentenceTransformer(model_name)
        self.index = None
        self.chunks = []

    def add_documents(self, texts):
        """Create normalized embeddings and add them to FAISS."""

        if not texts:
            raise ValueError("Cannot index an empty list of text chunks.")

        self.chunks = list(texts)

        embeddings = self.encoder.encode(
            self.chunks,
            convert_to_numpy=True,
            normalize_embeddings=True,
            show_progress_bar=True,
        )

        embeddings = np.ascontiguousarray(embeddings, dtype=np.float32)

        dimension = embeddings.shape[1]

        # Inner product of normalized vectors = cosine similarity.
        self.index = faiss.IndexFlatIP(dimension)
        self.index.add(embeddings)

    def search(self, query, k=3):
        """Return the top-k most relevant chunks."""

        if self.index is None or not self.chunks:
            raise RuntimeError("No documents have been indexed yet.")

        if not query or not query.strip():
            raise ValueError("The search query cannot be empty.")

        if k <= 0:
            raise ValueError("k must be greater than zero.")

        query_embedding = self.encoder.encode(
            [query],
            convert_to_numpy=True,
            normalize_embeddings=True,
        )

        query_embedding = np.ascontiguousarray(
            query_embedding,
            dtype=np.float32,
        )

        actual_k = min(k, len(self.chunks))
        scores, indices = self.index.search(query_embedding, actual_k)

        results = []

        for score, idx in zip(scores[0], indices[0]):
            # FAISS uses -1 for a missing result.
            if idx < 0 or idx >= len(self.chunks):
                continue

            results.append({
                "text": self.chunks[int(idx)],
                "score": float(score),
            })

        return results


# ============================================================
# 4. LOAD A LANGUAGE MODEL AND ADD LoRA ADAPTERS
# ============================================================

def setup_model_with_lora(
    model_name="microsoft/DialoGPT-medium",
    use_4bit=False,
):
    """Load a causal language model and attach LoRA adapters.

    This function does not train the adapters.
    """

    if use_4bit and not torch.cuda.is_available():
        raise RuntimeError(
            "4-bit quantization requires a compatible CUDA environment. "
            "Enable a GPU in Colab or set use_4bit=False."
        )

    tokenizer = AutoTokenizer.from_pretrained(model_name)

    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token

    model_kwargs = {}

    if use_4bit:
        quantization_config = BitsAndBytesConfig(
            load_in_4bit=True,
            bnb_4bit_quant_type="nf4",
            bnb_4bit_compute_dtype=torch.float16,
            bnb_4bit_use_double_quant=True,
        )

        model_kwargs["quantization_config"] = quantization_config
        model_kwargs["device_map"] = "auto"

    elif torch.cuda.is_available():
        model_kwargs["torch_dtype"] = torch.float16
        model_kwargs["device_map"] = "auto"

    model = AutoModelForCausalLM.from_pretrained(
        model_name,
        **model_kwargs,
    )

    if use_4bit:
        model = prepare_model_for_kbit_training(model)

    # DialoGPT is GPT-2-based and uses Conv1D attention/projection layers.
    lora_config = LoraConfig(
        task_type=TaskType.CAUSAL_LM,
        r=16,
        lora_alpha=32,
        lora_dropout=0.1,
        target_modules=["c_attn", "c_proj"],
        bias="none",
    )

    model = get_peft_model(model, lora_config)

    # The adapters are newly initialized, not fine-tuned.
    model.eval()

    model.print_trainable_parameters()

    return model, tokenizer


# ============================================================
# 5. PDF QUESTION ANSWERING PIPELINE
# ============================================================

class PDFQuestionAnswering:
    """Retrieve relevant PDF chunks and generate an answer."""

    def __init__(self, use_4bit=False):
        self.vector_db = SimpleVectorDB()
        self.model = None
        self.tokenizer = None
        self.use_4bit = use_4bit
        self.pdf_loaded = False

    def load_pdf(self, pdf_path):
        """Extract, chunk, and index PDF content."""

        print("Extracting text from PDF...")
        text = extract_text_from_pdf(pdf_path)

        print("Splitting text into chunks...")
        chunks = chunk_text(
            text,
            chunk_size=500,
            overlap=50,
        )

        if not chunks:
            raise ValueError("No usable text chunks were created.")

        print("Creating vector database...")
        self.vector_db.add_documents(chunks)

        self.pdf_loaded = True

        print(f"PDF processed successfully: {len(chunks)} chunks.")

    def setup_model(self):
        """Load the language model with LoRA adapters."""

        print("Loading language model and configuring LoRA...")

        self.model, self.tokenizer = setup_model_with_lora(
            model_name="microsoft/DialoGPT-medium",
            use_4bit=self.use_4bit,
        )

        print("Model setup complete.")

    def answer_question(
        self,
        question,
        top_k=3,
        max_new_tokens=120,
    ):
        """Retrieve context and generate an answer."""

        if not self.pdf_loaded:
            raise RuntimeError("Load a PDF before asking questions.")

        if self.model is None or self.tokenizer is None:
            raise RuntimeError("Call setup_model() before asking questions.")

        if not question or not question.strip():
            raise ValueError("Question cannot be empty.")

        # Step 1: Retrieve relevant chunks.
        retrieved = self.vector_db.search(question, k=top_k)

        if not retrieved:
            return {
                "answer": "No relevant information was found in the PDF.",
                "context": "",
                "relevant_chunks": 0,
                "scores": [],
            }

        # Step 2: Build context from retrieved chunks.
        context = "\n\n".join(
            item["text"] for item in retrieved
        )

        # Keep the context bounded.
        context = context[:3000]

        # Step 3: Build the prompt.
        prompt = (
            "Use the following document excerpts to answer the question. "
            "If the answer is not present in the excerpts, say that the "
            "document does not provide enough information.\n\n"
            f"Document excerpts:\n{context}\n\n"
            f"Question: {question.strip()}\n"
            "Answer:"
        )

        # Step 4: Tokenize and limit input length.
        inputs = self.tokenizer(
            prompt,
            return_tensors="pt",
            truncation=True,
            max_length=768,
        )

        # Place input tensors on the input embedding device.
        input_device = self.model.get_input_embeddings().weight.device
        inputs = {
            key: value.to(input_device)
            for key, value in inputs.items()
        }

        input_token_count = inputs["input_ids"].shape[1]

        # Step 5: Generate only the continuation tokens.
        with torch.inference_mode():
            output_ids = self.model.generate(
                **inputs,
                max_new_tokens=max_new_tokens,
                do_sample=False,
                num_beams=1,
                repetition_penalty=1.1,
                pad_token_id=self.tokenizer.pad_token_id,
                eos_token_id=self.tokenizer.eos_token_id,
            )

        # Step 6: Remove prompt tokens before decoding.
        answer_ids = output_ids[0, input_token_count:]

        answer = self.tokenizer.decode(
            answer_ids,
            skip_special_tokens=True,
        ).strip()

        if not answer:
            answer = (
                "The model did not generate an answer. "
                "Try a shorter question or a different model."
            )

        return {
            "answer": answer,
            "context": context,
            "relevant_chunks": len(retrieved),
            "scores": [item["score"] for item in retrieved],
        }


# ============================================================
# 6. INTERACTIVE QUESTION-ANSWERING SESSION
# ============================================================

def interactive_qa(pdf_path=None, use_4bit=False):
    """Run interactive PDF question answering."""

    # In Google Colab, upload a PDF if no path was supplied.
    if pdf_path is None:
        try:
            from google.colab import files

            print("Upload your PDF file:")
            uploaded = files.upload()

            if not uploaded:
                print("No file was uploaded.")
                return

            pdf_path = next(iter(uploaded.keys()))

        except ImportError:
            raise ValueError(
                "Provide pdf_path when running outside Google Colab."
            )

    qa_system = PDFQuestionAnswering(use_4bit=use_4bit)

    try:
        qa_system.load_pdf(pdf_path)
        qa_system.setup_model()

    except Exception as exc:
        print(f"Setup failed: {exc}")
        return

    print("\nPDF loaded. You can now ask questions.")
    print("Type 'quit' or 'exit' to stop.\n")

    while True:
        try:
            question = input("Your question: ").strip()

            if question.lower() in {"quit", "exit"}:
                print("Session ended.")
                break

            if not question:
                continue

            result = qa_system.answer_question(question)

            print(f"\nAnswer: {result['answer']}")
            print(f"Retrieved chunks: {result['relevant_chunks']}")
            print(f"Retrieved context:\n{result['context']}")
            print("-" * 60)

        except KeyboardInterrupt:
            print("\nSession ended.")
            break

        except Exception as exc:
            print(f"Error answering question: {exc}")


# ============================================================
# 7. MAIN
# ============================================================

if __name__ == "__main__":
    # Google Colab:
    # interactive_qa(use_4bit=True)   # Compatible CUDA GPU required
    #
    # Local machine:
    # interactive_qa(pdf_path="your_document.pdf", use_4bit=False)

    interactive_qa(pdf_path="Insurance_Regulations_2024.pdf", use_4bit=False)