import os
import subprocess
from dotenv import load_dotenv
import google.generativeai as genai

# ---- Load API key ----
load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=api_key)

model_gemini = genai.GenerativeModel("gemini-flash-lite-latest")


def call_llm_api(prompt: str, max_tokens: int = 800, temperature: float = 0.3) -> str:
    """Calls the Gemini API and returns the generated text."""
    try:
        response = model_gemini.generate_content(
            prompt,
            generation_config=genai.types.GenerationConfig(
                max_output_tokens=max_tokens,
                temperature=temperature,
            ),
        )
        return response.text
    except Exception as e:
        return f"[LLM ERROR: {e}]"


def extract_code_block(text: str, language: str = "python") -> str:
    """Extracts the first code block from an LLM response (```lang ... ```)."""
    markers = [f"```{language}", "```"]
    for marker in markers:
        if marker in text:
            start = text.find(marker) + len(marker)
            end = text.find("```", start)
            if end != -1:
                return text[start:end].strip()
    return text.strip()


def section(title):
    print("\n\n" + "=" * 70)
    print(title)
    print("=" * 70)


# =====================================================
# PART 1: CODE GENERATION
# =====================================================

# ---- Task 1.1: Basic Function Generation ----
section("TASK 1.1: Basic Function Generation (Python)")

prompt_1_1 = (
    "Write a Python function that takes a list of numbers as input and "
    "returns the sum of all even numbers in the list. Include a docstring "
    "and type hints. Return ONLY the code in a python code block."
)
response_1_1 = call_llm_api(prompt_1_1)
print("Prompt:\n", prompt_1_1)
print("\nLLM Response:\n", response_1_1)

code_1_1 = extract_code_block(response_1_1, "python")
print("\n--- Executing generated code ---")
try:
    exec_globals = {}
    exec(code_1_1, exec_globals)
    sum_even_numbers = exec_globals.get("sum_even_numbers")
    if sum_even_numbers:
        print("sum_even_numbers([1,2,3,4,5,6]) =", sum_even_numbers([1, 2, 3, 4, 5, 6]))
        print("sum_even_numbers([]) =", sum_even_numbers([]))
        print("sum_even_numbers([2,4,6]) =", sum_even_numbers([2, 4, 6]))
    else:
        print("Function 'sum_even_numbers' not found in generated code.")
except Exception as e:
    print(f"Execution error: {e}")


# ---- Task 1.2: Intermediate Algorithm Generation (C++) ----
section("TASK 1.2: Merge Sort in C++")

prompt_1_2 = (
    "Generate a C++ program that implements the Merge Sort algorithm for an "
    "array of integers. Include a main function to test the sort with a "
    "sample array and print the sorted output. Return ONLY the code in a "
    "cpp code block."
)
response_1_2 = call_llm_api(prompt_1_2)
print("Prompt:\n", prompt_1_2)
print("\nLLM Response:\n", response_1_2)

code_1_2 = extract_code_block(response_1_2, "cpp")
with open("merge_sort.cpp", "w") as f:
    f.write(code_1_2)

print("\n--- Attempting to compile & run (requires g++) ---")
try:
    compile_result = subprocess.run(
        ["g++", "merge_sort.cpp", "-o", "merge_sort"],
        capture_output=True, text=True, timeout=20
    )
    if compile_result.returncode != 0:
        print("Compilation failed:\n", compile_result.stderr)
    else:
        run_result = subprocess.run(["./merge_sort"], capture_output=True, text=True, timeout=10)
        print("Program output:\n", run_result.stdout)
except FileNotFoundError:
    print("g++ not found on this system. Install it with: sudo apt install g++")
except Exception as e:
    print(f"Error running C++ code: {e}")


# ---- Task 1.3: Code with requests library ----
section("TASK 1.3: Fetch data using requests library")

prompt_1_3 = (
    "Using Python's requests library, write a script that fetches data from "
    "'https://jsonplaceholder.typicode.com/posts/1', parses the JSON response, "
    "and prints the 'title' and 'body' fields. Handle potential network errors "
    "gracefully. Return ONLY the code in a python code block."
)
response_1_3 = call_llm_api(prompt_1_3)
print("Prompt:\n", prompt_1_3)
print("\nLLM Response:\n", response_1_3)

code_1_3 = extract_code_block(response_1_3, "python")
print("\n--- Executing generated code ---")
try:
    exec(code_1_3, {})
except Exception as e:
    print(f"Execution error: {e}")


# =====================================================
# PART 2: CODE DEBUGGING
# =====================================================

# ---- Task 2.1: Semantic Error Debugging ----
section("TASK 2.1: Semantic Error Debugging (average function)")

buggy_code_2_1 = '''def calculate_average(numbers):
    total = 0
    for num in numbers:
        total += num
    return total / len(numbers) if len(numbers) > 0 else 0

data = [1, 2, 3, 4, 5, 0]
print(calculate_average(data))
'''

print("--- Original buggy code output ---")
exec(buggy_code_2_1, {})

prompt_2_1 = (
    "The following Python code is supposed to calculate the average of a "
    "list of numbers, but it sometimes produces incorrect results. Identify "
    "the semantic error and provide the corrected code. Explain your reasoning.\n\n"
    f"```python\n{buggy_code_2_1}\n```"
)
response_2_1 = call_llm_api(prompt_2_1)
print("\nLLM Response:\n", response_2_1)

code_2_1_fixed = extract_code_block(response_2_1, "python")
print("\n--- Executing corrected code ---")
try:
    exec_globals = {}
    exec(code_2_1_fixed, exec_globals)
    corrected_fn = exec_globals.get("calculate_average")
    if corrected_fn:
        print("corrected_calculate_average([1,2,3,4,5,0]) =", corrected_fn([1, 2, 3, 4, 5, 0]))
        print("corrected_calculate_average([]) =", corrected_fn([]))
        print("corrected_calculate_average([10,20,30]) =", corrected_fn([10, 20, 30]))
except Exception as e:
    print(f"Execution error: {e}")


# ---- Task 2.2: Syntax Error Debugging (JavaScript) ----
section("TASK 2.2: Syntax Error Debugging (JavaScript)")

buggy_code_2_2 = '''function greet(name) {
    console.log('Hello, ' + name + '!');
}

greet("Alice"
'''

prompt_2_2 = (
    "The following JavaScript code has a syntax error. Please identify the "
    "error and provide the corrected code. Explain what was wrong.\n\n"
    f"```javascript\n{buggy_code_2_2}\n```"
)
response_2_2 = call_llm_api(prompt_2_2)
print("Buggy code:\n", buggy_code_2_2)
print("\nLLM Response:\n", response_2_2)

code_2_2_fixed = extract_code_block(response_2_2, "javascript")
with open("greet.js", "w") as f:
    f.write(code_2_2_fixed)

print("\n--- Attempting to run with Node.js ---")
try:
    result = subprocess.run(["node", "greet.js"], capture_output=True, text=True, timeout=10)
    print("Output:\n", result.stdout or result.stderr)
except FileNotFoundError:
    print("Node.js not found. Install it with: sudo apt install nodejs")
except Exception as e:
    print(f"Error running JS code: {e}")


# ---- Task 2.3: Logic Error Debugging (factorial) ----
section("TASK 2.3: Logic Error Debugging (factorial)")

buggy_code_2_3 = '''def factorial(n):
    if n == 0:
        return 1
    else:
        result = n
        for i in range(n):  # Incorrect loop range
            result *= i
        return result

print(factorial(5))  # Expected: 120
'''

print("--- Original buggy code output ---")
exec(buggy_code_2_3, {})

prompt_2_3 = (
    "The following Python function for calculating factorial produces "
    "incorrect results for positive integers. Identify and fix the logical "
    "error. Provide the corrected code and explain the mistake.\n\n"
    f"```python\n{buggy_code_2_3}\n```"
)
response_2_3 = call_llm_api(prompt_2_3)
print("\nLLM Response:\n", response_2_3)

code_2_3_fixed = extract_code_block(response_2_3, "python")
print("\n--- Executing corrected code ---")
try:
    exec_globals = {}
    exec(code_2_3_fixed, exec_globals)
    corrected_factorial = exec_globals.get("factorial")
    if corrected_factorial:
        print("factorial(5) =", corrected_factorial(5))
        print("factorial(0) =", corrected_factorial(0))
        print("factorial(1) =", corrected_factorial(1))
        print("factorial(3) =", corrected_factorial(3))
except Exception as e:
    print(f"Execution error: {e}")


# =====================================================
# PART 3: ADVANCED SCENARIOS
# =====================================================

# ---- Task 3.1: Multi-turn Interaction for Refinement ----
section("TASK 3.1: Multi-turn Refinement (CSV filter script)")

initial_prompt = "Write a Python script to filter a CSV file based on a column value."
initial_response = call_llm_api(initial_prompt)
print("Initial Prompt:\n", initial_prompt)
print("\nInitial Response:\n", initial_response)

refinement_1_prompt = (
    "Now, modify the script to allow the user to specify the input and output "
    "filenames, the column name, and the filter value as command-line arguments "
    "using argparse.\n\nPrevious code:\n" + initial_response
)
refinement_1_response = call_llm_api(refinement_1_prompt)
print("\n\nRefinement 1 Prompt:\n", refinement_1_prompt[:200], "...")
print("\nRefinement 1 Response:\n", refinement_1_response)

# Intentionally introduce a bug for the LLM to fix
buggy_refined_code = extract_code_block(refinement_1_response, "python").replace(
    "args.column", "args.colum"  # typo introduced intentionally
)
refinement_2_prompt = (
    "The following script throws an AttributeError when run. Identify and fix "
    "the bug.\n\n```python\n" + buggy_refined_code + "\n```"
)
refinement_2_response = call_llm_api(refinement_2_prompt)
print("\n\nRefinement 2 (Debugging) Prompt:\n", refinement_2_prompt[:200], "...")
print("\nRefinement 2 Response:\n", refinement_2_response)


# ---- Task 3.2: Limitations and Biases ----
section("TASK 3.2: Limitations and Biases Experiment")

niche_prompt = (
    "Write a program in Brainfuck that prints 'Hello, World!' to the console. "
    "Explain how the program works step by step."
)
niche_response = call_llm_api(niche_prompt)
print("Prompt:\n", niche_prompt)
print("\nLLM Response:\n", niche_response)

print("\n\nAll tasks complete. Review the printed outputs above for your notebook write-up.")