from dotenv import load_dotenv
load_dotenv()
import autogen
import os

from flask.cli import load_dotenv




print("AutoGen (AG2) imported!")

# --------------------------------------------------
# Task 1.2: Configure LLM (using Gemini instead of OpenAI)
# --------------------------------------------------
config_list_gemini = [
    {
        "model": "gemini-flash-lite-latest",
        "api_key": os.environ["GOOGLE_API_KEY"],
        "api_type": "google",
    }
]

print("LLM configuration loaded!")

# --------------------------------------------------
# Task 1.3: Define the Problem Scenario
# --------------------------------------------------
problem_statement = (
    "Write a Python function named `is_palindrome` that takes a string as input "
    "and returns `True` if it's a palindrome (reads the same forwards and backwards, "
    "ignoring case and spaces), and `False` otherwise. ...Provide at least two UNIQUE and CREATIVE test cases "
    "with expected outputs."
)

print("Problem statement defined:", problem_statement)

# --------------------------------------------------
# Task 2.1: Create the AssistantAgent
# --------------------------------------------------
assistant = autogen.AssistantAgent(
    name="PythonCoder",
    system_message=(
        "You are a helpful AI assistant that writes clean, functional Python code, "
        "provides explanations, and ensures correctness with test cases. "
        "Respond with 'TERMINATE' when the task is fully completed and all code "
        "and explanations are satisfactory."
    ),
    llm_config={
        "config_list": config_list_gemini,
        "temperature": 0.7,
        "timeout": 120,
    },
)

print("AssistantAgent 'PythonCoder' created!")

# --------------------------------------------------
# Task 2.2: Create the UserProxyAgent
# --------------------------------------------------
def is_termination_message(message):
    return "TERMINATE" in message.get("content", "").upper()

if not os.path.exists("coding_temp"):
    os.makedirs("coding_temp")

user_proxy = autogen.UserProxyAgent(
    name="User",
    human_input_mode="NEVER",
    max_consecutive_auto_reply=10,
    is_termination_msg=is_termination_message,
    code_execution_config={
        "work_dir": "coding_temp",
        "use_docker": False,
    },
)

print("UserProxyAgent 'User' created!")

# --------------------------------------------------
# Task 3.1: Start the Chat
# --------------------------------------------------
print("\n--- Initiating the Chat ---")

chat_result = user_proxy.initiate_chat(
    assistant,
    message=problem_statement,
    clear_history=True,
    silent=False,
)

print("\n--- Chat Ended ---")