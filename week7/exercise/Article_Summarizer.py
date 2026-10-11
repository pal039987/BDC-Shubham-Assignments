import os
import asyncio
from dotenv import load_dotenv
from google import genai
from google.genai import types

load_dotenv()

# --------------------------------------------------
# Configure Gemini client
# --------------------------------------------------
api_key = os.getenv("GOOGLE_API_KEY")

if not api_key:
    print("WARNING: GOOGLE_API_KEY not found in environment variables. Please set it in .env file.")
else:
    print("Gemini API key loaded!")

client = genai.Client(api_key=api_key)

LLM_MODEL = "gemini-flash-lite-latest"
print(f"Using LLM Model: {LLM_MODEL}")

# --------------------------------------------------
# Simulated article stream
# --------------------------------------------------
article_stream = [
    {
        "id": 1,
        "title": "Quantum Computing Breakthrough",
        "url": "https://example.com/quantum-breakthrough",
        "content": "Scientists at Quantum Labs have announced a significant breakthrough in quantum entanglement, achieving stable qubits for over 10 minutes. This could pave the way for more powerful quantum computers, moving beyond the current limitations of decoherence. The research paper, published in 'Nature Physics', details their novel method of using cryogenic chambers and magnetic shielding to maintain qubit integrity. This advancement is crucial for error correction and scaling quantum systems."
    },
    {
        "id": 2,
        "title": "New AI Model for Drug Discovery",
        "url": "https://example.com/ai-drug-discovery",
        "content": "AlphaMolecule, a new AI model developed by BioGen AI, has shown promising results in accelerating drug discovery. The model can predict molecular interactions with high accuracy, drastically reducing the time and cost associated with traditional pharmaceutical research. Early trials indicate a 20% improvement in identifying potential drug candidates for various diseases, including a new treatment for Alzheimer's. The model was trained on a vast dataset of chemical compounds and biological targets."
    },
    {
        "id": 3,
        "title": "Impact of Climate Change on Global Food Supply",
        "url": "https://example.com/climate-food-supply",
        "content": "A recent report from the UN's IPCC warns of severe disruptions to global food supply chains due to accelerating climate change. Extreme weather events, prolonged droughts, and unpredictable rainfall patterns are leading to crop failures and reduced agricultural yields in key farming regions. The report emphasizes the urgent need for climate-resilient farming practices and diversified food sources to ensure future food security. It also highlights the disproportionate impact on developing nations."
    },
    {
        "id": 4,
        "title": "The Rise of Sustainable Urban Planning",
        "url": "https://example.com/sustainable-cities",
        "content": "Cities worldwide are increasingly adopting sustainable urban planning principles to combat climate change and improve livability. Initiatives include green infrastructure development, promoting public transportation, establishing car-free zones, and investing in renewable energy sources for urban consumption. Singapore, Copenhagen, and Curitiba are cited as leading examples, demonstrating how integrated planning can lead to reduced carbon footprints and enhanced public well-being. Community engagement is a critical component of these successful projects."
    }
]

processed_articles = []

print(f"Simulated stream of {len(article_stream)} articles created.")


# --------------------------------------------------
# Summarize a single article with citation
# --------------------------------------------------
async def summarize_with_citation(article: dict) -> dict:
    title = article.get("title", "Unknown Title")
    url = article.get("url", "No URL provided")
    content = article.get("content", "")

    if not content:
        return {
            "summary": "No content provided for summarization.",
            "citation_title": title,
            "citation_url": url
        }

    system_instruction = (
        "You are an expert summarizer. Your task is to provide a concise summary (2-4 sentences) "
        "of the given article content. Crucially, you must append a clear citation in the format: "
        "'(Source: [Article Title], [Article URL])'. Ensure the summary accurately reflects the "
        "content and the citation is precise."
    )

    user_message = (
        f"Please summarize the following article and include its source:\n\n"
        f"Article Title: {title}\n"
        f"Article URL: {url}\n\n"
        f"Content:\n{content}"
    )

    try:
        response = await asyncio.to_thread(
            client.models.generate_content,
            model=LLM_MODEL,
            contents=user_message,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                temperature=0.2,
                max_output_tokens=200,
            ),
        )
        full_response_content = response.text

        summary_part = full_response_content
        if "(Source:" in full_response_content and ")" in full_response_content:
            citation_start = full_response_content.rfind("(Source:")
            citation_end = full_response_content.rfind(")")
            if citation_start != -1 and citation_end != -1 and citation_end > citation_start:
                summary_part = full_response_content[:citation_start].strip()

        return {
            "summary": summary_part,
            "citation_title": title,
            "citation_url": url
        }
    except Exception as e:
        print(f"Gemini API error during summarization: {e}")
        return {
            "summary": f"Error summarizing article: {e}",
            "citation_title": title,
            "citation_url": url
        }


print("summarize_with_citation function defined!")


# --------------------------------------------------
# Loop through all articles with a delay between each
# --------------------------------------------------
async def run_summarization_agent_loop(articles_to_process: list, delay_seconds: int = 5):
    global processed_articles
    processed_articles = []

    print("\n--- Starting Long-Running Summarization Agent Loop ---")
    print(f"Processing {len(articles_to_process)} articles with a delay of {delay_seconds} seconds between each.")

    for i, article in enumerate(articles_to_process):
        print(f"\n--- Processing Article {i+1}/{len(articles_to_process)}: '{article.get('title', 'N/A')}' ---")

        summary_data = await summarize_with_citation(article)
        processed_articles.append(summary_data)

        print("Summary:")
        print(summary_data["summary"].strip())
        print(f"Citation: (Source: {summary_data['citation_title']}, {summary_data['citation_url']})")

        if i < len(articles_to_process) - 1:
            print(f"\nWaiting {delay_seconds} seconds before next article...")
            await asyncio.sleep(delay_seconds)

    print("\n--- Long-Running Summarization Agent Loop Finished ---")
    print(f"Successfully processed {len(processed_articles)} articles.")


print("run_summarization_agent_loop function defined!")


# --------------------------------------------------
# Entry point
# --------------------------------------------------
async def main():
    await run_summarization_agent_loop(article_stream, delay_seconds=7)

    print("\n--- All Processed Summaries with Citations ---")
    for i, data in enumerate(processed_articles):
        print(f"\nArticle {i+1}:")
        print(f"Summary: {data['summary']}")
        print(f"Citation: (Source: {data['citation_title']}, {data['citation_url']})")
        print("-------------------------------------------")


if __name__ == "__main__":
    asyncio.run(main())