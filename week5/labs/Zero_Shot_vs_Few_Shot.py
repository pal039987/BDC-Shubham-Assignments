# 🔹 Step 1: Install Required Packages 
# !pip install -q google-generativeai
     
# 🔹 Step 2: Import Required Libraries

import google.generativeai as genai
     
# 🔹 Step 3: Configure Gemini API

# Replace with your actual Gemini API key
from dotenv import load_dotenv

load_dotenv()
API_KEY = os.environ.get("GEMINI_API_KEY")
if not API_KEY:
    raise RuntimeError("Set the GEMINI_API_KEY environment variable before running.")

genai.configure(api_key=API_KEY)
     
# 🔹 Step 4: Load Gemini Model

model = genai.GenerativeModel(model_name="gemini-flash-lite-latest")
     
# 🔹 Step 5: Define a Sample Article for Summarization

long_article = """
Artificial Intelligence (AI) is a field of computer science focused on creating systems capable of performing tasks that require human intelligence.
This includes problem-solving, speech recognition, decision-making, and visual perception.
Over the past decade, advances in machine learning and neural networks have led to rapid developments in AI, with applications across many industries.
From personalized recommendations on streaming platforms to autonomous vehicles and medical diagnostics, AI continues to reshape modern society.
However, ethical concerns, data bias, and job displacement remain significant challenges to address as AI adoption increases.
"""

# 🔹 Step 6: Zero-Shot Prompt

# Zero-shot: No examples, just an instruction
zero_shot_prompt = f"Summarize the following article:\n\n{long_article}"

zero_shot_response = model.generate_content(zero_shot_prompt)
print("📌 Zero-Shot Summary:\n", zero_shot_response.text)
     
# 📌 Zero-Shot Summary:
#  Artificial intelligence (AI) uses computer science to create systems mimicking human intelligence, such as problem-solving and perception.  Recent advancements in machine learning have driven rapid AI development and widespread adoption across various sectors. While AI offers benefits like personalized services and medical breakthroughs, ethical concerns, biased data, and potential job losses require careful consideration.

# 🔹 Step 7: Few-Shot Prompt with Examples

# Few-shot: Add 1–2 examples before giving the real task

few_shot_prompt = f"""
Summarize the following article concisely.

Example 1:
Article: Artificial Intelligence is the simulation of human intelligence in machines. It includes learning, reasoning, and self-correction. AI is widely used in healthcare, finance, and transportation.
Summary: AI simulates human intelligence and is used across industries like healthcare and finance.

Example 2:
Article: Climate change is caused by greenhouse gas emissions from activities like burning fossil fuels. It leads to rising temperatures, sea level rise, and extreme weather patterns.
Summary: Climate change is driven by emissions and results in environmental disruptions.

Now summarize this:
Article: {long_article}
Summary:
"""
few_shot_response = model.generate_content(few_shot_prompt)
print("📌 Few-Shot Summary:\n", few_shot_response.text)