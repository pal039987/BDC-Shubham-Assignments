import autogen
import os
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
    "temperature": 0.7,  # Higher temperature for more creative negotiation responses
}

print("AutoGen environment and LLM configured!")

# --------------------------------------------------
# Project data
# --------------------------------------------------
project_tasks = {
    "Task A": {"effort": 5, "preferred_deadline": "Monday"},
    "Task B": {"effort": 3, "preferred_deadline": "Tuesday"},
    "Task C": {"effort": 7, "preferred_deadline": "Wednesday"},
    "Task D": {"effort": 4, "preferred_deadline": "Tuesday"},
    "Task E": {"effort": 6, "preferred_deadline": "Thursday"},
}

available_days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
daily_effort_capacity = 10  # Max effort an agent can handle per day

print("Project tasks and constraints defined!")


# --------------------------------------------------
# Mediator (UserProxyAgent)
# --------------------------------------------------
def is_termination_message(message):
    content = (message.get("content", "") or "").upper()
    return "AGREEMENT REACHED" in content or "NO AGREEMENT" in content or "TERMINATE" in content


user_proxy = autogen.UserProxyAgent(
    name="Mediator",
    human_input_mode="NEVER",
    max_consecutive_auto_reply=20,
    is_termination_msg=is_termination_message,
    code_execution_config=False,  # no code execution needed for a negotiation task
    system_message=(
        "You are an impartial mediator overseeing a task allocation negotiation. "
        "Your role is to initiate the negotiation, observe the proposals, and allow the agents "
        "to reach a conclusion. When either 'AGREEMENT REACHED' or 'NO AGREEMENT' is stated by "
        "the agents, conclude the chat with 'TERMINATE'."
    ),
)

print("UserProxyAgent 'Mediator' created!")

# --------------------------------------------------
# Negotiating Agents
# --------------------------------------------------
agent_a = autogen.AssistantAgent(
    name="Project_Manager_Alpha",
    system_message=(
        "You are Project Manager Alpha, a negotiator focused on efficiently allocating tasks for "
        "a project. Your primary goal is to ensure 'Task A' is completed by Monday and 'Task B' by "
        "Tuesday. You prefer to take on tasks with higher effort ratings if they align with your "
        "deadlines. When proposing a plan, list tasks assigned to you and their proposed deadlines. "
        "You must consider the daily_effort_capacity of 10 points per agent. If a satisfactory "
        "agreement is reached, state 'AGREEMENT REACHED'. If negotiations reach a deadlock, state "
        "'NO AGREEMENT'."
    ),
    llm_config=llm_config,
)

print("Agent A 'Project_Manager_Alpha' created!")

agent_b = autogen.AssistantAgent(
    name="Project_Manager_Beta",
    system_message=(
        "You are Project Manager Beta, a negotiator focused on ensuring smooth project execution "
        "and preventing delays. Your primary goal is to ensure 'Task C' is completed by Wednesday "
        "and no task extends beyond Thursday. You prefer tasks with lower effort ratings if "
        "possible, but are flexible for critical tasks. When proposing a plan, list tasks assigned "
        "to you and their proposed deadlines. You must consider the daily_effort_capacity of 10 "
        "points per agent. If a satisfactory agreement is reached, state 'AGREEMENT REACHED'. If "
        "negotiations reach a deadlock, state 'NO AGREEMENT'."
    ),
    llm_config=llm_config,
)

print("Agent B 'Project_Manager_Beta' created!")

# --------------------------------------------------
# GroupChat setup
# --------------------------------------------------
agents = [user_proxy, agent_a, agent_b]

groupchat = autogen.GroupChat(
    agents=agents,
    messages=[],
    max_round=15,  # lowered from 30 to stay within Gemini free-tier rate limits
    speaker_selection_method="auto",
    allow_repeat_speaker=False,
)

manager = autogen.GroupChatManager(
    groupchat=groupchat,
    llm_config=llm_config,
)

print("GroupChat and GroupChatManager created!")

# --------------------------------------------------
# Start the negotiation
# --------------------------------------------------
initial_negotiation_message = (
    f"Mediator: Project Managers Alpha and Beta, we need to allocate the following tasks "
    f"for the upcoming project. The total daily effort capacity for each of you is {daily_effort_capacity} points. "
    f"Here are the tasks with their effort and preferred deadlines:\n\n"
    f"{project_tasks}\n\n"
    f"Please discuss and propose a task allocation plan that satisfies both your primary goals "
    f"and the overall project constraints. Once an agreement is reached, state 'AGREEMENT REACHED' "
    f"and summarize the final plan. If you cannot agree, state 'NO AGREEMENT'. "
    f"Start your discussion."
)

print("\n--- Initiating Task Allocation Negotiation ---")

chat_history = user_proxy.initiate_chat(
    manager,
    message=initial_negotiation_message,
    clear_history=True,
    silent=False,
)

print("\n--- Negotiation Conversation Ended ---")