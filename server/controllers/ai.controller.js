const aiService = require('../services/ai.service');

const handleChat = async (req, res, next) => {
  try {
    const { prompt } = req.body;
    const result = await aiService.getChatResponse(prompt);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  handleChat,
};