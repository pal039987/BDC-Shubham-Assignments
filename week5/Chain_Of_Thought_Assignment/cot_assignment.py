import google.generativeai as genai
import os
import time
from google.api_core.exceptions import ResourceExhausted
from dotenv import load_dotenv

# ==========================================
# Part 1: LLM API Setup
# ==========================================

load_dotenv()
API_KEY = os.environ.get("GEMINI_API_KEY")
if not API_KEY:
    raise RuntimeError("Set the GEMINI_API_KEY environment variable before running.")

genai.configure(api_key=API_KEY)
model = genai.GenerativeModel('gemini-flash-lite-latest')
print("LLM API setup ready.")

REQUEST_DELAY_SECONDS = 13


def generate_response(prompt):
    """Generate a response without crashing when the free-tier quota is exhausted."""
    try:
        return model.generate_content(prompt).text
    except ResourceExhausted:
        print("Gemini quota exhausted. Skipping this request; try again later.")
        return "[No response: Gemini API quota exhausted]"

# ==========================================
# Part 2: Math Problems
# ==========================================
problems = [
    "If a box contains 15 red balls and 8 blue balls, how many balls are there in total?",
    "Emily started with 50 stickers. She gave 12 to her friend and bought 7 more. How many stickers does Emily have now?",
    "A car travels at 70 miles per hour for 3 hours. How far does it travel?",
    "A school has 6 classes, and each class has 25 students. If 10 students are absent today, how many students are present?"
]

# ==========================================
# Part 3: Prompting Strategies and Implementation
# ==========================================

# ------------------------------------------
# 3.1: Zero-Shot Prompting (Baseline)
# ------------------------------------------
def zero_shot_prompt(problem):
    prompt = f"Solve the following math problem and provide only the final answer:\nQuestion: {problem}"
    return generate_response(prompt)

print("\n=== 3.1 Zero-Shot Prompting Results ===")
for i, problem in enumerate(problems, 1):
    print(f"Problem {i}: {problem}")
    print(f"Response: {zero_shot_prompt(problem).strip()}\n")
    time.sleep(REQUEST_DELAY_SECONDS)  # Stay below the free-tier request limit

"""
Question 3.1.1: Briefly comment on the performance of zero-shot prompting. For which problem types (simple vs. multi-step) does it perform best/worst?
Your Answer:
Zero-shot prompting performs best on simple, single-step arithmetic problems (like Problem 1 and Problem 3) where the answer can be directly computed in one logical step. It is most prone to errors or logical skips in multi-step problems (like Problem 2 and Problem 4), as the model attempts to jump directly to the final answer without laying out intermediate logic.
"""

# ------------------------------------------
# 3.2: Zero-Shot CoT Prompting ("Let's think step by step")
# ------------------------------------------
def zero_shot_cot_prompt(problem):
    prompt = f"Question: {problem}\nLet's think step by step."
    return generate_response(prompt)

print("\n=== 3.2 Zero-Shot CoT Prompting Results ===")
for i, problem in enumerate(problems, 1):
    print(f"Problem {i}: {problem}")
    print(f"Response:\n{zero_shot_cot_prompt(problem).strip()}\n" + "-"*40)
    time.sleep(REQUEST_DELAY_SECONDS)

"""
Question 3.2.1: How does the LLM's response change with this simple CoT phrase? Does it seem more accurate or transparent?
Your Answer:
Adding 'Let's think step by step' dramatically changes the output format from a direct answer to an explicit explanation of each reasoning step. The response becomes much more transparent, allowing users to verify how calculations were made. It significantly improves accuracy for multi-step problems by forcing the model to calculate intermediate variables before producing the final result.
"""

# ------------------------------------------
# 3.3: Few-Shot CoT Prompting
# ------------------------------------------
def few_shot_cot_prompt(problem):
    few_shot_examples = """
Question: A box has 7 red pens and 3 blue pens. How many pens are there in total?
Reasoning: To find the total, I add the number of red pens and blue pens.
Calculation: 7 + 3 = 10.
Answer: 10 pens.

Question: A baker made 40 cupcakes. He sold 15 in the morning and baked 20 more in the afternoon. How many cupcakes does he have now?
Reasoning: First, subtract the cupcakes sold from the initial amount. Then, add the new cupcakes baked in the afternoon.
Calculation: 40 - 15 = 25; 25 + 20 = 45.
Answer: 45 cupcakes.
"""
    prompt = f"{few_shot_examples}\nQuestion: {problem}\nReasoning:"
    return generate_response(prompt)

print("\n=== 3.3 Few-Shot CoT Prompting Results ===")
for i, problem in enumerate(problems, 1):
    print(f"Problem {i}: {problem}")
    print(f"Response:\n{few_shot_cot_prompt(problem).strip()}\n" + "-"*40)
    time.sleep(REQUEST_DELAY_SECONDS)

"""
Question 3.3.1: Compare the structure and accuracy of the few-shot CoT responses with the zero-shot CoT responses. What are the advantages of providing examples?
Your Answer:
Few-Shot CoT yields a highly structured and predictable output that closely mirrors the pattern provided in the examples (Reasoning, Calculation, Answer). Compared to Zero-Shot CoT, which can produce verbose or varying response formats, Few-Shot CoT ensures consistency, makes programmatic response parsing easier, and guides the model to strictly follow a defined problem-solving schema.
"""

# ==========================================
# Part 4: Conclusion
# ==========================================
"""
Question 4.1: Summarize your key takeaway about the effectiveness of CoT prompting for math Q&A. When would you choose few-shot CoT over zero-shot CoT, and vice-versa?
Your Answer:
Chain-of-Thought (CoT) prompting is crucial for complex, multi-step math problems because it breaks down reasoning into sequential logical steps, preventing hallucinated calculation jumps.

- Choose Few-Shot CoT when: You need standardized, structured outputs (e.g., for automated parsing), high accuracy on complex domain-specific tasks, or consistent formatting across all model outputs.
- Choose Zero-Shot CoT when: You want a simple implementation without spending extra tokens on examples, or when building quick interactive prompts where dynamic flexibility is preferred over strict output formatting.
"""