# ✅ Step 1: Install Required Package


# !pip install -q google-generativeai

     
# ✅ Step 2: Import and Configure Gemini API


import google.generativeai as genai

# Replace with your actual Gemini API key
from dotenv import load_dotenv

load_dotenv()
API_KEY = os.environ.get("GEMINI_API_KEY")
if not API_KEY:
    raise RuntimeError("Set the GEMINI_API_KEY environment variable before running.")

genai.configure(api_key=API_KEY)

     
# ✅ Step 3: Load Gemini Flash Model


# Load the fast Gemini model
model = genai.GenerativeModel(model_name="gemini-flash-lite-latest")

     
# ✅ Step 4: Code Generation Prompt Example


# Prompt Gemini to generate code
prompt_generate = """
Write a Python function that takes a list of numbers and returns the sum of even numbers.
"""

response_generate = model.generate_content(prompt_generate)
print("📌 Generated Code:\n")
print(response_generate.text)
 
# ✅ Step 5: Faulty Code Debugging Prompt Example


# Simulate a faulty function
buggy_code = """
def add_even_numbers(numbers):
    total = 0
    for num in numbers:
        if num % 2 == 1:
            total += num
    return total
"""

prompt_debug = f"""
The following Python function is supposed to return the sum of even numbers in a list.
However, it gives the wrong result. Find the bug and fix it.

Code:
{buggy_code}
"""

response_debug = model.generate_content(prompt_debug)
print("🐞 Debugged Code:\n")
print(response_debug.text)

# ✅ Step 6: Ask for Explanation and Optimization


# Ask Gemini to explain and optimize code
prompt_explain_optimize = f"""
Explain what the following code does and suggest any optimizations.

Code:
{buggy_code}
"""

response_explain = model.generate_content(prompt_explain_optimize)
print("📘 Explanation & Suggestions:\n")
print(response_explain.text)

# ✅ Step 7: Wrap It Into a Reusable Assistant Function


def code_assistant(task: str, code: str = ""):
    if task == "generate":
        prompt = "Write a Python function that checks if a number is prime."
    elif task == "debug":
        prompt = f"The following code has a bug. Fix it:\n\n{code}"
    elif task == "explain":
        prompt = f"Explain and improve this code:\n\n{code}"
    else:
        raise ValueError("Invalid task")

    response = model.generate_content(prompt)
    return response.text

# Try it out
print(code_assistant("generate"))

