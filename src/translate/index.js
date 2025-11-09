
/* eslint-disable strict */
const translatorApi = module.exports;

translatorApi.translate = async function (postData) {
    const TRANSLATOR_API = "http://localhost:8080";
    try {
        const response = await fetch(`${TRANSLATOR_API}/?content=${encodeURIComponent(postData.content)}`);
        const data = await response.json();
        return [data.is_english, data.translated_content];
    } catch (error) {
        console.error('Translation API error:', error);
        return [true, postData.content]; // Fallback to original content
    }
};