import os
from dotenv import load_dotenv
from flask import Flask, request, jsonify
from flask_cors import CORS
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage

load_dotenv()

app = Flask(__name__)
CORS(app)

llm = ChatGoogleGenerativeAI(model="gemini-flash-lite-latest", temperature=0.3)


@app.route("/v1/chat/completions", methods=["POST"])
def chat_completion():
    data = request.get_json()
    messages = data.get("messages", [])

    langchain_messages = []
    for message in messages:
        role = message.get("role")
        content = message.get("content")
        if role == "user":
            langchain_messages.append(HumanMessage(content=content))
        elif role == "assistant":
            langchain_messages.append(AIMessage(content=content))
        elif role == "system":
            langchain_messages.append(SystemMessage(content=content))

    try:
        response = llm.invoke(langchain_messages)
        content = response.content

        return jsonify({
            "choices": [
                {
                    "message": {
                        "role": "assistant",
                        "content": content
                    }
                }
            ]
        })
    except Exception as e:
        print(f"Error during LLM invocation: {e}")
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(port=8000)