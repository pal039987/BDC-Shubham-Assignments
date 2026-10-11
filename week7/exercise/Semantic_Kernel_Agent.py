import re
import os
import asyncio
from typing import Annotated
import requests
from dotenv import load_dotenv

from semantic_kernel import Kernel
from semantic_kernel.connectors.ai.google.google_ai import (
    GoogleAIChatCompletion,
    GoogleAIChatPromptExecutionSettings,
)
from semantic_kernel.connectors.ai.function_choice_behavior import FunctionChoiceBehavior
from semantic_kernel.functions import kernel_function

load_dotenv()

# --------------------------------------------------
# Initialize the kernel with Gemini
# --------------------------------------------------
kernel = Kernel()

google_api_key = os.getenv("GOOGLE_API_KEY")
if google_api_key:
    kernel.add_service(
        GoogleAIChatCompletion(
            service_id="gemini-chat",
            gemini_model_id="gemini-flash-lite-latest",
            api_key=google_api_key,
        )
    )
    print("Semantic Kernel initialized with Gemini LLM!")
else:
    print("WARNING: GOOGLE_API_KEY not found in environment variables.")

print("Libraries loaded and environment setup complete!")


# --------------------------------------------------
# Weather Plugin
# --------------------------------------------------
class WeatherPlugin:
    def __init__(self):
        self.api_key = os.getenv("OPENWEATHERMAP_API_KEY")
        self.base_url = "https://api.openweathermap.org/data/2.5/weather"

    @kernel_function(
        description="Gets the current weather for a specified location.",
        name="get_current_weather",
    )
    def get_current_weather(
        self,
        location: Annotated[str, "The city and country, e.g. 'London, UK'"],
        unit: Annotated[str, "Temperature unit: 'celsius' or 'fahrenheit'"] = "celsius",
    ) -> Annotated[str, "The current weather description"]:
        if not self.api_key:
            return "Weather API key not configured."

        units_param = "metric" if unit.lower() == "celsius" else "imperial"
        params = {"q": location, "appid": self.api_key, "units": units_param}

        try:
            response = requests.get(self.base_url, params=params)
            response.raise_for_status()
            data = response.json()

            if str(data.get("cod")) == "404":
                return f"Location '{location}' not found."

            main = data.get("main", {})
            weather_desc = data.get("weather", [{}])[0].get("description", "")
            temp = main.get("temp")
            humidity = main.get("humidity")

            if temp is not None:
                unit_symbol = "C" if unit.lower() == "celsius" else "F"
                return f"Current weather in {location}: {temp}°{unit_symbol}, {weather_desc}, humidity: {humidity}%."
            return f"Could not retrieve temperature for {location}."
        except requests.exceptions.RequestException as e:
            return f"Error fetching weather for {location}: {e}"


# --------------------------------------------------
# News Plugin
# --------------------------------------------------
class NewsPlugin:
    def __init__(self):
        self.api_key = os.getenv("NEWSAPI_API_KEY")
        self.base_url = "https://newsapi.org/v2/everything"

    @kernel_function(
        description="Gets the latest news articles for a specified topic.",
        name="get_latest_news",
    )
    def get_latest_news(
        self,
        topic: Annotated[str, "The news topic or keyword to search for"],
        count: Annotated[int, "Number of articles to retrieve (max 5)"] = 3,
    ) -> Annotated[str, "A formatted list of news articles"]:
        if not self.api_key:
            return "News API key not configured."

        count = min(count, 5)
        params = {
            "q": topic,
            "apiKey": self.api_key,
            "pageSize": count,
            "language": "en",
        }

        try:
            response = requests.get(self.base_url, params=params)
            response.raise_for_status()
            data = response.json()

            articles = data.get("articles", [])
            if not articles:
                return f"No news found for topic '{topic}'."

            news_summary = []
            for i, article in enumerate(articles):
                title = article.get("title", "No Title")
                source = article.get("source", {}).get("name", "Unknown Source")
                url = article.get("url", "")
                news_summary.append(f"{i+1}. {title} (Source: {source}) - {url}")

            return f"Latest news on '{topic}':\n" + "\n".join(news_summary)
        except requests.exceptions.RequestException as e:
            return f"Error fetching news for '{topic}': {e}"


# --------------------------------------------------
# Register plugins with the kernel
# --------------------------------------------------
kernel.add_plugin(WeatherPlugin(), plugin_name="WeatherPlugin")
kernel.add_plugin(NewsPlugin(), plugin_name="NewsPlugin")

print("WeatherPlugin and NewsPlugin registered with the kernel!")


# --------------------------------------------------
# Chat function with auto function-calling enabled
# --------------------------------------------------
async def chat_with_bot(query: str) -> str:
    print(f"\nUser: {query}")

    query_lower = query.lower()
    tool_context = ""

    # Manually detect which tool(s) are relevant, instead of relying on
    # automatic function-calling (which has a role-compatibility bug with Gemini)
    if "weather" in query_lower or "temperature" in query_lower:
        # crude location extraction — ask the LLM separately, or hardcode for testing
        weather_plugin = kernel.plugins["WeatherPlugin"]["get_current_weather"]
        # naive location guess: last comma-separated phrase in the query
        
        location_match = re.search(r"in ([A-Za-z,\s]+?)(?:\?|$|in Fahrenheit|in Celsius)", query, re.IGNORECASE)
        location = location_match.group(1).strip() if location_match else "London, UK"
        unit = "fahrenheit" if "fahrenheit" in query_lower else "celsius"
        result = await kernel.invoke(weather_plugin, location=location, unit=unit)
        tool_context += f"\n[Weather Tool Result]: {result}\n"

    if "news" in query_lower:
        news_plugin = kernel.plugins["NewsPlugin"]["get_latest_news"]
        topic_match = re.search(r"(?:news (?:on|about))\s+([A-Za-z\s]+)", query, re.IGNORECASE) if "news" in query_lower else None
        topic = topic_match.group(1).strip() if topic_match else "technology"
        result = await kernel.invoke(news_plugin, topic=topic, count=3)
        tool_context += f"\n[News Tool Result]: {result}\n"

    final_prompt = query
    if tool_context:
        final_prompt = f"{query}\n\nHere is some relevant data:\n{tool_context}\n\nAnswer the user's question using this data."

    try:
        result = await kernel.invoke_prompt(prompt=final_prompt)
        response_content = str(result)
        print(f"Bot: {response_content}")
        return response_content
    except Exception as e:
        print(f"Bot (Error): An error occurred during processing: {e}")
        return f"Sorry, I encountered an error: {e}"

# --------------------------------------------------
# Run test cases
# --------------------------------------------------
async def main():
    await chat_with_bot("What's the weather like in London, UK?")
    await chat_with_bot("Tell me the temperature in Paris, France in Fahrenheit.")
    await chat_with_bot("How's the weather in Narnia?")

    await chat_with_bot("Give me the latest news on AI.")
    await chat_with_bot("Find 2 recent news articles about electric vehicles.")
    await chat_with_bot("What's the news about sentient potatoes?")

    await chat_with_bot("What's the current weather in Tokyo and any recent news about technology companies?")
    await chat_with_bot("What is the capital of France?")


if __name__ == "__main__":
    asyncio.run(main())