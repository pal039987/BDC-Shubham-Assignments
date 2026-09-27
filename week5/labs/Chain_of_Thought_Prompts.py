# 🔹 Step 1: Install Required Package


# !pip install -q google-generativeai

     
# 🔹 Step 2: Import and Configure Gemini


import google.generativeai as genai

# Configure with your Gemini API key
from dotenv import load_dotenv

load_dotenv()
API_KEY = os.environ.get("GEMINI_API_KEY")
if not API_KEY:
    raise RuntimeError("Set the GEMINI_API_KEY environment variable before running.")

genai.configure(api_key=API_KEY)  

     
# 🔹 Step 3: Load Gemini Flash Model We’ll use gemini-1.5-flash-latest for fast and affordable responses.


# Load Gemini Flash model
model = genai.GenerativeModel(model_name="gemini-flash-lite-latest")

     
# 🔹 Step 4: Define a Simple Math Problem


math_question = "If a train travels 60 miles in 1.5 hours, what is its average speed?"

     
# 🔹 Step 5: Direct (Non-CoT) Prompt


# Simple prompt with no explanation
direct_prompt = f"Answer the following math question:\n\n{math_question}"

# Get response
direct_response = model.generate_content(direct_prompt)
print("📌 Direct Answer:\n", direct_response.text)

     
# 📌 Direct Answer:
#  Average speed is calculated by dividing the total distance by the total time.

# Average speed = Total distance / Total time = 60 miles / 1.5 hours = 40 miles per hour

# 🔹 Step 6: Chain-of-Thought Prompt


# Chain-of-Thought prompt: encourage step-by-step reasoning
cot_prompt = f"""
Let's solve the following math problem step-by-step.

Question: {math_question}

Step 1: Identify what we are trying to find.
Step 2: Recall the formula: speed = distance / time.
Step 3: Plug in the values: speed = 60 miles / 1.5 hours.
Step 4: Calculate the result.

Answer:
"""

cot_response = model.generate_content(cot_prompt)
print("📌 Chain-of-Thought Answer:\n", cot_response.text)