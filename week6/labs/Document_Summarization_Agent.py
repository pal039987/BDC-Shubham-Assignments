import os
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI

# Load API key securely from .env
load_dotenv()

# Load Gemini 1.5 Flash
llm = ChatGoogleGenerativeAI(model="gemini-flash-lite-latest", temperature=0.3)

# Sample text (you can also load from a file)
text = """
Artificial Intelligence (AI) is rapidly transforming many aspects of our lives, including healthcare, education, and business.
By automating tasks, providing decision support, and enabling personalization, AI technologies are improving efficiency
and driving innovation. However, there are also ethical concerns such as privacy, bias, and job displacement that need to be addressed.
"""

# Build a summarization prompt directly
prompt = f"Summarize the following text in 2-3 concise sentences:\n\n{text}"

# Call the LLM directly
response = llm.invoke(prompt)

# Show the summary
print("📄 Document Summary:\n")
print(response.content)