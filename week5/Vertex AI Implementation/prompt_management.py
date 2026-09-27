import streamlit as st
import pandas as pd
import os
from dotenv import load_dotenv
import google.generativeai as genai

# Configure Gemini API key securely
load_dotenv()
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
genai.configure(api_key=GOOGLE_API_KEY)

model = genai.GenerativeModel("gemini-flash-lite-latest")

# UI
st.title("🧪 Gemini Prompt Testing App")
st.markdown("Test and compare prompts on a sample text using Gemini 3.6 Flash.")

# Sample input text
sample_text = st.text_area(
    "📝 Input Text",
    height=200,
    value="""I ordered the headphones last week and they arrived two days late. The sound quality is great, but the packaging was damaged. Customer support was helpful and replaced the box.""",
)

# Multiple prompt inputs
num_prompts = st.number_input("How many prompts to test?", min_value=1, max_value=10, value=3)
prompts = []
for i in range(num_prompts):
    prompt = st.text_input(f"Prompt {i+1}", key=f"prompt_{i}")
    if prompt:
        prompts.append(prompt)

# Run evaluation
if st.button("🚀 Evaluate Prompts"):
    results = []
    for idx, prompt_text in enumerate(prompts):
        full_prompt = f"{prompt_text}\n\n{sample_text}"
        try:
            response = model.generate_content(full_prompt)
            output = response.text.strip()
        except Exception as e:
            output = f"Error: {e}"

        results.append({
            "Prompt #": idx + 1,
            "Prompt Used": prompt_text,
            "Model Output": output
        })

    df = pd.DataFrame(results)
    st.dataframe(df)

    # Download results
    csv = df.to_csv(index=False).encode("utf-8")
    st.download_button("Download CSV", csv, "prompt_results.csv", "text/csv")