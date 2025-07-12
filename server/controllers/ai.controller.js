const axios = require('axios');

const handleChat = async (req, res) => {
  const gatewayUrl = process.env.AI_GATEWAY_URL;
  if (!gatewayUrl) {
    return res.status(500).json({ message: 'AI Gateway URL is not configured.' });
  }

  const { prompt } = req.body;
  if (!prompt) {
    return res.status(400).json({ message: 'Prompt is required' });
  }

  try {
    console.log(`Forwarding prompt to AI Gateway: ${gatewayUrl}`);
    
    // Отправляем запрос на наш шлюз в Германии
    const response = await axios.post(
      gatewayUrl,
      { prompt },
      {
        // КЛЮЧЕВОЕ ИЗМЕНЕНИЕ: Отключаем использование любого системного прокси
        proxy: false
      }
    );

    // Ответ от шлюза уже содержит нужную структуру
    const text = response.data.choices[0]?.message?.content;
    if (!text) throw new Error('Invalid response structure from gateway');
    
    res.json({ text });

  } catch (error) {
    // Теперь эта ошибка будет приходить ТОЛЬКО если недоступен сам шлюз
    console.error(`AI Gateway request failed: ${error.message}`);
    if (error.response) {
        console.error('--- Gateway Error Details ---');
        console.error('Status:', error.response.status);
        console.error('Data:', JSON.stringify(error.response.data, null, 2));
    }
    res.status(500).json({ message: 'Failed to get response from AI Gateway.' });
  }
};

module.exports = {
  handleChat,
};