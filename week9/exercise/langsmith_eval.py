import os
import re
import json
from pathlib import Path

import pandas as pd
import textstat
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langsmith import Client
from langsmith.evaluation import evaluate

load_dotenv()

LANGCHAIN_API_KEY = os.getenv("LANGCHAIN_API_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not LANGCHAIN_API_KEY:
    raise ValueError("LANGCHAIN_API_KEY missing from .env")

if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY missing from .env")

os.environ["GOOGLE_API_KEY"] = GEMINI_API_KEY
os.environ["LANGCHAIN_TRACING_V2"] = "true"
os.environ["LANGCHAIN_PROJECT"] = os.getenv(
    "LANGCHAIN_PROJECT", "LLM_Eval_Assignment"
)

DATASET_NAME = "LLM_Eval_QA_Dataset"
OUTPUT_DIR = Path("outputs")
OUTPUT_DIR.mkdir(exist_ok=True)

client = Client()

qa_examples = [
    {
        "question": "What is photosynthesis?",
        "context": "Photosynthesis is the process by which green plants use sunlight, water, and carbon dioxide to produce glucose and oxygen.",
        "answer": "Photosynthesis is the process by which plants use sunlight, water, and carbon dioxide to produce glucose and oxygen.",
    },
    {
        "question": "What is the capital of France?",
        "context": "Paris is the capital and largest city of France.",
        "answer": "Paris.",
    },
    {
        "question": "What is the boiling point of water at sea level?",
        "context": "At standard atmospheric pressure, pure water boils at 100 degrees Celsius.",
        "answer": "100 degrees Celsius.",
    },
    {
        "question": "What does CPU stand for?",
        "context": "CPU stands for Central Processing Unit. It executes instructions in a computer.",
        "answer": "Central Processing Unit.",
    },
    {
        "question": "What is the largest planet in our solar system?",
        "context": "Jupiter is the largest planet in the Solar System.",
        "answer": "Jupiter.",
    },
    {
        "question": "What is the purpose of the heart?",
        "context": "The heart pumps blood throughout the body, delivering oxygen and nutrients to tissues.",
        "answer": "The heart pumps blood throughout the body.",
    },
    {
        "question": "What is machine learning?",
        "context": "Machine learning is a branch of artificial intelligence in which systems learn patterns from data to make predictions or decisions.",
        "answer": "Machine learning is a branch of AI that learns patterns from data to make predictions or decisions.",
    },
    {
        "question": "How many sides does a triangle have?",
        "context": "A triangle is a polygon with three sides and three angles.",
        "answer": "Three sides.",
    },
    {
        "question": "What is the chemical formula for water?",
        "context": "A water molecule contains two hydrogen atoms and one oxygen atom. Its chemical formula is H2O.",
        "answer": "H2O.",
    },
    {
        "question": "What is renewable energy?",
        "context": "Renewable energy comes from naturally replenished sources such as sunlight, wind, and flowing water.",
        "answer": "Energy from naturally replenished sources such as sunlight, wind, and water.",
    },
    {
        "question": "What is the function of plant roots?",
        "context": "Plant roots anchor the plant in the soil and absorb water and minerals.",
        "answer": "Roots anchor plants and absorb water and minerals from the soil.",
    },
    {
        "question": "What is the internet?",
        "context": "The internet is a global network of interconnected computer networks that communicate using standardized protocols.",
        "answer": "A global network of interconnected computer networks.",
    },
    {
        "question": "What is evaporation?",
        "context": "Evaporation occurs when a liquid changes into a gas at its surface.",
        "answer": "The process in which a liquid changes into a gas at its surface.",
    },
    {
        "question": "What is the role of red blood cells?",
        "context": "Red blood cells contain hemoglobin, which transports oxygen from the lungs to body tissues.",
        "answer": "They transport oxygen from the lungs to body tissues.",
    },
    {
        "question": "What is a habitat?",
        "context": "A habitat is the natural environment in which an organism lives and obtains resources for survival.",
        "answer": "The natural environment where an organism lives.",
    },
]


def get_or_create_dataset():
    try:
        dataset = client.read_dataset(dataset_name=DATASET_NAME)
        print(f"Using existing dataset: {DATASET_NAME}")
        return dataset
    except Exception:
        dataset = client.create_dataset(
            dataset_name=DATASET_NAME,
            description="Question-answer dataset for evaluating Gemini outputs.",
        )
        client.create_examples(
            inputs=[
                {
                    "question": item["question"],
                    "context": item["context"],
                }
                for item in qa_examples
            ],
            outputs=[
                {"answer": item["answer"]}
                for item in qa_examples
            ],
            dataset_id=dataset.id,
        )
        print(f"Created dataset with {len(qa_examples)} examples.")
        return dataset


dataset = get_or_create_dataset()

answer_prompt = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            "Answer the question using only the supplied context. "
            "If the context does not contain the answer, say you do not know. "
            "Keep the answer clear and concise.",
        ),
        (
            "human",
            "Context: {context}\nQuestion: {question}",
        ),
    ]
)

llm = ChatGoogleGenerativeAI(
    model="gemini-flash-lite-latest",
    temperature=0,
)

qa_chain = answer_prompt | llm | StrOutputParser()


def predict(inputs: dict) -> dict:
    answer = qa_chain.invoke(
        {
            "question": inputs["question"],
            "context": inputs["context"],
        }
    )
    return {"answer": answer}


judge_llm = ChatGoogleGenerativeAI(
    model="gemini-flash-lite-latest",
    temperature=0,
)


def judge_score(prompt: str) -> float:
    response = judge_llm.invoke(prompt).content
    if isinstance(response, list):
        response = " ".join(
            str(part.get("text", "")) if isinstance(part, dict) else str(part)
            for part in response
        )

    match = re.search(r"\b(?:0(?:\.\d+)?|1(?:\.0+)?)\b", str(response))
    if not match:
        return 0.0

    return max(0.0, min(1.0, float(match.group(0))))


def relevance_evaluator(run, example) -> dict:
    question = example.inputs["question"]
    prediction = run.outputs.get("answer", "")

    score = judge_score(
        "Evaluate how directly and correctly the answer addresses the question. "
        "Return only one numeric score from 0 to 1, where 1 is fully relevant "
        "and correct.\n\n"
        f"Question: {question}\n"
        f"Answer: {prediction}\n"
        "Score:"
    )

    return {
        "key": "answer_relevance",
        "score": score,
    }


def faithfulness_evaluator(run, example) -> dict:
    context = example.inputs["context"]
    prediction = run.outputs.get("answer", "")

    score = judge_score(
        "Evaluate whether the answer is supported by the supplied context. "
        "Penalize unsupported claims and invented facts. "
        "Return only one numeric score from 0 to 1, where 1 means fully "
        "grounded in the context.\n\n"
        f"Context: {context}\n"
        f"Answer: {prediction}\n"
        "Score:"
    )

    return {
        "key": "faithfulness",
        "score": score,
    }


def readability_evaluator(run, example) -> dict:
    prediction = run.outputs.get("answer", "")

    if not prediction.strip():
        score = 0.0
    else:
        grade = textstat.flesch_kincaid_grade(prediction)
        score = max(0.0, min(1.0, 1.0 - abs(grade - 6) / 12))

    return {
        "key": "readability",
        "score": score,
    }


evaluators = [
    relevance_evaluator,
    faithfulness_evaluator,
    readability_evaluator,
]

results = evaluate(
    predict,
    data=DATASET_NAME,
    evaluators=evaluators,
    experiment_prefix="gemini-qa-evaluation",
    description=(
        "Gemini QA evaluation using answer relevance, "
        "faithfulness, and readability."
    ),
    max_concurrency=5,
)

dataset_df = pd.DataFrame(qa_examples)
dataset_df.to_csv(OUTPUT_DIR / "qa_dataset.csv", index=False)

metadata = {
    "dataset_name": DATASET_NAME,
    "project_name": os.environ["LANGCHAIN_PROJECT"],
    "model": "gemini-flash-lite-latest",
    "number_of_examples": len(qa_examples),
    "evaluators": [
        "answer_relevance",
        "faithfulness",
        "readability",
    ],
    "max_concurrency": 5,
}

with open(OUTPUT_DIR / "evaluation_metadata.json", "w", encoding="utf-8") as file:
    json.dump(metadata, file, indent=2)

print(f"Dataset examples: {len(qa_examples)}")
print(f"Dataset CSV: {OUTPUT_DIR / 'qa_dataset.csv'}")
print(f"Metadata: {OUTPUT_DIR / 'evaluation_metadata.json'}")
print("Evaluation submitted to LangSmith.")
print(results)