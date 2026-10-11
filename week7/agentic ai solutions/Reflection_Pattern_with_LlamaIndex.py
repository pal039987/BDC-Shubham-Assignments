# ============================================================
# STEP 1: INSTALL REQUIRED LIBRARIES
# ============================================================

# Run this once if packages are not installed.
# You can also install them from terminal instead.

# !pip install -q -U \
#     llama-index \
#     llama-index-llms-google-genai \
#     llama-index-embeddings-huggingface \
#     python-dotenv


# ============================================================
# STEP 2: IMPORT REQUIRED MODULES
# ============================================================

import os
from pathlib import Path

from dotenv import load_dotenv

from llama_index.core import (
    VectorStoreIndex,
    SimpleDirectoryReader,
    Settings,
)

from llama_index.embeddings.huggingface import HuggingFaceEmbedding
from llama_index.llms.google_genai import GoogleGenAI

from llama_index.core.evaluation import (
    CorrectnessEvaluator,
    FaithfulnessEvaluator,
)


# ============================================================
# STEP 3: LOAD .ENV
# ============================================================

load_dotenv()

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

if not GOOGLE_API_KEY:
    raise ValueError(
        "GOOGLE_API_KEY not found in .env file.\n"
        "Please create a .env file containing:\n"
        "GOOGLE_API_KEY=YOUR_API_KEY"
    )

print("Google API key loaded successfully.")


# ============================================================
# STEP 4: INITIALIZE GEMINI
# ============================================================

llm = GoogleGenAI(
    model="gemini-flash-lite-latest",
    api_key=GOOGLE_API_KEY,
    temperature=0.3,
)


# ============================================================
# STEP 5: TEST GEMINI
# ============================================================

try:
    test_response = llm.complete(
        "Hello, are you working? Reply with a short confirmation."
    )

    print("\nGemini API test successful.")
    print("Response:")
    print(test_response.text)

except Exception as e:
    raise RuntimeError(
        f"Gemini API test failed: {e}"
    )


# ============================================================
# STEP 6: CREATE DATA DIRECTORY
# ============================================================

data_dir = Path("data")
data_dir.mkdir(exist_ok=True)


# ============================================================
# STEP 7: CREATE HR POLICY FILE
# ============================================================

hr_policy_path = data_dir / "hr_policy.txt"

hr_policy_text = """Company Sick Leave Policy:

Employees are entitled to 10 days of paid sick leave annually.

A medical certificate is required for leaves longer than 2 days.

Unused sick leave can be carried forward to the next year,
up to a maximum of 15 days.
"""

# Create file only if it does not already exist
if not hr_policy_path.exists():
    hr_policy_path.write_text(
        hr_policy_text,
        encoding="utf-8"
    )

print(f"\nHR policy file ready: {hr_policy_path}")


# ============================================================
# STEP 8: CONFIGURE LLAMAINDEX
# ============================================================

Settings.llm = llm

Settings.embed_model = HuggingFaceEmbedding(
    model_name="BAAI/bge-small-en-v1.5"
)


# ============================================================
# STEP 9: LOAD DOCUMENT
# ============================================================

documents = SimpleDirectoryReader(
    str(data_dir)
).load_data()

print(f"Loaded {len(documents)} document(s).")


# ============================================================
# STEP 10: CREATE VECTOR INDEX
# ============================================================

index = VectorStoreIndex.from_documents(
    documents
)

print("Vector index created successfully.")


# ============================================================
# STEP 11: CREATE QUERY ENGINE
# ============================================================

query_engine = index.as_query_engine(
    similarity_top_k=3
)


# ============================================================
# STEP 12: ASK USER QUERY
# ============================================================

query = "What is the company's policy on sick leave?"


# ============================================================
# STEP 13: GENERATE INITIAL ANSWER
# ============================================================

response = query_engine.query(query)

print("\n" + "=" * 60)
print("INITIAL RESPONSE")
print("=" * 60)

print(response.response)


# ============================================================
# STEP 14: DISPLAY SOURCE CONTEXT
# ============================================================

contexts = []

print("\n" + "=" * 60)
print("SOURCE CONTEXT")
print("=" * 60)

for i, source_node in enumerate(response.source_nodes, start=1):

    context_text = source_node.get_content()

    contexts.append(context_text)

    print(f"\nSource {i}:")
    print(context_text)


# ============================================================
# STEP 15: REFERENCE ANSWER
# ============================================================

reference_answer = """
Employees are entitled to 10 days of paid sick leave annually.
A medical certificate is required for leaves longer than 2 days.
Unused sick leave can be carried forward to the next year,
up to a maximum of 15 days.
""".strip()


# ============================================================
# STEP 16: CREATE EVALUATORS
# ============================================================

correctness_evaluator = CorrectnessEvaluator(
    llm=Settings.llm
)

faithfulness_evaluator = FaithfulnessEvaluator(
    llm=Settings.llm
)


# ============================================================
# STEP 17: CORRECTNESS EVALUATION
# ============================================================

correctness_result = correctness_evaluator.evaluate(
    query=query,
    response=response.response,
    reference=reference_answer,
)


# ============================================================
# STEP 18: FAITHFULNESS EVALUATION
# ============================================================

faithfulness_result = faithfulness_evaluator.evaluate(
    query=query,
    response=response.response,
    contexts=contexts,
)


# ============================================================
# STEP 19: DISPLAY EVALUATION RESULTS
# ============================================================

print("\n" + "=" * 60)
print("REFLECTION / EVALUATION")
print("=" * 60)

print("\nCorrectness:")
print("Passing:", correctness_result.passing)
print("Score:", correctness_result.score)

if correctness_result.feedback:
    print("Feedback:", correctness_result.feedback)


print("\nFaithfulness:")
print("Passing:", faithfulness_result.passing)
print("Score:", faithfulness_result.score)

if faithfulness_result.feedback:
    print("Feedback:", faithfulness_result.feedback)


# ============================================================
# STEP 20: FINAL REFLECTION
# ============================================================

if (
    correctness_result.passing
    and faithfulness_result.passing
):
    print(
        "\nReflection: "
        "The answer is accurate and faithful to the source."
    )
else:
    print(
        "\nReflection: "
        "The answer may need improvement because "
        "correctness or faithfulness evaluation did not pass."
    )