import axios from 'axios';
import { 
  DateGenerationRequest, 
  DateGenerationResponse, 
  DateOption, 
  DateScheduleItem, 
  UserContext,
  IDateGenerationService,
  IntelligenceError
} from '../types/intelligence.types';

const aiService = require('./ai.service');

interface PlaceData {
  name: string;
  address?: string;
  type: string;
  rating?: number;
  price_level?: number;
  coordinates?: { lat: number; lng: number };
}

interface EventData {
  name: string;
  description?: string;
  date: string;
  location?: string;
  price?: string;
  category: string;
}

/**
 * Date Generation Service - Умный генератор свиданий
 * Использует AI для креативности + реальные данные из API
 */
class DateGenerationService implements IDateGenerationService {

  private readonly STATIC_PLACES = {
    restaurants: [
      { name: 'Пушкин', type: 'restaurant', address: 'Тверской бульвар, 26А', rating: 4.5, price_level: 4 },
      { name: 'White Rabbit', type: 'restaurant', address: 'ул. Смоленская, 3', rating: 4.7, price_level: 5 },
      { name: 'Café Blanc', type: 'cafe', address: 'Остоженка, 12', rating: 4.3, price_level: 3 },
      { name: 'Buro TSUM', type: 'cafe', address: 'Петровка, 2', rating: 4.2, price_level: 3 }
    ],
    activities: [
      { name: 'Третьяковская галерея', type: 'museum', address: 'Лаврушинский пер., 10', rating: 4.6, price_level: 2 },
      { name: 'Парк Горького', type: 'park', address: 'ул. Крымский Вал, 9', rating: 4.4, price_level: 1 },
      { name: 'Каток в ГУМе', type: 'entertainment', address: 'Красная площадь, 3', rating: 4.3, price_level: 3 },
      { name: 'Московский планетарий', type: 'entertainment', address: 'Садовая-Кудринская ул., 5', rating: 4.5, price_level: 2 }
    ],
    cultural: [
      { name: 'Большой театр', type: 'theater', address: 'Театральная пл., 1', rating: 4.8, price_level: 4 },
      { name: 'МХАТ им. Чехова', type: 'theater', address: 'Камергерский пер., 3', rating: 4.6, price_level: 3 },
      { name: 'Концертный зал Зарядье', type: 'concert', address: 'ул. Варварка, 6', rating: 4.7, price_level: 3 }
    ]
  };

  /**
   * Главный метод генерации свиданий
   */
  async generate(request: DateGenerationRequest): Promise<DateGenerationResponse> {
    console.log(`💕 DateGenerationService: Generating date options for user ${request.context.user.id}`);

    try {
      const startTime = Date.now();

      // 1. Анализируем контекст и предпочтения
      const analysis = this.analyzeUserContext(request.context);
      console.log(`🧠 Context analysis completed: ${JSON.stringify(analysis)}`);

      // 2. Собираем данные о местах параллельно
      const [realPlaces, realEvents] = await Promise.allSettled([
        this.fetchRealPlaces(request.context.user.city || 'Москва', analysis),
        this.fetchRealEvents(request.context.user.city || 'Москва')
      ]);

      const placesData = realPlaces.status === 'fulfilled' ? realPlaces.value : [];
      const eventsData = realEvents.status === 'fulfilled' ? realEvents.value : [];

      console.log(`🌍 Fetched ${placesData.length} places and ${eventsData.length} events`);

      // 3. Генерируем 3 варианта свиданий через AI
      const dateOptions = await Promise.all([
        this.generateSingleDateOption(1, request.context, analysis, placesData, eventsData),
        this.generateSingleDateOption(2, request.context, analysis, placesData, eventsData),
        this.generateSingleDateOption(3, request.context, analysis, placesData, eventsData)
      ]);

      const processingTime = Date.now() - startTime;
      console.log(`✅ DateGenerationService: Generated ${dateOptions.length} options in ${processingTime}ms`);

      return {
        options: dateOptions,
        reasoning: [
          'Анализирую ваши предпочтения и языки любви...',
          'Ищу подходящие места и события в вашем городе...',
          'Создаю персональные варианты свиданий...',
          'Готово! Выберите понравившийся вариант ✨'
        ],
        metadata: {
          generatedAt: new Date(),
          usedRealData: placesData.length > 0 || eventsData.length > 0,
          confidence: this.calculateConfidence(dateOptions, placesData.length > 0)
        }
      };

    } catch (error) {
      console.error('❌ DateGenerationService: Error generating dates:', error);
      
      // Fallback к базовому варианту
      return this.generateFallbackDates(request.context);
    }
  }

  /**
   * Анализ контекста пользователя для персонализации
   */
  private analyzeUserContext(context: UserContext) {
    const profile = context.relationshipProfile;
    const dominantLoveLanguage = Object.keys(profile.loveLanguages)
      .reduce((a, b) => profile.loveLanguages[a] > profile.loveLanguages[b] ? a : b);

    const preferences = {
      loveLanguage: dominantLoveLanguage,
      budgetLevel: profile.activityPatterns.budgetLevel,
      timePreference: this.getDominantTimePreference(profile.activityPatterns.timePreferences),
      sentimentMood: profile.sentimentTrend > 0.2 ? 'positive' : profile.sentimentTrend < -0.2 ? 'needs_boost' : 'neutral',
      communicationStyle: profile.communicationStyle.preferredTone,
      recentActivities: context.recentEvents.slice(0, 5).map(e => e.event_type)
    };

    return preferences;
  }

  /**
   * Получение реальных мест через внешние API
   */
  private async fetchRealPlaces(city: string, analysis: any): Promise<PlaceData[]> {
    try {
      // Заглушка для реального API - можно подключить Google Places, Foursquare, etc.
      console.log('🔍 Fetching real places (using static data for now)');
      
      // Выбираем места на основе анализа предпочтений
      let selectedPlaces: PlaceData[] = [];
      
      if (analysis.loveLanguage === 'quality_time') {
        selectedPlaces = [...this.STATIC_PLACES.activities, ...this.STATIC_PLACES.cultural];
      } else if (analysis.loveLanguage === 'physical_touch') {
        selectedPlaces = [...this.STATIC_PLACES.activities.filter(p => p.type === 'park'), ...this.STATIC_PLACES.restaurants];
      } else {
        selectedPlaces = [...this.STATIC_PLACES.restaurants, ...this.STATIC_PLACES.activities];
      }

      // Фильтруем по бюджету
      if (analysis.budgetLevel === 'low') {
        selectedPlaces = selectedPlaces.filter(p => (p.price_level || 3) <= 2);
      } else if (analysis.budgetLevel === 'high') {
        selectedPlaces = selectedPlaces.filter(p => (p.price_level || 3) >= 3);
      }

      return selectedPlaces.slice(0, 8); // Возвращаем топ-8

    } catch (error) {
      console.error('Error fetching real places:', error);
      return [];
    }
  }

  /**
   * Получение реальных событий
   */
  private async fetchRealEvents(city: string): Promise<EventData[]> {
    try {
      // Заглушка для реального API событий
      console.log('🎭 Fetching real events (using static data for now)');
      
      const staticEvents: EventData[] = [
        {
          name: 'Выставка современного искусства',
          description: 'Новая экспозиция в Третьяковской галерее',
          date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          location: 'Третьяковская галерея',
          price: '500 руб',
          category: 'culture'
        },
        {
          name: 'Концерт джазовой музыки',
          description: 'Вечер джаза в уютной атмосфере',
          date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
          location: 'Клуб "Козлов"',
          price: '1500 руб',
          category: 'music'
        },
        {
          name: 'Мастер-класс по готовке',
          description: 'Учимся готовить итальянские блюда',
          date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          location: 'Кулинарная студия',
          price: '3000 руб',
          category: 'workshop'
        }
      ];

      return staticEvents;

    } catch (error) {
      console.error('Error fetching real events:', error);
      return [];
    }
  }

  /**
   * Генерация одного варианта свидания через AI
   */
  private async generateSingleDateOption(
    optionNumber: number,
    context: UserContext,
    analysis: any,
    places: PlaceData[],
    events: EventData[]
  ): Promise<DateOption> {

    try {
      // Формируем контекст для AI
      const aiContext = {
        user: context.user.name,
        partner: context.partner?.name || 'партнер',
        loveLanguage: analysis.loveLanguage,
        budget: analysis.budgetLevel,
        mood: analysis.sentimentMood,
        timePreference: analysis.timePreference,
        availablePlaces: places.slice(0, 6).map(p => `${p.name} (${p.type})`).join(', '),
        availableEvents: events.slice(0, 3).map(e => `${e.name} - ${e.category}`).join(', '),
        recentActivities: analysis.recentActivities.join(', ')
      };

      const atmosphereOptions = ['romantic', 'fun', 'balanced'];
      const targetAtmosphere = atmosphereOptions[optionNumber - 1] || 'balanced';

      const prompt = `Создай вариант ${optionNumber} свидания для пары: ${aiContext.user} и ${aiContext.partner}.

Контекст:
- Главный язык любви: ${this.translateLoveLanguage(aiContext.loveLanguage)}
- Бюджет: ${aiContext.budget}
- Настроение: ${aiContext.mood}
- Время дня: ${aiContext.timePreference}
- Желаемая атмосфера: ${targetAtmosphere}

Доступные места: ${aiContext.availablePlaces}
Текущие события: ${aiContext.availableEvents}

Верни ТОЛЬКО JSON объект:
{
  "title": "Название свидания",
  "description": "Описание 2-3 предложения",
  "reasoning": "Почему именно этот вариант подойдет паре",
  "schedule": [
    {
      "time": "19:00",
      "endTime": "20:30", 
      "activity": "Название активности",
      "description": "Что делаем",
      "location": "Место из списка или новое",
      "cost": 1500
    }
  ],
  "estimatedCost": 3000,
  "duration": 3.5
}

Создай 2-4 активности в расписании. Обязательно используй места из списка.`;

      const aiResponse = await aiService.getChatResponse(prompt, {});
      const aiData = JSON.parse(aiResponse.text);

      // Собираем итоговый вариант
      const dateOption: DateOption = {
        id: `ai_generated_${optionNumber}_${Date.now()}`,
        title: aiData.title || `Вариант свидания ${optionNumber}`,
        description: aiData.description || 'Персональный вариант свидания для вас',
        schedule: aiData.schedule || this.createFallbackSchedule(places, analysis),
        estimatedCost: aiData.estimatedCost || 2500,
        duration: aiData.duration || 3,
        atmosphere: targetAtmosphere as 'romantic' | 'fun' | 'balanced',
        reasoning: aiData.reasoning || 'Создан на основе ваших предпочтений',
        isRealData: places.length > 0,
        activitiesCount: aiData.schedule?.length || 2
      };

      return dateOption;

    } catch (error) {
      console.error(`Error generating date option ${optionNumber}:`, error);
      
      // Fallback к статичному варианту
      return this.createFallbackDateOption(optionNumber, analysis, places);
    }
  }

  /**
   * Создание запасного варианта свидания
   */
  private createFallbackDateOption(
    optionNumber: number, 
    analysis: any, 
    places: PlaceData[]
  ): DateOption {
    
    const atmospheres: Array<'romantic' | 'fun' | 'balanced'> = ['romantic', 'fun', 'balanced'];
    const atmosphere = atmospheres[optionNumber - 1] || 'balanced';

    const availablePlaces = places.length > 0 ? places : this.STATIC_PLACES.restaurants;
    const selectedPlace = availablePlaces[Math.floor(Math.random() * availablePlaces.length)];

    const schedule: DateScheduleItem[] = [
      {
        time: '19:00',
        endTime: '20:30',
        activity: 'Прогулка по центру',
        description: 'Неспешная прогулка и общение',
        location: 'Центр города',
        cost: 0
      },
      {
        time: '20:30',
        endTime: '22:00',
        activity: `Ужин в ${selectedPlace.name}`,
        description: 'Романтический ужин в уютной атмосфере',
        location: selectedPlace.address || selectedPlace.name,
        cost: (selectedPlace.price_level || 3) * 800
      }
    ];

    return {
      id: `fallback_${optionNumber}_${Date.now()}`,
      title: `${atmosphere === 'romantic' ? 'Романтический' : atmosphere === 'fun' ? 'Веселый' : 'Гармоничный'} вечер`,
      description: 'Классический вариант свидания для приятного времяпрепровождения',
      schedule,
      estimatedCost: schedule.reduce((sum, item) => sum + (item.cost || 0), 0),
      duration: 3,
      atmosphere,
      reasoning: `Выбран на основе вашего языка любви: ${this.translateLoveLanguage(analysis.loveLanguage)}`,
      isRealData: places.length > 0,
      activitiesCount: schedule.length
    };
  }

  /**
   * Создание запасного расписания
   */
  private createFallbackSchedule(places: PlaceData[], analysis: any): DateScheduleItem[] {
    const restaurant = places.find(p => p.type === 'restaurant') || this.STATIC_PLACES.restaurants[0];
    const activity = places.find(p => p.type !== 'restaurant') || this.STATIC_PLACES.activities[0];

    return [
      {
        time: '18:00',
        endTime: '19:30',
        activity: `Посещение ${activity.name}`,
        description: 'Совместная активность',
        location: activity.address || activity.name,
        cost: (activity.price_level || 2) * 500
      },
      {
        time: '20:00',
        endTime: '21:30',
        activity: `Ужин в ${restaurant.name}`,
        description: 'Приятный ужин',
        location: restaurant.address || restaurant.name,
        cost: (restaurant.price_level || 3) * 800
      }
    ];
  }

  /**
   * Генерация fallback-вариантов при полном сбое
   */
  private async generateFallbackDates(context: UserContext): Promise<DateGenerationResponse> {
    console.log('⚠️ Generating fallback date options');

    const analysis = this.analyzeUserContext(context);
    const staticPlaces = [...this.STATIC_PLACES.restaurants, ...this.STATIC_PLACES.activities];

    const options: DateOption[] = [
      this.createFallbackDateOption(1, analysis, staticPlaces),
      this.createFallbackDateOption(2, analysis, staticPlaces),
      this.createFallbackDateOption(3, analysis, staticPlaces)
    ];

    return {
      options,
      reasoning: [
        'Анализирую ваши предпочтения...',
        'Создаю базовые варианты свиданий...',
        'Готово! (режим офлайн)'
      ],
      metadata: {
        generatedAt: new Date(),
        usedRealData: false,
        confidence: 0.5
      }
    };
  }

  /**
   * Вспомогательные методы
   */
  private getDominantTimePreference(timePrefs: any): string {
    const times = Object.entries(timePrefs) as [string, number][];
    return times.reduce((a, b) => a[1] > b[1] ? a : b)[0];
  }

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

  private calculateConfidence(options: DateOption[], hasRealData: boolean): number {
    let confidence = 0.6; // базовая уверенность

    if (hasRealData) confidence += 0.2;
    if (options.every(opt => opt.activitiesCount >= 2)) confidence += 0.1;
    if (options.some(opt => opt.reasoning.length > 50)) confidence += 0.1;

    return Math.min(1.0, confidence);
  }
}

export default new DateGenerationService();
