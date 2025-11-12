# NodeBB Translation API

A Flask-based translation service powered by Ollama that provides language detection and translation capabilities for NodeBB.

## Features

- **Language Detection**: Automatically detects the language of input text
- **Translation**: Translates non-English text to English
- **Multiple Models**: Support for various Ollama language models
- **Error Handling**: Graceful fallbacks when models are unavailable
- **Async Support**: Non-blocking API calls

## Quick Start

### Installation

1. Create a Python virtual environment:
```bash
python3 -m venv venv
source venv/bin/activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

### Running the API

1. Start Ollama (in one terminal):
```bash
ollama serve
```

2. Start the Flask API (in another terminal):
```bash
source venv/bin/activate
python app.py
```

The API will be available at `http://localhost:8080`

## API Usage

### Translation Endpoint

```
GET /?content=<text>
```

**Query Parameters:**
- `content` (string): The text to translate

**Response:**
```json
{
  "is_english": true|false,
  "translated_content": "translated text"
}
```

**Example:**
```bash
curl "http://localhost:8080/?content=Buenos%20días"
```

**Response:**
```json
{
  "is_english": false,
  "translated_content": "Good day"
}
```

## Configuration

### Environment Variables

- `OLLAMA_HOST`: Ollama server URL (default: `http://localhost:11434`)
- `PORT`: Flask server port (default: `8080`)
- `MODEL_NAME`: Ollama model to use (default: `qwen3:0.6b`)

### Supported Models

Edit `MODEL_NAME` in `translator.py` to change the model:

- `qwen3:0.6b` - Fast, compact (recommended for dev)
- `deepseek-r1:1.5b` - More accurate
- `gemma3:270m` - Balanced
- `llama3.1:8b` - Most capable
- `mistral:7b` - Good performance
- `smollm2:135m` - Very compact

## File Structure

```
api/
├── app.py                 # Flask application
├── translator.py          # Translation logic
├── test_translator.py     # Unit tests for translator
├── test_flask.py         # Unit tests for Flask app
├── requirements.txt       # Python dependencies
└── README.md             # This file
```

## Development

### Running Tests

```bash
source venv/bin/activate
python -m unittest test_translator.py -v
```

### Code Structure

#### `translator.py`
- `get_language(post)`: Detects the language of input text
- `get_translation(post)`: Translates text to English
- `query_llm_robust(post)`: Main function combining detection and translation with error handling

#### `app.py`
- Flask application with `/` endpoint
- Handles HTTP requests and responses
- Calls `query_llm_robust()` for processing

## Error Handling

The system has built-in fallback mechanisms:
- If language detection fails, assumes English
- If translation fails, returns original text
- Invalid responses are converted to strings and validated

## Performance

- **First request**: May take 2-5 seconds (model loading)
- **Subsequent requests**: 0.5-3 seconds depending on model
- **CPU mode**: ~2-5 seconds per request
- **GPU mode** (if available): ~0.5-1 second per request

## Troubleshooting

### Model not found
```bash
ollama pull qwen3:0.6b
```

### Connection refused
Ensure Ollama is running:
```bash
curl http://127.0.0.1:11434
```

### Port already in use
Change PORT environment variable:
```bash
PORT=8081 python app.py
```

## Docker

Build and run with Docker:

```bash
docker build -t nodebb-translator .
docker run -p 8080:8080 -e OLLAMA_HOST=http://host.docker.internal:11434 nodebb-translator
```

## Integration with NodeBB

The translation API is integrated into NodeBB via `src/translate/index.js`:

```javascript
translatorApi.translate = async function (postData) {
    const TRANSLATOR_API = "http://localhost:8080";
    const response = await fetch(`${TRANSLATOR_API}/?content=${encodeURIComponent(postData.content)}`);
    const data = await response.json();
    return [data.is_english, data.translated_content];
};
```

When NodeBB starts, the translation services are automatically initialized by `src/cli/running.js`.

## License

See the main NodeBB repository for license information.

## Contributing

To contribute improvements:

1. Create a new branch
2. Make your changes
3. Add tests for new functionality
4. Submit a pull request

## References

- [Ollama Documentation](https://github.com/ollama/ollama)
- [Flask Documentation](https://flask.palletsprojects.com/)
- [NodeBB Documentation](https://docs.nodebb.org/)