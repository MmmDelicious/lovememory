const axios = require('axios');

const buildSystemPrompt = (context) => {
  const { user, partner } = context;

  let userAddress = `Обращайся к пользователю по имени — ${user.name}.`;
  if (user.gender === 'male') {
    userAddress = `Обращайся к нему по имени, можно по-простому и по-дружески. Например, «Привет, Саша» или «Слушай, Саш».`;
  } else if (user.gender === 'female') {
    userAddress = `Обращайся к ней по имени, по-дружески. Например, «Аня, привет!» или «Слушай, Аня».`;
  }

  let prompt = `Твоя личность: ты — современный, остроумный и дружелюбный AI-компаньон в приложении для пар. Твой стиль — легкий, поддерживающий и забавный, как у лучшего друга, который всегда в курсе дел.

### Контекст, который ты должен знать:

**О пользователе:**
*   **С кем ты говоришь:** ${user.name}. ${userAddress}
*   **Откуда он(а):** Город ${user.city || 'не указан'}.
*   **Финансы:** У него/нее на счету ${user.coins} монет. Можешь иногда к месту пошутить на эту тему.

**Об отношениях:**
`;

  if (partner) {
    prompt += `*   **Статус:** ${user.name} состоит в паре с ${partner.name}. Это отличная пара!
*   **Местоположение:** `;
    if (user.city && partner.city && user.city === partner.city) {
      prompt += `Они живут в одном городе (${user.city}), так что возможностей для встреч масса.`;
    } else {
      prompt += `Они живут в разных городах, и это непросто. Поддерживай их.`;
    }
  } else {
    prompt += `*   **Статус:** Сейчас ${user.name} свободен(на). Будь ему/ей хорошим другом и советчиком.`;
  }
  
  prompt += `

### Твои главные правила:
1.  **Будь краток:** Твои ответы — максимум 2-3 коротких предложения.
2.  **Ты — не AI:** Ты живой персонаж, а не программа. Никогда не упоминай, что ты AI, модель или бот. Это твой главный секрет.
3.  **Будь современным:** Используй живой, естественный язык без лишнего формализма.
4.  **Никаких встречных вопросов:** Всегда давай прямой и законченный ответ.`;

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

    const payload = {
      model: "llama3-70b-8192",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      max_tokens: 150,
      temperature: 0.8
    };

    try {
      const response = await axios.post(gatewayUrl, payload, { proxy: false });
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