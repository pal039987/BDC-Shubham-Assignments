import os
import time
import google.generativeai as genai
from dotenv import load_dotenv

# ==========================================================================
# PART 1: INITIAL SETUP AND CORE PROMPT DESIGN
# ==========================================================================

# Task 1.1: API Configuration
load_dotenv()
GOOGLE_API_KEY = os.getenv("GEMINI_API_KEY")

if not GOOGLE_API_KEY:
    # If no key found in .env, replace with your actual API key here:
    GOOGLE_API_KEY = "YOUR_API_KEY_HERE"

genai.configure(api_key=GOOGLE_API_KEY)

# Initializing Gemini model (using gemini-3.8-flash for optimized performance)
model = genai.GenerativeModel('gemini-flash-lite-latest')
print("API configured and Gemini model loaded!")

# Task 1.2: Crafting the Core Prompt
core_prompt = """You are a helpful and concise Q&A assistant.
Answer questions directly and briefly.
Do not include conversational fillers or greetings (e.g., "Hello", "Sure", "Is there anything else?").
If you don't have enough information to answer a question, respond strictly with: "I don't have enough information to answer that." """

print("\n--- Core Prompt Defined ---")
print(core_prompt)

# Task 1.3: Testing the Core Prompt
def get_response(prompt_text):
    try:
        response = model.generate_content(prompt_text)
        return response.text.strip()
    except Exception as e:
        return f"Error: {e}"

print("\n--- Task 1.3: Testing Core Prompt ---")

test_question_1 = "What is the capital of France?"
full_prompt_1 = core_prompt + "\nUser: " + test_question_1
print(f"\nUser: {test_question_1}")
print(f"Bot: {get_response(full_prompt_1)}")

test_question_2 = "Explain quantum entanglement in simple terms."
full_prompt_2 = core_prompt + "\nUser: " + test_question_2
print(f"\nUser: {test_question_2}")
print(f"Bot: {get_response(full_prompt_2)}")

test_question_3 = "What is the current population of Mars?"
full_prompt_3 = core_prompt + "\nUser: " + test_question_3
print(f"\nUser: {test_question_3}")
print(f"Bot: {get_response(full_prompt_3)}")


# ==========================================================================
# PART 2: BUILDING THE CHAT LOOP AND HISTORY MANAGEMENT
# ==========================================================================

# Task 2.1: Implementing Conversational History
def create_chatbot(system_prompt):
    # Initialize a chat session pre-seeded with system instructions
    chat = model.start_chat(history=[
        {'role': 'user', 'parts': [system_prompt]},
        {'role': 'model', 'parts': ['OK. I understand the rules and will adhere strictly to them.']}
    ])
    return chat

def send_message_to_chatbot(chat_session, user_message):
    try:
        response = chat_session.send_message(user_message)
        return response.text.strip()
    except Exception as e:
        return f"Error: {e}"

my_chatbot = create_chatbot(core_prompt)
print("\n--- Task 2.1: Testing Chatbot with History ---")

print("\nUser: What is the largest ocean on Earth?")
response_1 = send_message_to_chatbot(my_chatbot, "What is the largest ocean on Earth?")
print(f"Bot: {response_1}")

print("\nUser: And how deep is its deepest point?")
response_2 = send_message_to_chatbot(my_chatbot, "And how deep is its deepest point?")
print(f"Bot: {response_2}")

print("\nUser: What is the highest mountain on land?")
response_3 = send_message_to_chatbot(my_chatbot, "What is the highest mountain on land?")
print(f"Bot: {response_3}")

print("\nUser: Is it taller than the deepest point you mentioned earlier?")
response_4 = send_message_to_chatbot(my_chatbot, "Is it taller than the deepest point you mentioned earlier?")
print(f"Bot: {response_4}")


# Task 2.2: Building the Interactive Chat Loop
def run_chatbot_conversation(initial_prompt):
    print("\n--- Starting Chatbot Conversation ---")
    print("Type 'quit', 'exit', or 'bye' to end the conversation.")

    chat = create_chatbot(initial_prompt)

    while True:
        user_input = input("\nUser: ")
        if user_input.lower() in ['quit', 'exit', 'bye']:
            print("Bot: Goodbye!")
            break

        bot_response = send_message_to_chatbot(chat, user_input)
        print(f"Bot: {bot_response}")

# Uncomment below to run interactive chat mode:
# run_chatbot_conversation(core_prompt)


# ==========================================================================
# PART 3: ADVANCED PROMPTING AND REFINEMENTS (BONUS)
# ==========================================================================

# Task 3.1: Adding Domain-Specific Knowledge & Constraints
domain_core_prompt = """You are a domain-specific Q&A assistant specialized ONLY in the Roman Empire.
Answer questions directly and concisely in 1-2 sentences.
Rules:
1. Do not use greetings or fillers.
2. Answer questions ONLY related to the history, culture, or figures of the Roman Empire.
3. If a question is outside the scope of the Roman Empire or you lack information, respond with: "I can only answer questions related to the Roman Empire." """

print("\n--- Task 3.1: Testing Domain-Constrained Chatbot ---")
roman_bot = create_chatbot(domain_core_prompt)

q1 = "Who was the first emperor of Rome?"
print(f"\nUser: {q1}")
print(f"Bot: {send_message_to_chatbot(roman_bot, q1)}")

q2 = "When did the Western Roman Empire fall?"
print(f"\nUser: {q2}")
print(f"Bot: {send_message_to_chatbot(roman_bot, q2)}")

q3 = "What is the recipe for baking chocolate chip cookies?"
print(f"\nUser: {q3}")
print(f"Bot: {send_message_to_chatbot(roman_bot, q3)}")