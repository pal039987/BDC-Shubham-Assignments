import os
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI

# Load environment variables from .env file
load_dotenv()

# Get the API key
api_key = os.getenv("GOOGLE_API_KEY")

if not api_key:
    print("❌ GOOGLE_API_KEY not found in .env file!")
else:
    print("✅ API key loaded successfully.")

    # Initialize the Gemini model
    llm = ChatGoogleGenerativeAI(
        model="gemini-flash-lite-latest",
        google_api_key=api_key
    )

    # Send a simple test message
    response = llm.invoke("Say hello in one short sentence.")
    print("Gemini Response:", response.content)