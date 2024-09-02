import os
from typing import List, Dict, Any
from flask import Flask, request, jsonify
from flask_cors import CORS
import requests

# Importing Groq and Gemini API clients
from groq import Groq
import google.generativeai as genai

app = Flask(__name__)
CORS(app)

# Configure API keys
GROQ_API_KEY = "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"
GEMINI_API_KEY = "AIzaSyBi_46ImoqYxa69XDTUA2fjSQQjhuFhfuY"

# Initialize Groq client
groq_client = Groq(api_key=GROQ_API_KEY)

# Configure Gemini API
genai.configure(api_key=GEMINI_API_KEY)

# Supported chatbot models for Groq and Gemini, including experimental models
GROQ_MODELS = [
    "llama3-8b-8192",
    "llama3-70b-8192",
    "mixtral-8x7b-32768",
    "gemma-7b-it",
    "gemma2-9b-it",
    "llama3-groq-70b-8192-tool-use-preview",
    "llama3-groq-8b-8192-tool-use-preview",
    "llama-3.1-70b-versatile",
    "llama-3.1-8b-instant",
    "llama-guard-3-8b",
    "llama3-70b-8192"
]

GEMINI_MODELS = [
    "gemini-1.5-flash",
    "gemini-1.5-pro",
    "gemini-1.0-pro",
    "gemini-1.5-pro-exp-0801",
    "gemini-1.5-pro-exp-0827",
    "gemini-1.5-flash-exp-0827",
    "gemini-1.5-flash-8b-exp-0827"
]

def initialize_chatbot(model_name: str) -> Dict[str, Any]:
    if model_name in GROQ_MODELS:
        return {
            "client": groq_client,
            "model": model_name,
            "type": "groq"
        }
    elif model_name in GEMINI_MODELS:
        return {
            "client": genai,
            "model": model_name,
            "type": "gemini"
        }
    else:
        raise ValueError("Unsupported model name")

def chat_with_model(chatbot: Dict[str, Any], messages: List[Dict[str, str]]) -> str:
    if chatbot["type"] == "groq":
        response = chatbot["client"].chat.completions.create(
            model=chatbot["model"],
            messages=messages,
            max_tokens=1024,
            temperature=0.5,
            top_p=1
        )
        return response.choices[0].message.content
    elif chatbot["type"] == "gemini":
        model = genai.GenerativeModel(chatbot["model"])
        response = model.generate_content(messages[-1]["content"])
        return response.text
    else:
        raise ValueError("Unsupported chatbot type")

@app.route('/chat', methods=['POST'])
def chat():
    data = request.json
    message = data.get('message')
    chat_id = data.get('chat_id')
    model_name = data.get('model')

    if not message or not chat_id or not model_name:
        return jsonify({'error': 'Message, chat_id, and model are required'}), 400

    if chat_id not in chats:
        chats[chat_id] = []

    chatbot = initialize_chatbot(model_name)
    conversation_history = chats[chat_id] + [{"role": "user", "content": message}]
    response = chat_with_model(chatbot, conversation_history)

    chats[chat_id].append({"role": "assistant", "content": response})

    return jsonify({'response': response})

if __name__ == "__main__":
    import os
    chats = {}
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)