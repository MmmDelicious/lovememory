const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const handleChat = async (req, res) => {
  // Проверяем, включен ли режим заглушки
  if (process.env.USE_MOCK_AI === 'true') {
    const mockResponses = [
      "Это очень интересный вопрос! Давайте подумаем вместе.",
      "Я думаю, что лучшим решением будет устроить романтический ужин.",
      "Как насчет того, чтобы пересмотреть ваш любимый фильм?",
      "Я здесь, чтобы помочь. Что именно вас интересует?",
      "Отличная идея! Расскажите подробнее."
    ];
    const randomResponse = mockResponses[Math.floor(Math.random() * mockResponses.length)];
    
    // Имитируем задержку ответа от AI
    return setTimeout(() => {
      res.json({ text: randomResponse });
    }, 1200);
  }

  // Если заглушка выключена, обращаемся к реальному API
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ message: 'Prompt is required' });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    res.json({ text });
  } catch (error) {
    console.error('Error with Gemini API:', error);
    res.status(500).json({ message: 'Failed to get response from AI' });
  }
};

module.exports = {
  handleChat,
};