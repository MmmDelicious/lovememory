const axios = require('axios');

class AiService {
  async getChatResponse(prompt) {
    const gatewayUrl = process.env.AI_GATEWAY_URL;
    if (!gatewayUrl) {
      const error = new Error('AI Gateway URL is not configured.');
      error.statusCode = 500;
      throw error;
    }

    if (!prompt) {
      const error = new Error('Prompt is required');
      error.statusCode = 400;
      throw error;
    }

    try {
      console.log(`Forwarding prompt to AI Gateway: ${gatewayUrl}`);
      
      const response = await axios.post(
        gatewayUrl,
        { prompt },
        { proxy: false }
      );

      const text = response.data.choices[0]?.message?.content;
      if (!text) {
        throw new Error('Invalid response structure from gateway');
      }
      
      return { text };

    } catch (error) {
      console.error(`AI Gateway request failed: ${error.message}`);
      if (error.response) {
          console.error('--- Gateway Error Details ---');
          console.error('Status:', error.response.status);
          console.error('Data:', JSON.stringify(error.response.data, null, 2));
      }
      
      const serviceError = new Error('Failed to get response from AI Gateway.');
      // 502 Bad Gateway - более подходящий статус для ошибок от вышестоящих серверов
      serviceError.statusCode = 502;
      throw serviceError;
    }
  }
}

module.exports = new AiService();