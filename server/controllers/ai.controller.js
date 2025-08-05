const aiService = require('../services/ai.service');

const handleChat = async (req, res, next) => {
  console.log('--- AI Controller: Начало обработки запроса ---');
  console.log('Тело запроса:', JSON.stringify(req.body, null, 2));
  try {
    const { prompt, context } = req.body;
    if (!prompt) {
      return res.status(400).json({ message: 'Prompt is required' });
    }
    const result = await aiService.getChatResponse(prompt, context);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  handleChat,
};