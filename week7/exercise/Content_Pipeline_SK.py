import os
import time
import asyncio
from dotenv import load_dotenv

from semantic_kernel import Kernel
from semantic_kernel.connectors.ai.google.google_ai import GoogleAIChatCompletion
from semantic_kernel.functions import KernelArguments

load_dotenv()

# --------------------------------------------------
# Initialize the kernel with Gemini
# --------------------------------------------------
kernel = Kernel()

api_key = os.getenv("GOOGLE_API_KEY")

if not api_key:
    print("WARNING: GOOGLE_API_KEY not found in environment variables. Please set it in .env file.")
else:
    kernel.add_service(
        GoogleAIChatCompletion(
            service_id="chat_completion",
            gemini_model_id="gemini-flash-lite-latest",
            api_key=api_key,
        )
    )
    print("Semantic Kernel initialized with Gemini model: gemini-flash-lite-latest")

# --------------------------------------------------
# Sample article
# --------------------------------------------------
long_article = (
    "The recent surge in AI advancements has led to significant discussions about its societal impact. "
    "From automated customer service to complex scientific research, artificial intelligence is reshaping industries "
    "at an unprecedented pace. However, alongside the excitement, concerns about job displacement, "
    "ethical implications, and data privacy have also gained prominence. Governments and organizations "
    "worldwide are grappling with the challenge of regulating AI development to ensure responsible innovation. "
    "Bias in algorithms, explainability of AI decisions, and the potential for misuse are critical areas "
    "requiring careful consideration. Public discourse is crucial to fostering a balanced understanding "
    "of AI's potential benefits and risks. Many experts believe that collaboration between technologists, "
    "policymakers, and ethicists is vital for navigating this transformative era successfully. "
    "Investment in AI education and retraining programs is also seen as essential to prepare the workforce "
    "for the future. Ultimately, the trajectory of AI's integration into society will depend on a collective "
    "commitment to ethical guidelines and human-centric design."
)

print("Sample article defined.")

# --------------------------------------------------
# Skill 1: Summarization
# --------------------------------------------------
summarize_function = kernel.add_function(
    function_name="Summarize",
    plugin_name="ContentProcessing",
    prompt="{{$input}}\n\nGiven the text above, provide a concise summary of 2-3 sentences. Focus on the main points.",
)

print("Summarization skill created.")

# --------------------------------------------------
# Skill 2: Tone Adjustment
# --------------------------------------------------
tone_adjust_function = kernel.add_function(
    function_name="AdjustTone",
    plugin_name="ContentProcessing",
    prompt="Rewrite the following text in a more {{$tone}} tone:\n\n{{$input}}",
)

print("Tone Adjustment skill created.")

# --------------------------------------------------
# Skill 3: Keyword Extraction
# --------------------------------------------------
keyword_extract_function = kernel.add_function(
    function_name="ExtractKeywords",
    plugin_name="ContentProcessing",
    prompt="Extract 3-5 key terms or phrases from the following text, separated by commas:\n\n{{$input}}",
)

print("Keyword Extraction skill created.")

# --------------------------------------------------
# Skill 4: Title Generation
# --------------------------------------------------
title_generate_function = kernel.add_function(
    function_name="GenerateTitles",
    plugin_name="ContentProcessing",
    prompt="Based on the following summary and keywords, suggest 3 catchy and relevant titles, each on a new line.\n\nSummary: {{$summary}}\nKeywords: {{$keywords}}",
)

print("Title Generation skill created (optional).")


# --------------------------------------------------
# Pipeline: runs all 4 skills in sequence
# --------------------------------------------------
async def run_content_pipeline(article_text: str, desired_tone: str):
    print(f"\n--- Starting Content Pipeline for Tone: '{desired_tone}' ---")
    total_pipeline_start_time = time.time()
    latency_measurements = {}

    # Step 1: Summarization
    step_start_time = time.time()
    summary_result = await kernel.invoke(summarize_function, KernelArguments(input=article_text))
    summary_output = str(summary_result)
    latency_measurements["Summarization"] = time.time() - step_start_time
    print(f"Summary ({latency_measurements['Summarization']:.2f}s): {summary_output}")

    # Step 2: Tone Adjustment
    step_start_time = time.time()
    tone_adjusted_result = await kernel.invoke(
        tone_adjust_function, KernelArguments(input=summary_output, tone=desired_tone)
    )
    tone_adjusted_output = str(tone_adjusted_result)
    latency_measurements["Tone Adjustment"] = time.time() - step_start_time
    print(f"Tone Adjusted ({latency_measurements['Tone Adjustment']:.2f}s): {tone_adjusted_output}")

    # Step 3: Keyword Extraction
    step_start_time = time.time()
    keywords_result = await kernel.invoke(keyword_extract_function, KernelArguments(input=tone_adjusted_output))
    keywords_output = str(keywords_result)
    latency_measurements["Keyword Extraction"] = time.time() - step_start_time
    print(f"Keywords ({latency_measurements['Keyword Extraction']:.2f}s): {keywords_output}")

    # Step 4: Title Generation
    step_start_time = time.time()
    titles_result = await kernel.invoke(
        title_generate_function, KernelArguments(summary=tone_adjusted_output, keywords=keywords_output)
    )
    titles_output = str(titles_result)
    latency_measurements["Title Generation"] = time.time() - step_start_time
    print(f"Titles ({latency_measurements['Title Generation']:.2f}s):\n{titles_output}")

    total_latency = time.time() - total_pipeline_start_time
    latency_measurements["Total Pipeline"] = total_latency

    print("\n--- Pipeline Summary ---")
    print("Individual Skill Latencies:")
    for skill, latency in latency_measurements.items():
        if skill != "Total Pipeline":
            print(f"- {skill}: {latency:.2f} seconds")
    print(f"Total Pipeline Latency: {total_latency:.2f} seconds")
    print("------------------------")

    return {
        "summary": summary_output,
        "adjusted_content": tone_adjusted_output,
        "keywords": keywords_output,
        "titles": titles_output,
        "latency": latency_measurements,
    }


print("run_content_pipeline function defined.")


# --------------------------------------------------
# Entry point
# --------------------------------------------------
async def main():
    results_enthusiastic = await run_content_pipeline(long_article, "enthusiastic")

    print("\n" + "=" * 50 + "\n")

    results_formal = await run_content_pipeline(long_article, "formal")


if __name__ == "__main__":
    asyncio.run(main())