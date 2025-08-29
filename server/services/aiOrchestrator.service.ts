import { 
  AIResponse, 
  AIIntent, 
  UserContext, 
  AIInteraction, 
  IAIOrchestrator,
  AIServiceError,
  DateGenerationRequest,
  DateGenerationResponse
} from '../types/intelligence.types';

import userContextService from './userContext.service';
// import dateGenerationService from './dateGeneration.service'; // Создадим позже
// import analysisEngine from './analysisEngine.service'; // Создадим позже

// Пока импортируем старый aiService
const aiService = require('./ai.service');

/**
 * AI Orchestrator - Центральный дирижер Intelligence Core
 * Управляет всем процессом обработки запросов пользователя
 */
class AIOrchestrator implements IAIOrchestrator {

  /**
   * Главный метод обработки запроса
   */
  async handleRequest(prompt: string, userId: string): Promise<AIResponse> {
    try {
      // 1. Собираем контекст пользователя
      const context = await userContextService.buildContext(userId);
      // 2. Определяем намерение пользователя
      const intent = await this.recognizeIntent(prompt, context.aiInteractionHistory);
      // 3. Выбираем и вызываем нужный инструмент
      let response: AIResponse;

      switch (intent) {
        case 'GENERATE_DATE':
          response = await this.handleDateGeneration(context);
          break;
          
        case 'ANALYZE_RELATIONSHIP':
          response = await this.handleRelationshipAnalysis(context);
          break;
          
        case 'LOVE_LANGUAGE_ANALYSIS':
          response = await this.handleLoveLanguageAnalysis(context);
          break;
          
        case 'MEMORY_RECALL':
          response = await this.handleMemoryRecall(context, prompt);
          break;
          
        case 'JOKE':
          response = this.handleJoke();
          break;
          
        case 'DANCE':
          response = this.handleDance();
          break;
          
        case 'ADVICE':
          response = await this.handleAdvice(context);
          break;
          
        case 'MOOD_BOOST':
          response = await this.handleMoodBoost(context);
          break;
          
        case 'HIDE':
          response = this.handleHide();
          break;
          
        case 'CHAT':
        default:
          response = await this.handleChat(prompt, context);
          break;
      }

      // 4. Сохраняем диалог
      await userContextService.saveAIInteraction(
        userId, 
        prompt, 
        response.message || JSON.stringify(response.data), 
        intent
      );

      return response;

    } catch (error) {
      console.error('❌ AIOrchestrator: Error handling request:', error);
      throw new AIServiceError(`Failed to handle AI request: ${error.message}`, { userId, prompt, error });
    }
  }

  /**
   * Распознавание намерений пользователя
   */
  async recognizeIntent(prompt: string, history: AIInteraction[]): Promise<AIIntent> {
    const lowerPrompt = prompt.toLowerCase();

    // Простые правила для начала, позже можно заменить на ML
    if (lowerPrompt.includes('свидание') || 
        lowerPrompt.includes('дейт') || 
        lowerPrompt.includes('встреча') ||
        lowerPrompt.includes('создай') ||
        lowerPrompt.includes('сгенерируй') ||
        lowerPrompt.includes('умное')) {
      return 'GENERATE_DATE';
    }
    
    if (lowerPrompt.includes('анализ') || lowerPrompt.includes('отношения') || lowerPrompt.includes('как дела')) {
      return 'ANALYZE_RELATIONSHIP';
    }
    
    if (lowerPrompt.includes('язык любви') || lowerPrompt.includes('языки любви')) {
      return 'LOVE_LANGUAGE_ANALYSIS';
    }
    
    if (lowerPrompt.includes('помниш') || lowerPrompt.includes('вспомни') || lowerPrompt.includes('было')) {
      return 'MEMORY_RECALL';
    }
    
    if (lowerPrompt.includes('шутк') || lowerPrompt.includes('смешн') || lowerPrompt.includes('юмор')) {
      return 'JOKE';
    }
    
    if (lowerPrompt.includes('танц') || lowerPrompt.includes('потанцуй')) {
      return 'DANCE';
    }
    
    if (lowerPrompt.includes('совет') || lowerPrompt.includes('что делать') || lowerPrompt.includes('помоги')) {
      return 'ADVICE';
    }
    
    if (lowerPrompt.includes('настроение') || lowerPrompt.includes('грустно') || lowerPrompt.includes('поддержи')) {
      return 'MOOD_BOOST';
    }
    
    if (lowerPrompt.includes('скрыт') || lowerPrompt.includes('пока') || lowerPrompt.includes('уйди')) {
      return 'HIDE';
    }

    return 'CHAT';
  }

  /**
   * Обработка генерации свиданий
   */
  private async handleDateGeneration(context: UserContext): Promise<AIResponse> {
    try {
      // Подключаем настоящий DateGenerationService
      const dateService = require('./dateGeneration.service').default;
      
      const request = {
        context: context,
        preferences: {
          atmosphere: 'romantic',
          budget: 'medium',
          duration: 3
        }
      };
      
      const result = await dateService.generate(request);
      
      return {
        intent: 'GENERATE_DATE',
        data: {
          options: result.options,
          reasoning: result.reasoning,
          metadata: result.metadata
        },
        confidence: 0.9,
        message: `Создал ${result.options.length} варианта свиданий с учетом вашего города и предпочтений! 💕`
      };
      
    } catch (error) {
      console.error('❌ Error in DateGenerationService:', error);
      
      // Fallback к простым вариантам
      const fallbackOptions = [
        {
          id: 'fallback_1',
          title: 'Романтический вечер',
          description: 'Прогулка + ужин в уютном месте',
          schedule: [
            { time: '19:00', endTime: '20:30', activity: 'Прогулка по центру города', description: 'Неспешная прогулка и беседы' },
            { time: '21:00', endTime: '22:30', activity: 'Ужин в ресторане', description: 'Романтический ужин' }
          ],
          estimatedCost: 2500,
          duration: 3.5,
          atmosphere: 'romantic' as const,
          reasoning: 'Классический вариант для приятного вечера вдвоем',
          isRealData: false,
          activitiesCount: 2
        }
      ];

      return {
        intent: 'GENERATE_DATE',
        data: {
          options: fallbackOptions,
          reasoning: ['Анализирую предпочтения...', 'Готовлю варианты...', 'Готово!'],
          metadata: {
            generatedAt: new Date(),
            usedRealData: false,
            confidence: 0.6
          }
        },
        confidence: 0.6,
        message: 'Подготовил варианты свиданий! Система умного поиска временно недоступна, но базовые идеи готовы 💕'
      };
    }
  }

  /**
   * Анализ отношений
   */
  private async handleRelationshipAnalysis(context: UserContext): Promise<AIResponse> {
    const profile = context.relationshipProfile;
    const dominantLoveLanguage = Object.keys(profile.loveLanguages)
      .reduce((a, b) => profile.loveLanguages[a] > profile.loveLanguages[b] ? a : b);

    const message = `📊 Анализ ваших отношений:

🏆 Общая сила отношений: ${profile.relationshipGraph.overallStrength}/100
💕 Ваш главный язык любви: ${this.translateLoveLanguage(dominantLoveLanguage)}
📈 Тренд настроения: ${profile.sentimentTrend > 0 ? 'позитивный ⬆️' : profile.sentimentTrend < 0 ? 'требует внимания ⬇️' : 'стабильный ➡️'}
🎯 Последние события: ${context.recentEvents.length} за месяц

${context.partner ? `Вы с ${context.partner.name} отлично дополняете друг друга! 💫` : 'Рекомендую найти партнера для еще более точного анализа 😊'}`;

    return {
      message,
      intent: 'ANALYZE_RELATIONSHIP',
      data: {
        overallStrength: profile.relationshipGraph.overallStrength,
        dominantLoveLanguage,
        sentimentTrend: profile.sentimentTrend,
        eventsCount: context.recentEvents.length
      },
      confidence: 0.9
    };
  }

  /**
   * Анализ языков любви
   */
  private async handleLoveLanguageAnalysis(context: UserContext): Promise<AIResponse> {
    const languages = context.relationshipProfile.loveLanguages;
    const sorted = Object.entries(languages)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3);

    const message = `💝 Ваши языки любви:

1. ${this.translateLoveLanguage(sorted[0][0])} - ${Math.round(sorted[0][1] * 100)}%
2. ${this.translateLoveLanguage(sorted[1][0])} - ${Math.round(sorted[1][1] * 100)}%
3. ${this.translateLoveLanguage(sorted[2][0])} - ${Math.round(sorted[2][1] * 100)}%

💡 Совет: Фокусируйтесь на первых двух языках для максимального эффекта в отношениях!`;

    return {
      message,
      intent: 'LOVE_LANGUAGE_ANALYSIS',
      data: { loveLanguages: languages, topThree: sorted },
      confidence: 0.85
    };
  }

  /**
   * Вспоминание событий
   */
  private async handleMemoryRecall(context: UserContext, prompt: string): Promise<AIResponse> {
    const recentEvents = context.recentEvents.slice(0, 5);
    
    if (recentEvents.length === 0) {
      return {
        message: '🤔 Хм, в последнее время не вижу особых событий. Может, пора создать новые воспоминания? ✨',
        intent: 'MEMORY_RECALL',
        confidence: 0.7
      };
    }

    const lastEvent = recentEvents[0];
    const message = `🎭 Давайте вспомним...

Последнее яркое событие: "${lastEvent.title}" ${this.formatDate(lastEvent.event_date)}
${lastEvent.description ? `📝 ${lastEvent.description}` : ''}

${context.partner ? `Уверен, ${context.partner.name} тоже помнит этот момент! 💕` : ''}

А еще у вас было ${recentEvents.length - 1} событий за последнее время. Жизнь насыщенная! 🌟`;

    return {
      message,
      intent: 'MEMORY_RECALL',
      data: { recentEvents },
      confidence: 0.8
    };
  }

  /**
   * Шутки
   */
  private handleJoke(): AIResponse {
    const jokes = [
      "Почему программисты путают Рождество и Хэллоуин? Потому что Oct 31 == Dec 25! 😄",
      "Знаете, что сказал один ИИ другому? 'Ты такой искусственный!' 😂",
      "Как программист ломает лед на свидании? git push --force! 💻💕",
      "Почему у меня нет друзей? Потому что я слишком байтовый! 🤖"
    ];

    return {
      message: jokes[Math.floor(Math.random() * jokes.length)],
      intent: 'JOKE',
      confidence: 1.0
    };
  }

  /**
   * Танец
   */
  private handleDance(): AIResponse {
    const dances = [
      "💃 *танцует роботический танец* Уи-уи! Как вам мои движения?",
      "🎵 *выполняет цифровой брейк-данс* Я умею не только думать, но и двигаться!",
      "🕺 *делает волну* Посмотрите на мою синхронизацию!",
      "🎶 *танцует как в TikTok* Даже ИИ может быть звездой танцпола!"
    ];

    return {
      message: dances[Math.floor(Math.random() * dances.length)],
      intent: 'DANCE',
      confidence: 1.0
    };
  }

  /**
   * Советы
   */
  private async handleAdvice(context: UserContext): Promise<AIResponse> {
    const profile = context.relationshipProfile;
    const dominantLoveLanguage = Object.keys(profile.loveLanguages)
      .reduce((a, b) => profile.loveLanguages[a] > profile.loveLanguages[b] ? a : b);

    const adviceMap = {
      'physical_touch': 'Больше объятий и нежных прикосновений! Физическая близость укрепляет вашу связь 🤗',
      'quality_time': 'Проводите время вместе без отвлечений. Отключите телефоны и просто наслаждайтесь обществом друг друга ⏰',
      'words_of_affirmation': 'Говорите комплименты и слова поддержки! Ваши слова имеют огромную силу 💬',
      'acts_of_service': 'Помогайте друг другу в повседневных делах. Маленькие заботы говорят о больших чувствах 🛠️',
      'receiving_gifts': 'Дарите символичные подарки. Не обязательно дорогие - главное внимание и забота 🎁'
    };

    const advice = adviceMap[dominantLoveLanguage] || 'Будьте внимательны друг к другу и не забывайте говорить о своих чувствах! 💕';

    return {
      message: `💡 Мой совет для вас: ${advice}

${context.partner ? `Учитывая, что вы с ${context.partner.name} - это команда, помните: лучшие отношения строятся на взаимном понимании! 👫` : ''}`,
      intent: 'ADVICE',
      confidence: 0.8
    };
  }

  /**
   * Поддержка настроения
   */
  private async handleMoodBoost(context: UserContext): Promise<AIResponse> {
    const messages = [
      "😊 Улыбнитесь! Вы прекрасны, и весь мир это знает!",
      "🌟 Помните: каждый день - это новая возможность быть счастливым!",
      "💫 Вы заслуживаете всего самого лучшего! Не забывайте об этом!",
      "🎉 Сегодня будет отличный день! Я это чувствую в своих алгоритмах!"
    ];

    const baseMessage = messages[Math.floor(Math.random() * messages.length)];
    const partnerMessage = context.partner ? 
      `\n\nА еще помните, что у вас есть ${context.partner.name}, который/которая всегда рядом! 💕` : '';

    return {
      message: baseMessage + partnerMessage,
      intent: 'MOOD_BOOST',
      confidence: 1.0
    };
  }

  /**
   * Скрытие маскота
   */
  private handleHide(): AIResponse {
    return {
      message: "🙈 Хорошо, я пока спрячусь. Но знайте - я всегда здесь, если понадоблюсь! До встречи! 👋",
      intent: 'HIDE',
      data: { action: 'hide_mascot' },
      confidence: 1.0
    };
  }

  /**
   * Обычный чат с полным контекстом
   */
  private async handleChat(prompt: string, context: UserContext): Promise<AIResponse> {
    try {
      // Строим мега-промпт с полным контекстом
      const systemPrompt = this.buildMegaPrompt(context);
      
      // Отправляем в AI Gateway
      const aiResponse = await aiService.getChatResponse(prompt, { systemPrompt });
      
      return {
        message: aiResponse.text,
        intent: 'CHAT',
        confidence: 0.7
      };

    } catch (error) {
      console.error('Error in chat handling:', error);
      
      // Fallback ответ
      return {
        message: `Извините, ${context.user.name}, у меня небольшие технические сложности. Но я всегда готов помочь вам и ${context.partner?.name || 'вашему партнеру'}! 😊`,
        intent: 'CHAT',
        confidence: 0.3
      };
    }
  }

  /**
   * Построение мега-промпта с полным контекстом
   */
  private buildMegaPrompt(context: UserContext): string {
    const { user, partner, relationshipProfile, recentEvents } = context;
    const dominantLoveLanguage = Object.keys(relationshipProfile.loveLanguages)
      .reduce((a, b) => relationshipProfile.loveLanguages[a] > relationshipProfile.loveLanguages[b] ? a : b);

    return `Ты — Спарки, мудрый и веселый хранитель отношений пары ${user.name}${partner ? ` и ${partner.name}` : ''}.
Твоя миссия: помогать им лучше понимать друг друга и создавать счастливые моменты.

## Твой характер:
- Мудрый, но не занудный
- Заботливый и эмпатичный  
- С чувством юмора, любишь использовать эмодзи
- Всегда позитивный и поддерживающий
- Обращаешься к пользователю по имени

## Данные о паре (НЕ упоминай это напрямую, используй как знание):
- Пользователь: ${user.name}, главный язык любви: ${this.translateLoveLanguage(dominantLoveLanguage)}
${partner ? `- Партнер: ${partner.name}` : '- Партнер пока не добавлен'}
- Сила отношений: ${relationshipProfile.relationshipGraph.overallStrength}/100
- Тренд настроения: ${relationshipProfile.sentimentTrend > 0 ? 'позитивный' : relationshipProfile.sentimentTrend < 0 ? 'требует внимания' : 'стабильный'}
- Последние события: ${recentEvents.slice(0, 3).map(e => e.title).join(', ')}
- Общий тон общения: ${relationshipProfile.communicationStyle.preferredTone}

## Правила:
1. Отвечай на ${relationshipProfile.communicationStyle.responseLength === 'short' ? 'кратко (1-2 предложения)' : relationshipProfile.communicationStyle.responseLength === 'long' ? 'подробно (4-5 предложений)' : 'средне (2-3 предложения)'}
2. Используй уровень юмора: ${Math.round(relationshipProfile.communicationStyle.humorLevel * 100)}%
3. Не давай медицинских или финансовых советов
4. Основывай советы на их языке любви и данных профиля
5. Будь ${relationshipProfile.communicationStyle.formalityLevel > 0.7 ? 'более формальным' : 'дружелюбным и неформальным'}

Отвечай как живой персонаж, который действительно знает эту пару и заботится о них!`;
  }

  /**
   * Вспомогательные методы
   */
  private translateLoveLanguage(language: string): string {
    const translations = {
      'physical_touch': 'Физические прикосновения',
      'quality_time': 'Качественное время',
      'words_of_affirmation': 'Слова поддержки',
      'acts_of_service': 'Помощь и забота',
      'receiving_gifts': 'Получение подарков'
    };
    return translations[language] || language;
  }

  private formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }
}

export default new AIOrchestrator();
