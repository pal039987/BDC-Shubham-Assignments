# 🔹 Step 1: Install Gemini SDK


# !pip install -q google-generativeai

     
# 🔹 Step 2: Import Libraries and Configure Gemini API


import os
import google.generativeai as genai
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

     
# 🔹 Step 4: Create a Prompt Template for Q&A


def build_prompt(question: str) -> str:
    """
    Constructs a prompt for Q&A based on the user's question.
    """
    return f"""You are a helpful assistant. Answer the following question clearly and concisely.

Question: {question}
Answer:"""

     
# 🔹 Step 5: Define a Q&A Function


def ask_question(question: str) -> str:
    """
    Sends the formatted prompt to Gemini and returns the answer.
    """
    prompt = build_prompt(question)
    response = model.generate_content(prompt)
    return response.text.strip()

     
# 🔹 Step 6: Test with a Single Question


question = "What is the difference between AI and  gen ai , give me short answer?"
answer = ask_question(question)

print("❓ Question:", question)
print("💬 Answer:", answer)

print("🤖 Welcome to the Gemini Q&A Chatbot! (Type 'exit' to quit)")

while True:
    user_question = input("You: ")
    if user_question.lower() in ["exit", "quit"]:
        print("👋 Goodbye!")
        break
    answer = ask_question(user_question)
    print("Gemini:", answer)

# gradio chatbot

# !pip install -q google-generativeai gradio

import gradio as gr

def build_prompt(question: str) -> str:
    """
    Wraps user input into a consistent Q&A prompt.
    """
    return f"""You are a helpful assistant. Answer the following question clearly and concisely.

Question: {question}
Answer:"""

def gemini_qa(question: str) -> str:
    """
    Sends the prompt to Gemini and returns the response.
    """
    if not question.strip():
        return "Please enter a question."

    prompt = build_prompt(question)
    try:
        response = model.generate_content(prompt)
        return response.text.strip()
    except Exception as e:
        return f"⚠️ Error: {e}"

# Create the Gradio app
interface = gr.Interface(
    fn=gemini_qa,
    inputs=gr.Textbox(lines=2, placeholder="Ask a question..."),
    outputs=gr.Textbox(label="Gemini's Answer"),
    title="🧠 Gemini Q&A Chatbot",
    description="Ask anything! Powered by Gemini Flash."
)

# Launch the app
interface.launch()

