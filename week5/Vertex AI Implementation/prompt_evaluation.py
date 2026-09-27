import os
from dotenv import load_dotenv
import google.generativeai as genai
import pandas as pd

# Load API key securely from .env file
load_dotenv()
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
genai.configure(api_key=GOOGLE_API_KEY)

# Sample input
input_text = """
I ordered the headphones last week and they arrived two days late. The sound quality is great, 
but the packaging was damaged. Customer support was helpful and replaced the box.
"""

# Prompts to test
prompt_templates = [
    "Summarize the review.",
    "Give a brief summary of the customer feedback.",
    "Summarize the key points from the review text.",
    "Highlight pros and cons from this customer review.",
    "What is the customer's overall opinion?"
]

# Load model
model = genai.GenerativeModel("gemini-flash-lite-latest")

# Generate & store results
results = []

for idx, prompt_template in enumerate(prompt_templates):
    prompt = f"{prompt_template}\n\n{input_text}"
    try:
        response = model.generate_content(prompt)
        summary = response.text.strip()
    except Exception as e:
        summary = f"Error: {e}"

    results.append({
        "Prompt #": idx + 1,
        "Prompt Used": prompt_template,
        "Model Output": summary
    })

df_results = pd.DataFrame(results)
print(df_results)

df_results.to_csv("vertex_prompt_evaluation.csv", index=False)