import unittest
from unittest.mock import patch, MagicMock
from translator import get_language, get_translation, query_llm_robust

class TestTranslator(unittest.TestCase):
    @patch('translator.client')
    def test_get_language_english(self, mock_client):
        mock_response = MagicMock()
        mock_response["message"] = {"content": "English"}
        mock_client.chat.return_value = mock_response
        
        result = get_language("Hello, how are you?")
        self.assertEqual(result, "English")

    @patch('translator.client')
    def test_get_language_spanish(self, mock_client):
        mock_response = MagicMock()
        mock_response["message"] = {"content": "Spanish"}
        mock_client.chat.return_value = mock_response
        
        result = get_language("¡Hola! ¿Cómo estás?")
        self.assertEqual(result, "Spanish")

    @patch('translator.client')
    def test_get_translation(self, mock_client):
        mock_response = MagicMock()
        mock_response["message"] = {"content": "Hello, how are you?"}
        mock_client.chat.return_value = mock_response
        
        result = get_translation("¡Hola! ¿Cómo estás?")
        self.assertEqual(result, "Hello, how are you?")

    @patch('translator.get_language')
    @patch('translator.get_translation')
    def test_query_llm_robust_english(self, mock_translation, mock_language):
        mock_language.return_value = "English"
        mock_translation.return_value = "Hello, how are you?"
        
        is_english, translation = query_llm_robust("Hello, how are you?")
        self.assertTrue(is_english)
        self.assertEqual(translation, "Hello, how are you?")

    @patch('translator.get_language')
    @patch('translator.get_translation')
    def test_query_llm_robust_spanish(self, mock_translation, mock_language):
        mock_language.return_value = "Spanish"
        mock_translation.return_value = "Hello, how are you?"
        
        is_english, translation = query_llm_robust("¡Hola! ¿Cómo estás?")
        self.assertFalse(is_english)
        self.assertEqual(translation, "Hello, how are you?")

    @patch('translator.get_language')
    def test_query_llm_robust_language_error(self, mock_language):
        mock_language.side_effect = Exception("API Error")
        
        is_english, translation = query_llm_robust("Hello")
        self.assertTrue(is_english)
        self.assertEqual(translation, "Hello")

    @patch('translator.get_language')
    @patch('translator.get_translation')
    def test_query_llm_robust_translation_error(self, mock_translation, mock_language):
        mock_language.return_value = "Spanish"
        mock_translation.side_effect = Exception("API Error")
        
        text = "¡Hola! ¿Cómo estás?"
        is_english, translation = query_llm_robust(text)
        self.assertFalse(is_english)
        self.assertEqual(translation, text)

if __name__ == '__main__':
    unittest.main()