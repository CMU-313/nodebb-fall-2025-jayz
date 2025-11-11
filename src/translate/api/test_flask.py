import unittest
from unittest.mock import patch
from app import app

class TestFlaskApp(unittest.TestCase):
    def setUp(self):
        self.app = app.test_client()
        self.app.testing = True

    @patch('app.query_llm_robust')
    def test_translator_endpoint_english(self, mock_query):
        mock_query.return_value = (True, "Hello, how are you?")
        
        response = self.app.get('/?content=Hello%2C%20how%20are%20you%3F')
        data = response.get_json()
        
        self.assertEqual(response.status_code, 200)
        self.assertTrue(data['is_english'])
        self.assertEqual(data['translated_content'], "Hello, how are you?")

    @patch('app.query_llm_robust')
    def test_translator_endpoint_spanish(self, mock_query):
        mock_query.return_value = (False, "Hello, how are you?")
        
        response = self.app.get('/?content=%C2%A1Hola%21%20%C2%BFC%C3%B3mo%20est%C3%A1s%3F')
        data = response.get_json()
        
        self.assertEqual(response.status_code, 200)
        self.assertFalse(data['is_english'])
        self.assertEqual(data['translated_content'], "Hello, how are you?")

    def test_translator_endpoint_empty_content(self):
        response = self.app.get('/')
        data = response.get_json()
        
        self.assertEqual(response.status_code, 200)
        self.assertTrue(isinstance(data['is_english'], bool))
        self.assertEqual(data['translated_content'], "")

if __name__ == '__main__':
    unittest.main()