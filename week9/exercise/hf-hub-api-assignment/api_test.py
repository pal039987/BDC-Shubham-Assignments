"""Test a Hugging Face hosted model with 3 text inputs and basic error handling."""
import json
import os
import requests
from dotenv import load_dotenv

load_dotenv()
TOKEN = os.getenv("HF_TOKEN")
REPO_ID = os.getenv("HF_REPO_ID", "").strip()
API_URL = f"https://api-inference.huggingface.co/models/{REPO_ID}"

TEST_INPUTS = [
    "I absolutely love this product; it works perfectly.",
    "The experience was disappointing and the quality was poor.",
    "The package arrived today. It is okay, nothing special.",
]

def call_api(text):
    headers = {"Content-Type": "application/json"}
    # Token is optional for some public models, but authenticated requests are preferable.
    if TOKEN and not TOKEN.startswith("hf_REPLACE"):
        headers["Authorization"] = f"Bearer {TOKEN}"
    try:
        response = requests.post(
            API_URL,
            headers=headers,
            json={"inputs": text},
            timeout=90,
        )
        print(f"HTTP status: {response.status_code}")
        try:
            payload = response.json()
        except ValueError:
            payload = {"raw_response": response.text}
        print("Full JSON response:")
        print(json.dumps(payload, indent=2, ensure_ascii=False))
        if not response.ok:
            print("Note: API returned an error. Check repo ID, token permissions, model availability, and provider/API access.")
        return payload
    except requests.RequestException as exc:
        print(f"Request failed: {exc}")
        return None

def main():
    if not REPO_ID or "your-username" in REPO_ID:
        raise SystemExit("Set HF_REPO_ID in .env to the repository you uploaded.")
    print("Endpoint:", API_URL)
    for i, text in enumerate(TEST_INPUTS, 1):
        print("\n" + "=" * 70)
        print(f"Test {i} input: {text}")
        result = call_api(text)
        print("Brief analysis: inspect the returned label and score; positive/negative examples should generally match their wording.")
    print("\nOptional error-handling demo: send an invalid payload.")
    print("This request is expected to return an HTTP error or validation message; exact behavior depends on the hosted endpoint.")
    try:
        bad = requests.post(
            API_URL,
            headers={"Authorization": f"Bearer {TOKEN}"} if TOKEN and not TOKEN.startswith("hf_REPLACE") else {},
            json={"unexpected_key": 123},
            timeout=90,
        )
        print("Invalid-payload HTTP status:", bad.status_code)
        print("Invalid-payload response:", bad.text[:1500])
    except requests.RequestException as exc:
        print("Invalid-payload request failed safely:", exc)

if __name__ == "__main__":
    main()
