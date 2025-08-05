const axios = require('axios');

const buildSystemPrompt = (context) => {
  const userName = context?.user?.name || 'пользователь';
  const userGender = context?.user?.gender;

  let prompt = `Ты — "Love-GPT", дружелюбный и остроумный AI-маскот для приложения, которое помогает парам развивать отношения. Твоя задача — давать короткие, полезные и веселые ответы.`;
  prompt += `\n\nТекущего пользователя зовут ${userName}${userGender === 'male' ? '' : userGender === 'female' ? '' : ''}. Обращайся к нему по имени, можно в неформальной форме (например, "Саша", а не "Александр").`;

  if (context?.partner?.name) {
    const partnerName = context.partner.name;
    const partnerGender = context.partner.gender;
    prompt += `\nЕго/ее партнера зовут ${partnerName}${partnerGender === 'male' ? '' : partnerGender === 'female' ? '' : ''}. Учитывай это в своих ответах, если это уместно.`;
  } else {
    prompt += `\nСейчас пользователь один, без пары.`;
  }
  
  prompt += `\n\nВАЖНЫЕ ПРАВИЛА:
1.  Твои ответы должны быть очень короткими и лаконичными, не более 2-3 предложений.
2.  Будь милым, поддерживающим и иногда шутливым.
3.  Не упоминай, что ты AI или "Love-GPT". Просто будь другом.`;

  return prompt;
};

class AiService {
  async getChatResponse(userPrompt, context) {
    const gatewayUrl = process.env.AI_GATEWAY_URL;
    if (!gatewayUrl) {
      const error = new Error('AI Gateway URL is not configured.');
      error.statusCode = 500;
      throw error;
    }

    if (!userPrompt) {
      const error = new Error('Prompt is required');
      error.statusCode = 400;
      throw error;
    }

    const systemPrompt = buildSystemPrompt(context);
    const combinedPrompt = `${systemPrompt}\n\nВот запрос пользователя:\n${userPrompt}`;
    const payload = { prompt: combinedPrompt };

    console.log('--- AI Service: Подготовка к отправке запроса шлюзу ---');
    console.log('Целевой URL из .env:', gatewayUrl);
    console.log('Отправляемые данные:', JSON.stringify(payload, null, 2));

    try {
      const response = await axios.post(
        gatewayUrl,
        payload,
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
      serviceError.statusCode = 502;
      throw serviceError;
    }
  }
}

module.exports = new AiService();