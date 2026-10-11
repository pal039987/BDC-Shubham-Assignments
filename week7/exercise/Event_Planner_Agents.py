import autogen
import os
import requests
from dotenv import load_dotenv

load_dotenv()

# --------------------------------------------------
# Configure LLM (Gemini instead of OpenAI)
# --------------------------------------------------
config_list_gemini = [
    {
        "model": "gemini-flash-lite-latest",
        "api_key": os.environ["GOOGLE_API_KEY"],
        "api_type": "google",
    }
]

llm_config = {
    "config_list": config_list_gemini,
    "temperature": 0.2,
}

# Get external API keys
OPENWEATHERMAP_API_KEY = os.getenv("OPENWEATHERMAP_API_KEY")
NEWSAPI_API_KEY = os.getenv("NEWSAPI_API_KEY")

if not OPENWEATHERMAP_API_KEY:
    print("WARNING: OPENWEATHERMAP_API_KEY not found.")
if not NEWSAPI_API_KEY:
    print("WARNING: NEWSAPI_API_KEY not found.")

print("AutoGen environment and API keys configured!")


# --------------------------------------------------
# Tool 1: Weather
# --------------------------------------------------
def get_current_weather(location: str, unit: str = "celsius") -> str:
    """
    Gets the current weather for a specified location.
    :param location: The city and country (e.g., 'London, UK') to get weather for.
    :param unit: Temperature unit: 'celsius' or 'fahrenheit'. Defaults to celsius.
    :return: A string summarizing the weather or an error message.
    """
    if not OPENWEATHERMAP_API_KEY:
        return "Weather API key not configured."

    base_url = "https://api.openweathermap.org/data/2.5/weather"
    units_param = "metric" if unit.lower() == "celsius" else "imperial"

    params = {"q": location, "appid": OPENWEATHERMAP_API_KEY, "units": units_param}

    try:
        response = requests.get(base_url, params=params)
        response.raise_for_status()
        data = response.json()

        if str(data.get("cod")) == "404":
            return f"Weather for '{location}' not found."

        main = data.get("main", {})
        weather_desc = data.get("weather", [{}])[0].get("description", "")
        temp = main.get("temp")
        humidity = main.get("humidity")

        if temp is not None:
            return f"Current weather in {location}: {temp}°{unit.upper()[0]}, {weather_desc}, humidity: {humidity}%."
        return f"Could not retrieve temperature for {location}."
    except requests.exceptions.RequestException as e:
        return f"Error fetching weather for {location}: {e}"


print("get_current_weather tool defined!")


# --------------------------------------------------
# Tool 2: News
# --------------------------------------------------
def get_latest_news(topic: str = "general", location: str = "", count: int = 3) -> str:
    """
    Gets the latest news articles for a specified topic and optional location.
    :param topic: The news topic or keyword to search for (e.g., 'technology', 'events').
    :param location: Optional. The location to filter news by (e.g., 'London', 'UK').
    :param count: The number of news articles to retrieve. Defaults to 3.
    :return: A formatted string listing the news articles or an error message.
    """
    if not NEWSAPI_API_KEY:
        return "News API key not configured."

    base_url = "https://newsapi.org/v2/everything"
    count = min(count, 5)

    query = f"{topic} {location}".strip() if location else topic

    params = {
        "q": query,
        "apiKey": NEWSAPI_API_KEY,
        "pageSize": count,
        "language": "en",
    }

    try:
        response = requests.get(base_url, params=params)
        response.raise_for_status()
        data = response.json()

        articles = data.get("articles", [])
        if not articles:
            return f"No news found for topic '{topic}' in '{location}'."

        news_summary = []
        for i, article in enumerate(articles):
            title = article.get("title", "No Title")
            source = article.get("source", {}).get("name", "Unknown Source")
            url = article.get("url", "")
            news_summary.append(f"{i+1}. {title} (Source: {source}) - {url}")

        return f"Latest news on '{topic}' in '{location}':\n" + "\n".join(news_summary)
    except requests.exceptions.RequestException as e:
        return f"Error fetching news for '{topic}' in '{location}': {e}"


print("get_latest_news tool defined!")


# --------------------------------------------------
# UserProxyAgent (Admin)
# --------------------------------------------------
def is_termination_message(message):
    content = message.get("content", "") or ""
    return "TERMINATE" in content.upper() or "FINISH" in content.upper()


WORK_DIR = "event_planner_workdir"
if not os.path.exists(WORK_DIR):
    os.makedirs(WORK_DIR)

user_proxy = autogen.UserProxyAgent(
    name="Admin",
    human_input_mode="NEVER",
    max_consecutive_auto_reply=15,
    is_termination_msg=is_termination_message,
    code_execution_config={
        "work_dir": WORK_DIR,
        "use_docker": False,
    },
    system_message=(
        "A human administrator who oversees the event planning team. Provide high-level "
        "event planning requests and approve final recommendations. Conclude with 'TERMINATE' when satisfied."
    ),
)

print("UserProxyAgent 'Admin' created!")

# --------------------------------------------------
# Specialized Agents
# --------------------------------------------------
weather_agent = autogen.AssistantAgent(
    name="WeatherAgent",
    system_message=(
        "You are a specialized weather information retriever. Your task is to use the "
        "'get_current_weather' tool to find weather conditions for a given location and unit. "
        "Report the findings clearly. Only provide weather information and pass it to the EventPlannerAgent."
    ),
    llm_config=llm_config,
)

news_agent = autogen.AssistantAgent(
    name="NewsAgent",
    system_message=(
        "You are a specialized news researcher. Your task is to use the 'get_latest_news' tool "
        "to find relevant news articles for a given topic and location. Summarize the key headlines. "
        "Only provide news information and pass it to the EventPlannerAgent."
    ),
    llm_config=llm_config,
)

event_planner_agent = autogen.AssistantAgent(
    name="EventPlannerAgent",
    system_message=(
        "You are a central event planning assistant. Your role is to understand the user's event "
        "request, coordinate with the WeatherAgent and NewsAgent to gather necessary information, "
        "and then synthesize all gathered data into a comprehensive event recommendation. Suggest "
        "suitable outdoor event ideas based on weather and news. Once the recommendation is ready, "
        "present it clearly to the Admin. Conclude your final message to Admin with 'TERMINATE'."
    ),
    llm_config=llm_config,
)

print("Specialized agents created!")

# --------------------------------------------------
# Register tools
# --------------------------------------------------
user_proxy.register_for_execution(get_current_weather)
weather_agent.register_for_llm(
    name="get_current_weather",
    description="Gets the current weather for a specified location."
)(get_current_weather)

user_proxy.register_for_execution(get_latest_news)
news_agent.register_for_llm(
    name="get_latest_news",
    description="Gets the latest news articles for a specified topic and optional location."
)(get_latest_news)

print("Tools registered for execution and use by agents!")

# --------------------------------------------------
# GroupChat setup
# --------------------------------------------------
agents = [user_proxy, weather_agent, news_agent, event_planner_agent]

groupchat = autogen.GroupChat(
    agents=agents,
    messages=[],
    max_round=15,  # kept lower to avoid hitting Gemini free-tier rate limits
    speaker_selection_method="auto",
)

manager = autogen.GroupChatManager(
    groupchat=groupchat,
    llm_config=llm_config,
)

print("GroupChat and GroupChatManager created!")

# --------------------------------------------------
# Start the conversation
# --------------------------------------------------
event_query = (
    "I need to plan an outdoor picnic event in London this Saturday. What's the weather "
    "forecast, and are there any major local news or events happening that might affect it? "
    "Provide me with a recommendation."
)

print("\n--- Initiating Event Planning Conversation ---")

chat_history = user_proxy.initiate_chat(
    manager,
    message=event_query,
    clear_history=True,
    silent=False,
)

print("\n--- Event Planning Conversation Ended ---")