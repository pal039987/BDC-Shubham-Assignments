"""Batched DistilBERT sentiment inference."""
import argparse
import time
from pathlib import Path

import pandas as pd
import torch
from transformers import AutoModelForSequenceClassification, AutoTokenizer

DEFAULT_MODEL = "distilbert/distilbert-base-uncased-finetuned-sst-2-english"


def load_model(model_path):
    """Load tokenizer and classifier; choose CUDA when available, otherwise CPU."""
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    tokenizer = AutoTokenizer.from_pretrained(model_path)
    model = AutoModelForSequenceClassification.from_pretrained(model_path)
    model.to(device)
    model.eval()
    return tokenizer, model, device


def predict_sentiment(texts, model, tokenizer, device, batch_size=16):
    """Return predicted labels and confidence scores for a list of strings."""
    results = []
    id2label = model.config.id2label
    for start in range(0, len(texts), batch_size):
        batch = texts[start:start + batch_size]
        encoded = tokenizer(
            batch, truncation=True, padding=True, max_length=512,
            return_tensors="pt"
        )
        encoded = {key: value.to(device) for key, value in encoded.items()}
        with torch.inference_mode():
            logits = model(**encoded).logits
            probs = torch.softmax(logits, dim=-1)
            pred_ids = torch.argmax(probs, dim=-1)
        for pred_id, row in zip(pred_ids.tolist(), probs.tolist()):
            results.append({
                "label": id2label[pred_id],
                "confidence": float(row[pred_id])
            })
    return results


def main():
    parser = argparse.ArgumentParser(description="Run sentiment inference from CSV.")
    parser.add_argument("--model-path", default=DEFAULT_MODEL,
                        help="Hugging Face model ID or local model directory.")
    parser.add_argument("--data", default="test_data.csv",
                        help="CSV with a required text column and optional label column.")
    parser.add_argument("--batch-size", type=int, default=16)
    args = parser.parse_args()

    if args.batch_size < 1:
        parser.error("--batch-size must be at least 1.")
    data_path = Path(args.data)
    if not data_path.is_file():
        raise FileNotFoundError(f"Dataset not found: {data_path.resolve()}")

    df = pd.read_csv(data_path)
    if "text" not in df.columns:
        raise ValueError("CSV must contain a 'text' column.")
    texts = df["text"].fillna("").astype(str).tolist()

    tokenizer, model, device = load_model(args.model_path)
    start = time.perf_counter()
    predictions = predict_sentiment(texts, model, tokenizer, device, args.batch_size)
    elapsed = time.perf_counter() - start

    print(f"Model: {args.model_path}")
    print(f"Device: {device}")
    print(f"Samples: {len(texts)}")
    print(f"Inference time (excluding model loading): {elapsed:.3f} seconds")
    print("-" * 90)

    correct, evaluable = 0, 0
    has_labels = "label" in df.columns
    for i, (text, pred) in enumerate(zip(texts, predictions)):
        true_label = str(df.iloc[i]["label"]) if has_labels else "N/A"
        if has_labels and true_label.strip().upper() in {"POSITIVE", "NEGATIVE"}:
            evaluable += 1
            correct += pred["label"].upper() == true_label.strip().upper()
        print(f"{i + 1:02d}. Text: {text}")
        print(f"    Predicted: {pred['label']} (confidence={pred['confidence']:.3f})"
              f" | True label: {true_label}")

    if evaluable:
        print("-" * 90)
        print(f"Accuracy against CSV labels: {correct / evaluable:.1%} ({correct}/{evaluable})")
        print("These illustrative examples are not a formal benchmark.")

if __name__ == "__main__":
    main()
