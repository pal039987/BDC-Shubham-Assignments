# 🔹 Step 1: Install Gemini SDK


# !pip install -q google-generativeai

     
# 🔹 Step 2: Import Libraries and Configure Gemini API


import google.generativeai as genai
from PIL import Image
import IPython.display as display
import time
import pandas as pd

# Configure Gemini with your API key
from dotenv import load_dotenv

load_dotenv()
API_KEY = os.environ.get("GEMINI_API_KEY")
if not API_KEY:
    raise RuntimeError("Set the GEMINI_API_KEY environment variable before running.")

genai.configure(api_key=API_KEY)

     
# 🔹 Step 3: Load the Multimodal Gemini Model


# Use fast multimodal model
model = genai.GenerativeModel(model_name="gemini-flash-lite-latest")

     
# 🔹 Step 4: Define Prompts to Test We will test 3 types of prompts:

# Short prompt

# Medium prompt

# Long prompt


prompts = {
    "short": "What is the capital of France?",
    "medium": "Write a brief paragraph explaining why exercise is important for mental health.",
    "long": """
Write a detailed blog post (at least 300 words) about how Artificial Intelligence is transforming the field of education.
Include examples and mention ethical considerations.
"""
}

     
# 🔹 Step 5: Measure Latency of Each Prompt


results = []

for prompt_type, prompt_text in prompts.items():
    start_time = time.time()

    response = model.generate_content(prompt_text)

    end_time = time.time()
    latency = round(end_time - start_time, 2)

    response_text = response.text.strip()
    token_count = len(response_text.split())

    results.append({
        "Prompt Type": prompt_type,
        "Latency (s)": latency,
        "Response Tokens": token_count,
        "Preview": response_text[:100] + "..."
    })

     
# 🔹 Step 6: Display Results as Table


df = pd.DataFrame(results)
df

# 🔹 Step 7: Optional – Plot with Matplotlib (Visual Comparison)


import matplotlib.pyplot as plt

plt.bar(df["Prompt Type"], df["Latency (s)"])
plt.title("Prompt Latency Comparison")
plt.ylabel("Latency (seconds)")
plt.xlabel("Prompt Type")
plt.show()
