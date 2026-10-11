# 🔹 Step 1: Install Gemini SDK


# !pip install -q google-generativeai

     
# 🔹 Step 2: Import Libraries and Configure Gemini API


import os
import google.generativeai as genai
from PIL import Image
import IPython.display as display
from dotenv import load_dotenv

# Configure Gemini with your API key


load_dotenv()
API_KEY = os.environ.get("GEMINI_API_KEY")
if not API_KEY:
    raise RuntimeError("Set the GEMINI_API_KEY environment variable before running.")

genai.configure(api_key=API_KEY)

     
# 🔹 Step 3: Load the Multimodal Gemini Model


# Use fast multimodal model
model = genai.GenerativeModel(model_name="gemini-flash-lite-latest")

     
# 🔹 Step 4: Define a Reusable Prompt Template We'll use a Python function with string templates.


def generate_prompt(template: str, **kwargs):
    """
    Fill in a prompt template with keyword arguments.

    Args:
        template (str): A prompt with {placeholders}.
        kwargs: Input values to insert into the prompt.

    Returns:
        Filled-in prompt string
    """
    return template.format(**kwargs)

     
# 🔹 Step 5: Example Template for Article Generation


# Define the reusable prompt template
article_template = """
Write a {length} article on the topic: "{topic}".
Use a {tone} tone and include real-world examples.
"""

# Provide values for variables
variables = {
    "length": "short",
    "topic": "benefits of daily exercise",
    "tone": "friendly"
}

# Generate filled prompt
filled_prompt = generate_prompt(article_template, **variables)
print("📄 Prompt Sent to Gemini:\n", filled_prompt)

     
# 📄 Prompt Sent to Gemini:
 
# Write a short article on the topic: "benefits of daily exercise".
# Use a friendly tone and include real-world examples.

# 🔹 Step 6: Generate Gemini Response


# Send the filled prompt to Gemini
response = model.generate_content(filled_prompt)
print("🧠 Gemini's Response:\n", response.text)

#  Step 7: More Templates – Translation Example


translation_template = "Translate the following sentence to {language}:\n\n\"{sentence}\""

translation_prompt = generate_prompt(
    translation_template,
    language="French",
    sentence="Learning new languages is fun!"
)

print("🌐 Translation Prompt:\n", translation_prompt)

# Get translation
translation_response = model.generate_content(translation_prompt)
print("🗣️ Translation:\n", translation_response.text)

# 🔹 Step 8: Wrap Into a General Prompt Assistant


def gemini_prompt_assistant(template: str, **kwargs):
    prompt = generate_prompt(template, **kwargs)
    response = model.generate_content(prompt)
    return response.text

# Try generating a summary
summary_template = "Summarize the following passage in {style} style:\n\n{passage}"
summary_output = gemini_prompt_assistant(
    summary_template,
    style="bullet-point",
    passage="Artificial Intelligence is transforming industries such as healthcare, finance, and transportation. It automates tasks and helps make smarter decisions."
)

print("📝 Bullet Summary:\n", summary_output)