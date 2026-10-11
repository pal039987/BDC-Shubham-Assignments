"""
Prepare a local copy of a public pretrained sentiment classifier, then upload it
to a Hugging Face Hub repository you own.

Model: distilbert/distilbert-base-uncased-finetuned-sst-2-english
Task: binary English sentiment classification (POSITIVE / NEGATIVE).
This is a pretrained/fine-tuned public model, NOT a model fine-tuned by this assignment.
"""
import os
from pathlib import Path

from dotenv import load_dotenv
from huggingface_hub import HfApi, create_repo
from transformers import AutoModelForSequenceClassification, AutoTokenizer

load_dotenv()
TOKEN = os.getenv("HF_TOKEN")
REPO_ID = os.getenv("HF_REPO_ID", "").strip()
MODEL_ID = "distilbert/distilbert-base-uncased-finetuned-sst-2-english"
LOCAL_DIR = Path("model_artifacts/sentiment-classifier")

def main():
    if not TOKEN or TOKEN.startswith("hf_REPLACE"):
        raise SystemExit(
            "Set HF_TOKEN in .env first. Create a Hugging Face write token in Settings > Access Tokens."
        )
    if not REPO_ID or "your-username" in REPO_ID:
        raise SystemExit("Set HF_REPO_ID in .env to YOUR_USERNAME/a-unique-repo-name.")

    print(f"Source model: {MODEL_ID}")
    print("Task: English sentiment classification (POSITIVE / NEGATIVE)")
    LOCAL_DIR.mkdir(parents=True, exist_ok=True)

    tokenizer = AutoTokenizer.from_pretrained(MODEL_ID)
    model = AutoModelForSequenceClassification.from_pretrained(MODEL_ID)
    tokenizer.save_pretrained(LOCAL_DIR)
    model.save_pretrained(LOCAL_DIR)
    print(f"Saved model and tokenizer locally to: {LOCAL_DIR}")

    api = HfApi(token=TOKEN)
    repo_url = create_repo(repo_id=REPO_ID, token=TOKEN, repo_type="model",
                           private=False, exist_ok=True)
    print(f"Repository URL: {repo_url}")

    # Add a useful model card before uploading.
    card = f"""---
license: apache-2.0
library_name: transformers
pipeline_tag: text-classification
tags:
- sentiment-analysis
- distilbert
---

# Sentiment Classification Demo

This repository packages `{MODEL_ID}`, a public DistilBERT model for binary
English sentiment classification. It predicts `POSITIVE` or `NEGATIVE`.

## Source and data
The model is sourced from `{MODEL_ID}`. It was originally fine-tuned on the
SST-2 sentiment task; this assignment re-saves and republishes it and does not
perform additional fine-tuning.

## Usage
```python
from transformers import pipeline
classifier = pipeline("text-classification", model="{REPO_ID}")
print(classifier("The product is excellent!"))
```

## Limitations
The model is intended for English sentiment examples similar to its training
data. It can misclassify sarcasm, mixed sentiment, domain-specific language,
and other languages. Predictions should not be treated as objective truth.
"""
    (LOCAL_DIR / "README.md").write_text(card, encoding="utf-8")
    api.upload_folder(
        repo_id=REPO_ID,
        repo_type="model",
        folder_path=str(LOCAL_DIR),
        token=TOKEN,
        commit_message="Upload sentiment classifier and model card",
    )
    print("Upload complete.")
    print(f"Open and verify: https://huggingface.co/{REPO_ID}")

if __name__ == "__main__":
    main()
