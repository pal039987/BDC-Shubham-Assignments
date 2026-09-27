import os
from dotenv import load_dotenv
import google.generativeai as genai

# ---- Load API key ----
load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=api_key)

model_gemini = genai.GenerativeModel("gemini-flash-lite-latest")


def call_llm_api(prompt: str, model_id: str = "gemini-3.6-flash", max_tokens: int = 150, temperature: float = 0.7) -> str:
    """Calls the Gemini API and returns the generated text."""
    print(f"\n--- Calling LLM ({model_id}) ---")
    print("Prompt (first 200 chars):\n", prompt[:200], "...")

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
        print(f"Error calling Gemini API: {e}")
        return "[LLM ERROR: Could not generate summary]"


# ---- Sample Long Texts ----
sample_texts = [
    {
        "id": "text_1",
        "title": "The Rise of Quantum Computing",
        "content": "Quantum computing is a rapidly emerging technology that harnesses the principles of quantum mechanics—such as superposition, entanglement, and quantum tunneling—to perform computations. Unlike classical computers that store information as bits (0s or 1s), quantum computers use qubits, which can represent both 0 and 1 simultaneously. This ability allows quantum computers to process vast amounts of information exponentially faster for certain types of problems. Potential applications include breaking modern encryption methods, designing new materials with unprecedented properties, optimizing complex logistical challenges, and accelerating drug discovery. However, the technology is still in its nascent stages, facing significant challenges in qubit stability, error correction, and scalability. Researchers worldwide, including IBM, Google, and various academic institutions, are making considerable progress, yet a fully fault-tolerant quantum computer is likely still decades away."
    },
    {
        "id": "text_2",
        "title": "The Impact of AI on Job Markets",
        "content": "Artificial intelligence (AI) is poised to significantly transform global job markets, creating new roles while potentially automating others. Repetitive and routine tasks, whether manual or cognitive, are particularly susceptible to automation. This includes roles in manufacturing, data entry, and certain administrative functions. However, AI is also expected to boost productivity and create entirely new industries and job categories that require human oversight, creativity, emotional intelligence, and critical thinking. Examples include AI ethicists, data scientists, machine learning engineers, and roles focused on human-AI collaboration. The key challenge for societies will be to manage this transition, focusing on reskilling and upskilling programs to prepare the workforce for future demands. Policymakers are also exploring universal basic income (UBI) and other social safety nets to address potential widespread displacement."
    },
    {
        "id": "text_3",
        "title": "Reusable Rockets and Space Exploration",
        "content": "The advent of reusable rocket technology has marked a paradigm shift in space exploration, dramatically reducing the cost of launching payloads into orbit. Companies like SpaceX, with its Falcon 9 and Falcon Heavy rockets, have pioneered the vertical landing of first-stage boosters, allowing them to be refuelled and flown multiple times. This innovation contrasts sharply with traditional rockets, which are typically expendable after a single use. The cost savings enable more frequent launches, foster greater accessibility to space, and open up possibilities for ambitious missions like satellite mega-constellations, lunar bases, and eventual human exploration of Mars. While the initial development costs for reusable systems are high, the long-term operational savings are immense, pushing the boundaries of what is economically feasible in space. This has also spurred increased competition and innovation within the aerospace industry."
    }
]

print("Sample texts loaded. Total texts:", len(sample_texts))


# =====================================================
# QUESTION 1: Zero-Shot Prompt
# =====================================================
print("\n\n========== QUESTION 1: ZERO-SHOT ==========")

zero_shot_prompt = f"""Summarize the following article in about 3-4 sentences, as a single paragraph.

Article:
{sample_texts[0]['content']}
"""

zero_shot_summary = call_llm_api(zero_shot_prompt)

print("\nOriginal Text:\n", sample_texts[0]['content'])
print("\nPrompt Used:\n", zero_shot_prompt)
print("\nGenerated Summary:\n", zero_shot_summary)


# =====================================================
# QUESTION 2: Few-Shot Prompt
# =====================================================
print("\n\n========== QUESTION 2: FEW-SHOT ==========")

few_shot_prompt = f"""Summarize the following article in a concise paragraph, similar in style to the examples below.

Example 1:
Text: "The capital of France is Paris, a global center for art, fashion, gastronomy, and culture. Its 19th-century cityscape is crisscrossed by wide boulevards and the River Seine. Beyond such landmarks as the Eiffel Tower and the 12th-century Gothic Notre-Dame Cathedral, the city is known for its cafe culture and designer boutiques."
Summary: "Paris, the capital of France, is a global cultural hub known for its art, fashion, and historic landmarks like the Eiffel Tower and Notre-Dame Cathedral, as well as its vibrant cafe culture."

Example 2:
Text: "The Great Barrier Reef, located off the coast of Queensland, Australia, is the world's largest coral reef system, composed of over 2,900 individual reefs and 900 islands. It is home to a vast array of marine biodiversity, including thousands of species of fish, mollusks, and sharks. However, the reef faces severe threats from climate change, particularly coral bleaching caused by rising sea temperatures."
Summary: "The Great Barrier Reef off Australia's coast is the world's largest coral reef system, home to immense marine biodiversity, but it faces serious threats from climate change and coral bleaching."

Now summarize this article in the same style:
Text: {sample_texts[1]['content']}
Summary:"""

few_shot_summary = call_llm_api(few_shot_prompt)

print("\nOriginal Text:\n", sample_texts[1]['content'])
print("\nPrompt Used:\n", few_shot_prompt)
print("\nGenerated Summary:\n", few_shot_summary)


# =====================================================
# QUESTION 3: Prompt Variations
# =====================================================
print("\n\n========== QUESTION 3: VARIATIONS ==========")

# Variation A: Strict length control
variation_a_prompt = f"""Summarize the following article in exactly two sentences.

Article:
{sample_texts[2]['content']}
"""
variation_a_summary = call_llm_api(variation_a_prompt)

print("\n--- Variation A: Strict Length Control ---")
print("Prompt Used:\n", variation_a_prompt)
print("\nGenerated Summary:\n", variation_a_summary)

# Variation B: Persona / Tone
variation_b_prompt = f"""Summarize this article as if you are explaining it to a 12-year-old. Use simple, friendly language.

Article:
{sample_texts[2]['content']}
"""
variation_b_summary = call_llm_api(variation_b_prompt)

print("\n--- Variation B: Persona/Tone (explain to a 12-year-old) ---")
print("Prompt Used:\n", variation_b_prompt)
print("\nGenerated Summary:\n", variation_b_summary)