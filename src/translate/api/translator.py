import os

from ollama import chat, ChatResponse, Client

MODEL_NAME = "qwen3:0.6b"  # @param ["qwen3:0.6b", "deepseek-r1:1.5b", "gemma3:270m", "llama3:135m", "mistral:7b", "smollm2:135m"]

# Get OLLAMA_HOST, if specified, or default to localhost:11434.
OLLAMA_URL = os.getenv("OLLAMA_HOST", "localhost:11434")

# Initialize the OpenAI client
client = Client(host=OLLAMA_URL)

def get_language(post: str) -> str:
    context = (
        "You are a language identification assistant. "
        "Identify the primary language of the user's message. "
        "Respond with only the name of the language in English "
        "(for example: 'English', 'German', 'French', 'Spanish', 'Japanese', 'Korean', 'Arabic', etc.). "
        "Do not include any punctuation, explanations, or extra text — "
        "just the language name itself."
    )

    response = client.chat(
        model=MODEL_NAME,
        messages=[
            {"role": "system", "content": context},
            {"role": "user", "content": post},
        ],
    )

    return response["message"]["content"].strip()

def get_translation(post: str) -> str:
    context = (
        "You are a professional translation assistant. "
        "Translate the user's message into clear, natural English. "
        "If the text is already in English, just rewrite it to be clear and fluent. "
        "Only return the translated text itself, without any explanations, labels, or quotes."
    )

    response = client.chat(
        model=MODEL_NAME,
        messages=[
            {"role": "system", "content": context},
            {"role": "user", "content": post},
        ],
    )

    return response["message"]["content"].strip()

def query_llm_robust(post: str) -> tuple[bool, str]:
    fallback_result: tuple[bool, str] = (True, post)

    try:
        raw_language = get_language(post)
    except Exception:
        return fallback_result

    if not isinstance(raw_language, str):
        raw_language = str(raw_language)

    lang_clean = raw_language.strip().lower()
    is_english = (lang_clean == "english")

    try:
        raw_translation = get_translation(post)
    except Exception:
        return (is_english, post)

    if not isinstance(raw_translation, str):
        translation = str(raw_translation)
    else:
        translation = raw_translation

    if not translation.strip():
        translation = post

    return (is_english, translation)