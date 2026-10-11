# Upload a Model to Hugging Face Hub and Test via API

## Model choice
This package uses `distilbert/distilbert-base-uncased-finetuned-sst-2-english`, a public DistilBERT model for English binary sentiment classification (`POSITIVE` / `NEGATIVE`). The assignment re-saves and republishes it to simulate a locally prepared model; it does **not** claim new fine-tuning was performed.

## 1. Configure credentials
1. Create/sign in to a Hugging Face account: https://huggingface.co/join
2. Create a **write** token at https://huggingface.co/settings/tokens.
3. Copy `.env.example` to `.env`.
4. Put your token in `HF_TOKEN` and set `HF_REPO_ID` to `YOUR_USERNAME/a-unique-repository-name`.
5. Never paste your real token into code, screenshots, notebook outputs, or a public repository.

## 2. Environment
If you already have a working virtual environment, you can reuse it. The assignment text asks for a new one, but do not create another unless your instructor explicitly requires it. From this folder:
```bash
pip install -r requirements.txt
```
If you do need a new environment, create it in this project folder and activate it before installing packages.

## 3. Upload
```bash
python upload_model.py
```
This downloads the source model, saves model/tokenizer files into `model_artifacts/sentiment-classifier`, creates the public Hub repository, writes a model card, and uploads the folder. The repository name must be unique and owned by your account.

## 4. API test
After upload succeeds:
```bash
python api_test.py
```
It submits three distinct text inputs and prints each HTTP status and full JSON response. Hosted inference availability, provider configuration, authentication requirements, and rate limits can vary. If the API reports that the model is loading or the endpoint is unavailable, wait and retry or follow the deployment/API instructions shown on the model page.

## 5. Notebook submission and screenshots
Open `HuggingFace_Hub_API_Assignment.ipynb` in Jupyter/Antigravity and run the cells in order after configuring `.env`. Do not run cells that would expose your token. Paste or retain the actual outputs from your run. Take screenshots of:
- your model repository page and uploaded files/model card;
- a successful inference result in the model page's widget, if available;
- the API script showing inputs and actual JSON responses.

Screenshots and live outputs cannot be fabricated by this ZIP: you must run the upload and API requests with your own account/token. If Hub Inference API is unavailable for the model, document the exact response and use the deployment option offered by Hugging Face.

## Reflection topics
Discuss sharing/reproducibility, collaboration, API convenience, latency, rate limits, cost, secret management, reliability, and when a dedicated service such as Cloud Run, SageMaker, or Azure ML may be preferable.
