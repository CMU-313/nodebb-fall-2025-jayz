import os

from flask import Flask
from flask import request, jsonify
from translator import query_llm_robust

app = Flask(__name__)

@app.route("/")
def translator():
    content = request.args.get("content", default="", type=str)
    is_english, translated_content = query_llm_robust(content)
    return jsonify({
        "is_english": is_english,
        "translated_content": translated_content,
    })

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=int(os.environ.get("PORT", 8080)))