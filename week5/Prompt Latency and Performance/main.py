import os
import time
import asyncio
from concurrent.futures import ThreadPoolExecutor
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
import google.generativeai as genai
from dotenv import load_dotenv

# ==========================================================================
# PART 1: SETUP AND BASIC LATENCY MEASUREMENT
# ==========================================================================

# Task 1.1: API Configuration
load_dotenv()
GOOGLE_API_KEY = os.getenv("GEMINI_API_KEY")

if not GOOGLE_API_KEY:
    # Agar .env file me key na ho toh aap direct yahan paste kar sakte hain
    GOOGLE_API_KEY = "YOUR_API_KEY_HERE"

genai.configure(api_key=GOOGLE_API_KEY)

# Using gemini-3.8-flash (or gemini-1.5-pro / gemini-pro as per availability)
model = genai.GenerativeModel("gemini-flash-lite-latest")
print("API configured and model loaded!")


# Task 1.2: Basic Prompt Latency Test
num_runs = 30
simple_prompt = "Tell me a very short, one-sentence story."
latencies_simple = []
responses_simple = []

print(f"\nRunning {num_runs} tests for simple prompt...")
for i in range(num_runs):
    start_time = time.time()
    try:
        response = model.generate_content(simple_prompt)
        end_time = time.time()
        latency = end_time - start_time
        latencies_simple.append(latency)
        responses_simple.append(response.text.strip())
        print(f"Run {i+1}: Latency = {latency:.4f} seconds")
    except Exception as e:
        print(f"Run {i+1}: Error - {e}")
        latencies_simple.append(np.nan)

df_simple = pd.DataFrame({"latency": latencies_simple})
print("\n--- Results for Simple Prompt ---")
print(df_simple.describe())

# Plotting Latency Distribution
plt.figure(figsize=(8, 5))
sns.histplot(df_simple['latency'].dropna(), kde=True)
plt.title('Distribution of Latency for Simple Prompt')
plt.xlabel('Latency (seconds)')
plt.ylabel('Frequency')
plt.grid(True)
plt.show()

print("\n--- Sample Responses ---")
for i, resp in enumerate(responses_simple[:5]):
    print(f"Response {i+1}: {resp}")


# ==========================================================================
# PART 2: IMPACT OF PROMPT COMPLEXITY AND LENGTH
# ==========================================================================

# Task 2.1: Varying Prompt Length
num_runs_length = 20
prompts_by_length = {
    "short": "Define AI.",
    "medium": "Explain the concept of machine learning in simple terms, providing a real-world example.",
    "long": "Elaborate on the historical development of artificial intelligence, starting from its early conceptualization in the mid-20th century, discussing key milestones, influential figures, and significant breakthroughs that have shaped the field into what it is today. Also, touch upon the ethical implications of AI development and its potential future impact on society. Aim for about 200-300 words."
}

results_length = []

for length_type, prompt_text in prompts_by_length.items():
    print(f"\nRunning tests for {length_type} prompt ({len(prompt_text)} chars)...")
    for i in range(num_runs_length):
        start_time = time.time()
        try:
            response = model.generate_content(prompt_text)
            end_time = time.time()
            latency = end_time - start_time
            results_length.append({
                "prompt_type": length_type,
                "latency": latency,
                "input_length_chars": len(prompt_text),
                "output_length_chars": len(response.text.strip())
            })
        except Exception as e:
            print(f"  Run {i+1}: Error - {e}")
            results_length.append({
                "prompt_type": length_type,
                "latency": np.nan,
                "input_length_chars": len(prompt_text),
                "output_length_chars": np.nan
            })

df_length = pd.DataFrame(results_length)
print("\n--- Results for Prompt Length Variation ---")
print(df_length.groupby('prompt_type')['latency'].describe())

# Boxplot for Latency by Prompt Length
plt.figure(figsize=(10, 6))
sns.boxplot(x='prompt_type', y='latency', data=df_length.dropna())
plt.title('Latency by Prompt Length')
plt.xlabel('Prompt Type')
plt.ylabel('Latency (seconds)')
plt.grid(True)
plt.show()

# Scatter Plot: Input Length vs Latency
plt.figure(figsize=(10, 6))
sns.scatterplot(x='input_length_chars', y='latency', hue='prompt_type', data=df_length.dropna())
plt.title('Latency vs. Input Prompt Length (Characters)')
plt.xlabel('Input Prompt Length (Characters)')
plt.ylabel('Latency (seconds)')
plt.grid(True)
plt.show()


# Task 2.2: Varying Prompt Complexity
num_runs_complexity = 20
prompts_by_complexity = {
    "factual": "What is the capital of France?",
    "creative": "Write a 1-sentence poetic description of a sunset.",
    "reasoning": "If all A are B, and some B are C, can we conclude that some A are C? Explain your reasoning in one short paragraph."
}

results_complexity = []

for comp_type, prompt_text in prompts_by_complexity.items():
    print(f"\nRunning tests for {comp_type} prompt...")
    for i in range(num_runs_complexity):
        start_time = time.time()
        try:
            response = model.generate_content(prompt_text)
            end_time = time.time()
            latency = end_time - start_time
            results_complexity.append({
                "prompt_type": comp_type,
                "latency": latency,
                "input_length_chars": len(prompt_text),
                "output_length_chars": len(response.text.strip())
            })
        except Exception as e:
            print(f"  Run {i+1}: Error - {e}")
            results_complexity.append({
                "prompt_type": comp_type,
                "latency": np.nan,
                "input_length_chars": len(prompt_text),
                "output_length_chars": np.nan
            })

df_complexity = pd.DataFrame(results_complexity)
print("\n--- Results for Prompt Complexity Variation ---")
print(df_complexity.groupby('prompt_type')['latency'].describe())

# Boxplot for Latency by Prompt Complexity
plt.figure(figsize=(10, 6))
sns.boxplot(x='prompt_type', y='latency', data=df_complexity.dropna())
plt.title('Latency by Prompt Complexity')
plt.xlabel('Prompt Type')
plt.ylabel('Latency (seconds)')
plt.grid(True)
plt.show()


# ==========================================================================
# PART 3: CONCURRENCY AND RATE LIMITS
# ==========================================================================

# Task 3.1: Sequential vs. Concurrent Requests
num_batch_requests = 10
prompt_for_batch = "Generate a random fact."

# Sequential Execution
print("\n--- Running Sequential Requests ---")
sequential_latencies = []
start_total_seq = time.time()

for i in range(num_batch_requests):
    start_call = time.time()
    try:
        response = model.generate_content(prompt_for_batch)
        end_call = time.time()
        sequential_latencies.append(end_call - start_call)
    except Exception as e:
        print(f"Sequential request {i+1} error: {e}")
        sequential_latencies.append(np.nan)

end_total_seq = time.time()
total_time_sequential = end_total_seq - start_total_seq
print(f"Total time for {num_batch_requests} sequential requests: {total_time_sequential:.4f} seconds")

# Concurrent Execution
print("\n--- Running Concurrent Requests (ThreadPoolExecutor) ---")
concurrent_latencies = []

def make_api_call(prompt):
    start_call = time.time()
    try:
        response = model.generate_content(prompt)
        end_call = time.time()
        return end_call - start_call
    except Exception as e:
        print(f"Concurrent request error: {e}")
        return np.nan

start_total_conc = time.time()
with ThreadPoolExecutor(max_workers=5) as executor:
    futures = [executor.submit(make_api_call, prompt_for_batch) for _ in range(num_batch_requests)]
    for future in futures:
        concurrent_latencies.append(future.result())

end_total_conc = time.time()
total_time_concurrent = end_total_conc - start_total_conc

print(f"Total time for {num_batch_requests} concurrent requests: {total_time_concurrent:.4f} seconds")
print("\n--- Comparison ---")
print(f"Speedup (Sequential / Concurrent): {total_time_sequential / total_time_concurrent:.2f}x")


# Task 3.2: Observing Rate Limiting
num_aggressive_requests = 50  # Reduced slightly to prevent hard account bans
prompt_aggressive = "Generate a single random word."
aggressive_results = []

print(f"\n--- Attempting Rate Limit Test with {num_aggressive_requests} requests ---")
for i in range(num_aggressive_requests):
    start_time = time.time()
    try:
        response = model.generate_content(prompt_aggressive)
        end_time = time.time()
        latency = end_time - start_time
        aggressive_results.append({"status": "success", "latency": latency})
    except Exception as e:
        end_time = time.time()
        latency = end_time - start_time
        aggressive_results.append({"status": "error", "latency": latency, "error_message": str(e)})
        print(f"Request {i+1} failed: {e}")

df_aggressive = pd.DataFrame(aggressive_results)
print("\n--- Aggressive Test Results ---")
print(df_aggressive['status'].value_counts())
if 'error' in df_aggressive['status'].values:
    print(df_aggressive.loc[df_aggressive['status'] == 'error', 'error_message'].value_counts())