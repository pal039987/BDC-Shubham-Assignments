import os
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.tools import tool
from langgraph.prebuilt import create_react_agent

# Load API key securely from .env
load_dotenv()


# ============================================================
# Step 3: Define Tools
# ============================================================

@tool
def search(query: str) -> str:
    """Fake search tool to simulate looking up information"""
    fake_db = {
        "capital of france": "Paris",
        "weather in paris": "Today it's sunny in Paris with 25°C."
    }
    return fake_db.get(query.lower(), "No info found")


@tool
def calculator(expression: str) -> str:
    """Simple calculator tool"""
    try:
        return str(eval(expression))
    except Exception:
        return "Invalid expression"


# ============================================================
# Step 4: Build ReAct Agent using LangGraph's prebuilt agent
# ============================================================

llm = ChatGoogleGenerativeAI(
    model="gemini-1.5-flash",
    temperature=0.4,
    google_api_key=os.environ["GOOGLE_API_KEY"]
)

tools = [search, calculator]

agent = create_react_agent(llm, tools)


# ============================================================
# Step 5: Run the Agent
# ============================================================

question = "What is the capital of France and what's the weather in that city?"

result = agent.invoke({"messages": [("user", question)]})

print("🧠 Final Output:")
print(result["messages"][-1].content)