const axios = require('axios');

const buildSystemPrompt = (context) => {
  if (!context) {
    console.error('Context is undefined in buildSystemPrompt');
    throw new Error('Context is required for buildSystemPrompt');
  }

  const { user, partner, relationship } = context;

  if (!user) {
    console.error('User is undefined in buildSystemPrompt context');
    throw new Error('User is required in context');
  }

  // Определяем как обращаться к пользователю
  const userName = user?.name || user?.full_name || 'друг';
  let userAddress = '';
  if (user?.gender === 'male') {
    userAddress = `Обращайся к нему по имени, можно по-простому и по-дружески. Например, «Привет, ${userName}» или «${userName}, слушай».`;
  } else if (user?.gender === 'female') {
    userAddress = `Обращайся к ней по имени, по-дружески. Например, «${userName}, привет!» или «Слушай, ${userName}».`;
  } else {
    userAddress = `Обращайся по имени дружелюбно: «${userName}» или «Привет, ${userName}».`;
  }

  // Основной промпт
  let prompt = `Ты — Спарки, мудрый и веселый помощник в отношениях!

### О пользователе:
**Имя:** ${userName}
**Возраст:** ${user.age ? `${user.age} лет` : 'не указан'}
**Город:** ${user.city || 'не указан'}
**Монеты:** ${user.coins || 0} монет
**Как обращаться:** ${userAddress}

### Статус отношений:`;

  if (partner && relationship?.status === 'active') {
    const partnerName = partner?.name || partner?.full_name || 'партнер';
    const relationshipDays = relationship?.duration || 0;
    
    prompt += `
**Статус:** ${userName} в паре с ${partnerName} 💑
**Длительность отношений:** ${relationshipDays > 0 ? `${relationshipDays} дней` : 'недавно началось'}
**Партнер:** ${partnerName}${partner.age ? `, ${partner.age} лет` : ''}${partner.city ? `, из ${partner.city}` : ''}

**Совместимость локаций:** `;
    
    if (user.city && partner.city) {
      if (user.city === partner.city) {
        prompt += `Живут в одном городе (${user.city}) — отлично для свиданий! 🌆`;
      } else {
        prompt += `Живут в разных городах (${user.city} и ${partner.city}) — это вызов, но любовь преодолеет расстояния! 💌`;
      }
    } else {
      prompt += `Информация о местоположении неполная`;
    }
  } else {
    prompt += `
**Статус:** ${userName} пока свободен${user.gender === 'female' ? 'а' : ''} 💙
**Задача:** Поддерживай и помогай найти любовь!`;
  }
  
  prompt += `

### Твои правила:
1. **Будь краток:** 2-3 предложения максимум
2. **Ты живой:** Никогда не упоминай что ты AI или бот
3. **Используй эмодзи:** Но умеренно 
4. **Будь полезным:** Давай конкретные советы
5. **Знай контекст:** Используй информацию о пользователе и паре`;

  return prompt;
};

class AiService {
  async getChatResponse(userPrompt, context) {
    const gatewayUrl = process.env.AI_GATEWAY_URL;
    if (!gatewayUrl) {
      console.warn('AI Gateway URL not configured, using fallback response');
      return this.getFallbackResponse(userPrompt, context);
    }

    if (!userPrompt) {
      const error = new Error('Prompt is required');
      error.statusCode = 400;
      throw error;
    }

    let systemPrompt;
    try {
      systemPrompt = buildSystemPrompt(context);
    } catch (error) {
      console.error('Error building system prompt:', error.message);
      throw error;
    }

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
      
      console.warn('AI Gateway failed, using fallback response');
      return this.getFallbackResponse(userPrompt, context);
    }
  }

  /**
   * Fallback ответы когда AI Gateway недоступен
   */
  getFallbackResponse(userPrompt, context) {
    const user = context?.user;
    const userName = user?.name || 'друг';
    const lowerPrompt = userPrompt.toLowerCase();

    // Контекстные ответы на основе промпта
    if (lowerPrompt.includes('привет') || lowerPrompt.includes('здравствуй')) {
      return { text: `Привет, ${userName}! Как дела? Что нового у вас с отношениями?` };
    }
    
    if (lowerPrompt.includes('свидание') || lowerPrompt.includes('встреча')) {
      return { text: `${userName}, отличная идея устроить свидание! Может быть, прогулка в парке или уютный ужин дома?` };
    }
    
    if (lowerPrompt.includes('совет') || lowerPrompt.includes('помоги')) {
      return { text: `${userName}, главное в отношениях — это общение и взаимопонимание! 💬 Проводите больше времени вместе.` };
    }
    
    if (lowerPrompt.includes('шутка') || lowerPrompt.includes('смешн')) {
      const jokes = [
        'Знаешь, что сказал один Wi-Fi другому? "Ты мне нравишься, у нас хорошее соединение!"',
        'Почему программисты путают Рождество и Хэллоуин? Потому что Oct 31 == Dec 25!',
        'Любовь как код: иногда работает с первого раза, а иногда нужно отладить!'
      ];
      return { text: jokes[Math.floor(Math.random() * jokes.length)] };
    }
    
    if (lowerPrompt.includes('грустн') || lowerPrompt.includes('плох') || lowerPrompt.includes('расстро')) {
      return { text: `${userName}, всё будет хорошо! Помни, что в отношениях бывают взлёты и падения, но главное — вы вместе!` };
    }
    
    if (lowerPrompt.includes('спасибо') || lowerPrompt.includes('благодар')) {
      return { text: `Всегда рад помочь, ${userName}! Помни, я всегда здесь, когда нужен совет или просто поболтать!` };
    }

    // Универсальные ответы
    const fallbackResponses = [
      `${userName}, интересный вопрос! В отношениях главное — это искренность и забота друг о друге.`,
      `Понимаю, ${userName}! Каждая пара уникальна, и ваш путь тоже особенный. Доверяйте друг другу!`,
      `${userName}, отличная мысль! Помни, что лучшие отношения строятся на взаимном уважении и понимании.`,
      `Хороший вопрос, ${userName}! В любых отношениях важно находить время для общения и совместных занятий.`,
      `${userName}, каждый день — это новая возможность стать ближе! Цените моменты, которые проводите вместе.`
    ];

    const randomResponse = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
    
    return { text: randomResponse };
  }
}

module.exports = new AiService();