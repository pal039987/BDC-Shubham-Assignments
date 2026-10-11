import os
from dotenv import load_dotenv
from google import genai
from google.genai import types

load_dotenv()

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
AGENTOPS_API_KEY = os.getenv("AGENTOPS_API_KEY")

MODEL_NAME = "gemini-flash-lite-latest"

client = genai.Client(api_key=GOOGLE_API_KEY)

# --------------------------------------------------
# AgentOps is optional — only initialize if a key is set
# --------------------------------------------------
AGENTOPS_ENABLED = bool(AGENTOPS_API_KEY and AGENTOPS_API_KEY.strip())

if AGENTOPS_ENABLED:
    import agentops
    from agentops.sdk.decorators import agent, operation
    agentops.init(AGENTOPS_API_KEY, tags=["gemini-flash-lite-notebook"])
    print("AgentOps monitoring enabled!")
else:
    # Dummy no-op decorators so the code still runs without AgentOps
    def agent(name=None):
        def wrapper(cls):
            return cls
        return wrapper

    def operation(func):
        return func

    print("AgentOps key not set — running without monitoring.")

print("Setup complete!")

# --------------------------------------------------
# Simple single API call
# --------------------------------------------------
prompt = "Write a 12 word poem about secret agents."

response = client.models.generate_content(
    model=MODEL_NAME,
    contents=prompt,
    config=types.GenerateContentConfig(temperature=0.2),
)

print(response.text)

if AGENTOPS_ENABLED:
    agentops.end_session("Success")
    agentops.init(AGENTOPS_API_KEY, tags=["multi-agent-gemini-notebook"])


# --------------------------------------------------
# Multi-agent demo: QA agent + Engineer agent
# --------------------------------------------------
@agent(name="qa")
class QaAgent:
    def __init__(self):
        self.client = client

    @operation
    def completion(self, prompt: str) -> str:
        system_prompt = (
            "You are a QA engineer. Your task is to write Python unit tests. "
            "Only output Python code without any markdown formatting or code blocks. "
            "Focus on comprehensive test coverage."
        )

        response = self.client.models.generate_content(
            model=MODEL_NAME,
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=system_prompt,
                temperature=0.2,
            ),
        )
        return response.text


@agent(name="engineer")
class EngineerAgent:
    def __init__(self):
        self.client = client

    @operation
    def completion(self, prompt: str) -> str:
        system_prompt = (
            "You are a software engineer. Your task is to write clean, efficient Python code. "
            "Only output Python code without any markdown formatting or code blocks. "
            "Write well-documented, production-ready functions."
        )

        response = self.client.models.generate_content(
            model=MODEL_NAME,
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=system_prompt,
                temperature=0.2,
            ),
        )
        return response.text


qa = QaAgent()
engineer = EngineerAgent()

generated_func = engineer.completion("python function to test prime number")
print("\n--- Generated Function ---\n")
print(generated_func)

generated_test = qa.completion(
    "Write a python unit test that tests the following function:\n" + generated_func
)
print("\n--- Generated Unit Test ---\n")
print(generated_test)

if AGENTOPS_ENABLED:
    agentops.end_session("Success")