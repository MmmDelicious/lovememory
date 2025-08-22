const aiService = require('../services/ai.service');
const handleChat = async (req, res, next) => {
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
