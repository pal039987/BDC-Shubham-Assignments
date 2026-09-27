import streamlit as st
import google.generativeai as genai
import os
from dotenv import load_dotenv

# Load API key from .env file
load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")

genai.configure(api_key=api_key)

model = genai.GenerativeModel("gemini-3.6-flash")


def get_llm_response(prompt):
    try:
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        return f"Error: {str(e)}"


st.set_page_config(page_title="Gemini Chat", page_icon="🤖")

# ---- Custom CSS ----
st.markdown(
    """
    <style>
    /* Page background */
    .stApp {
        background-color: #1e1e2f;
        background-image: linear-gradient(135deg, #1e1e2f 0%, #2b2b45 100%);
    }

    /* Title text color */
    h1 {
        color: #ffffff;
    }

    /* Input label text */
    label {
        color: #ffffff !important;
    }

    /* Answer box - black background, white text */
    .answer-box {
        background-color: #000000;
        color: #ffffff;
        padding: 20px;
        border-radius: 10px;
        font-size: 16px;
        line-height: 1.6;
        margin-top: 15px;
        border: 1px solid #444;
    }
    </style>
    """,
    unsafe_allow_html=True,
)

st.title("🤖 Google Gemini Chatbot")

user_input = st.text_input("Ask something:")

if user_input:
    st.info("Generating response...")
    reply = get_llm_response(user_input)

    # Render answer inside a custom black box with white text
    st.markdown(
        f'<div class="answer-box">{reply}</div>',
        unsafe_allow_html=True,
    )