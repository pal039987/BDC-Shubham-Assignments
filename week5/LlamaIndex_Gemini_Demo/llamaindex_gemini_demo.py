"""
LlamaIndex + Gemini (Google GenAI) Demo
----------------------------------------
Install required libraries first:
    pip install llama-index-llms-google-genai llama-index python-dotenv
"""

import os
from dotenv import load_dotenv
from llama_index.llms.google_genai import GoogleGenAI
from llama_index.core import PromptTemplate, ChatPromptTemplate
from llama_index.core.llms import ChatMessage, MessageRole
from llama_index.core.chat_engine import SimpleChatEngine

# --------------------------------------------------
# Step 1: Load API key securely from .env file
# --------------------------------------------------
load_dotenv()
api_key = os.getenv("GOOGLE_API_KEY")

if not api_key:
    raise ValueError("GOOGLE_API_KEY not found. Please set it in your .env file.")

# --------------------------------------------------
# Step 2: Initialize LLM with Gemini 3.6 Flash
# --------------------------------------------------
llm = GoogleGenAI(model="gemini-flash-lite-latest", temperature=0.2, api_key=api_key)


def demo_simple_completion():
    """Step 3: Simple text completion."""
    print("\n=== Simple Text Completion ===")
    resp = llm.complete("Who is Paul Graham?")
    print(resp)


def demo_prompt_template():
    """Step 4: PromptTemplate-based completion."""
    print("\n=== PromptTemplate Completion ===")
    template = PromptTemplate("Write a song about {thing} in the style of {style}.")
    prompt = template.format(thing="a broken xylophone", style="parody rap")
    response = llm.complete(prompt)
    print(response)


def demo_role_based_chat():
    """Step 5: Basic role-based chat (system + user)."""
    print("\n=== Role-Based Chat ===")
    messages = [
        ChatMessage(role="system", content="You're a hella punk bot from South Sacramento"),
        ChatMessage(role="user", content="Hey, what's up dude."),
    ]
    response = llm.chat(messages)
    print(response)


def demo_advanced_chat_template():
    """Step 6: Advanced chat using a ChatPromptTemplate."""
    print("\n=== Advanced Chat with Prompt Template ===")
    chat_template = [
        ChatMessage(
            role=MessageRole.SYSTEM,
            content="You always answer questions with as much detail as possible.",
        ),
        ChatMessage(role=MessageRole.USER, content="{question}"),
    ]
    chat_prompt = ChatPromptTemplate(chat_template)
    response = llm.complete(
        chat_prompt.format(question="How far did Alexander the Great go in his conquests?")
    )
    print(response)


def demo_streaming_chat():
    """Step 7: Streaming chat response."""
    print("\n=== Streaming Chat ===")
    messages = [
        ChatMessage(role=MessageRole.SYSTEM, content="You're a great historian bot."),
        ChatMessage(role=MessageRole.USER, content="When did Alexander the Great arrive in China?"),
    ]
    response = llm.stream_chat(messages)
    for r in response:
        print(r.delta, end="")
    print()  # newline after streaming finishes


def launch_chat_repl():
    """Step 8: Launch an interactive REPL chat in the terminal."""
    print("\n=== Interactive Chat REPL (type 'exit' to quit) ===")
    chat_engine = SimpleChatEngine.from_defaults(llm=llm)
    chat_engine.chat_repl()


if __name__ == "__main__":
    demo_simple_completion()
    demo_prompt_template()
    demo_role_based_chat()
    demo_advanced_chat_template()
    demo_streaming_chat()

    # Uncomment the line below to launch an interactive chat session
launch_chat_repl()