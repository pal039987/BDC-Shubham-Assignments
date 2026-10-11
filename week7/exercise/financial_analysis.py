import autogen
import os
from dotenv import load_dotenv
from duckduckgo_search import DDGS
import time

load_dotenv()

# --------------------------------------------------
# Configure LLM (using Gemini instead of OpenAI)
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
    "temperature": 0.2,  # Lower temperature for factual and analytical tasks
    "timeout": 120,
}

print("AutoGen environment, LLM, and Search Tool configured!")

# --------------------------------------------------
# Define a free web search tool (no API key needed)
# --------------------------------------------------
def web_search(query: str) -> str:
    """Search the web for a given query and return a summary of top results."""
    with DDGS() as ddgs:
        results = list(ddgs.text(query, max_results=5))
    if not results:
        return "No results found."
    formatted = "\n\n".join(
        f"Title: {r['title']}\nSnippet: {r['body']}\nURL: {r['href']}"
        for r in results
    )
    return formatted


financial_query = (
    "Perform a comprehensive financial analysis of Tesla (TSLA) for the last two quarters. "
    "Include revenue, net income, cash flow, debt, and recent news impacting its stock "
    "performance. Provide a summary of its current financial health and a brief outlook."
)

print("Financial analysis query defined:", financial_query)

# --------------------------------------------------
# UserProxyAgent (Admin)
# --------------------------------------------------
def is_termination_message(message):
    content = message.get("content", "") or ""
    return "TERMINATE" in content.upper() or "FINISH" in content.upper()

WORK_DIR = "financial_analysis_workdir"
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
        "A human administrator who manages the financial analysis team. "
        "Provide tasks and approve final reports. Conclude with 'TERMINATE' when satisfied."
    ),
)

print("UserProxyAgent 'Admin' created!")

# --------------------------------------------------
# Planner
# --------------------------------------------------
planner = autogen.AssistantAgent(
    name="Planner",
    system_message=(
        "You are an expert financial analysis planner. Your role is to receive a financial "
        "query, break it down into a clear, sequential plan of action for research, analysis, "
        "and reporting. Delegate tasks to the Researcher, Analyst, and Reporter. Ensure all "
        "parts of the initial query are addressed. Output the plan and then instruct the next agent."
    ),
    llm_config=llm_config,
)

print("PlannerAgent 'Planner' created!")

# --------------------------------------------------
# Researcher (with web search tool)
# --------------------------------------------------
researcher = autogen.AssistantAgent(
    name="Researcher",
    system_message=(
        "You are a highly skilled financial researcher. You are equipped with a web_search tool. "
        "Your task is to use the search tool to find recent financial data, news articles, "
        "and relevant reports related to the query. Present the factual findings clearly, citing "
        "sources where possible. Do not analyze, just gather and present raw information. "
        "Once research is complete, return the findings to the Analyst."
    ),
    llm_config=llm_config,
)

# Register the search tool: Researcher can call it, Admin executes it
@user_proxy.register_for_execution()
@researcher.register_for_llm(description="Search the web for financial news, data, and reports.")
def web_search_tool(query: str) -> str:
    return web_search(query)

print("ResearcherAgent 'Researcher' created and search tool registered!")

# --------------------------------------------------
# Analyst
# --------------------------------------------------
analyst = autogen.AssistantAgent(
    name="Analyst",
    system_message=(
        "You are a highly analytical financial expert. Your role is to take the raw research "
        "findings from the Researcher and perform a thorough financial analysis. Identify key "
        "financial metrics (revenue, net income, cash flow, debt), trends, and significant news "
        "impacts. Synthesize these into concise insights. Present your analysis to the Reporter."
    ),
    llm_config=llm_config,
)

print("AnalystAgent 'Analyst' created!")

# --------------------------------------------------
# Reporter
# --------------------------------------------------
reporter = autogen.AssistantAgent(
    name="Reporter",
    system_message=(
        "You are a professional financial report writer. Your task is to take the analysis from "
        "the Analyst and compile it into a comprehensive, well-structured financial report. "
        "The report should have an introduction, sections for key financial data, trends, impact "
        "of news, a summary of financial health, and a brief outlook. Ensure clarity, conciseness, "
        "and professionalism. Present the final report to the Admin. Conclude your final message "
        "to Admin with 'TERMINATE'."
    ),
    llm_config=llm_config,
)

print("ReporterAgent 'Reporter' created!")

# --------------------------------------------------
# GroupChat setup
# --------------------------------------------------
agents = [user_proxy, planner, researcher, analyst, reporter]

groupchat = autogen.GroupChat(
    agents=agents,
    messages=[],
    max_round=5,
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
print("\n--- Initiating Financial Analysis Conversation ---")

chat_history = user_proxy.initiate_chat(
    manager,
    message=financial_query,
    clear_history=True,
    silent=False,
)

print("\n--- Financial Analysis Conversation Ended ---")