# 🔹 Step 1: Install Gemini SDK


# !pip install -q google-generativeai pandas

     
# 🔹 Step 2: Import Libraries and Configure Gemini API


import google.generativeai as genai
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
model = genai.GenerativeModel(model_name="gemini-3.8-flash")

     
# 🔹 Step 4: Define a List of Prompts to Evaluate


# Define prompts to explore
prompts = [
    "Summarize the following: Climate change is causing polar ice to melt, raising sea levels globally.",
    "What's the main idea of this? Climate change is causing polar ice to melt, raising sea levels globally.",
    "Give a short summary about the melting of polar ice due to climate change.",
    "Explain the effect of climate change on sea levels in 1-2 lines."
]

     
# 🔹 Step 5: Generate and Collect Responses


# List to store evaluation results
results = []

# Iterate over prompts
for i, prompt in enumerate(prompts, start=1):
    try:
        response = model.generate_content(prompt)
        output = response.text.strip()
    except Exception as e:
        output = f"Error: {e}"

    results.append({
        "Prompt #": i,
        "Prompt Text": prompt,
        "Gemini Output": output
    })

     
# 🔹 Step 6: Display Outputs in Table for Evaluation


# Show all results as a table
df = pd.DataFrame(results)
df

# 🔹 Step 7: (Optional) Add Manual Scores or Evaluation Metrics


# You can manually assign quality scores (0–5) or types (e.g., too verbose, too short)
df["Clarity Score (0-5)"] = [4, 5, 3, 4]
df["Notes"] = ["Good, informative", "Concise and clear", "Too general", "Precise, but a bit short"]

df
