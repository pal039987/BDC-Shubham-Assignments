# Packaged Text Classification Inference

## Model and task
This project uses `distilbert/distilbert-base-uncased-finetuned-sst-2-english`
from the Hugging Face Hub. It is a DistilBERT sequence-classification model for
English sentiment analysis, predicting `POSITIVE` or `NEGATIVE`.

## Project files
- `inference_script.py`: model loading, device selection, batched prediction, reporting.
- `requirements.txt`: concise runtime dependencies.
- `test_data.csv`: 24 example texts and reference labels.
- `notebook_template.ipynb`: notebook structure for assignment documentation.

## Setup
Python 3.10+ is recommended.

```bash
python -m venv .venv
source .venv/bin/activate
# Windows PowerShell: .venv\\Scripts\\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
```

## Run
Run from this directory. The first run needs internet access to download model files.

```bash
python inference_script.py
```

Optional arguments:
```bash
python inference_script.py --data test_data.csv --batch-size 16
python inference_script.py --model-path ./saved_model
```

To save a local copy of the downloaded model and tokenizer:
```bash
python -c "from transformers import AutoTokenizer,AutoModelForSequenceClassification; m='distilbert/distilbert-base-uncased-finetuned-sst-2-english'; AutoTokenizer.from_pretrained(m).save_pretrained('saved_model'); AutoModelForSequenceClassification.from_pretrained(m).save_pretrained('saved_model')"
```

## Dataset and evaluation
The CSV contains 24 illustrative examples with reference sentiment labels. Treat it as
a demonstration dataset, not a formally collected blind test set. For a rigorous score,
use at least 20 genuinely held-out samples that were not used during training or model
selection. The script prints actual predictions, confidence, runtime, and label agreement;
do not report results until you have run it in your environment.

## Why minimal dependencies?
A concise requirements file reduces install time, dependency conflicts, image size, and
maintenance/security surface. Training-only packages such as `datasets` and `accelerate`
are not required by this inference script.

## Packaging and deployment discussion
A dedicated script makes preprocessing, batching, device selection, and output consistent
across runs. A requirements file documents the runtime dependencies, making the project
easier to reproduce, test, automate, and deploy than notebook-only inference. Next steps:
pin tested package versions, add unit tests/logging, validate on a proper held-out dataset,
build a Docker image, and optionally expose predictions through FastAPI/Flask or a model
serving platform. CPU is supported; CUDA is selected automatically if available.
