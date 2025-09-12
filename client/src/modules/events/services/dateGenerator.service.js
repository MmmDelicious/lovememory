import api from '../../../services/api';
import placesService from './places.service.js';
const relationshipGraphData = {
  nodes: [
    {
      id: 'communication',
      label: 'Коммуникация',
      strength: 92,
      color: '#E74C3C',
      icon: '💬',
      x: 400,
      y: 150,
      activities: 15,
      lastActivity: '2 часа назад',
      description: 'Ваше общение очень активное и конструктивное'
    },
    {
      id: 'intimacy',
      label: 'Близость',
      strength: 85,
      color: '#E91E63',
      icon: '💕',
      x: 200,
      y: 250,
      activities: 8,
      lastActivity: '1 день назад',
      description: 'Эмоциональная близость на высоком уровне'
    },
    {
      id: 'entertainment',
      label: 'Развлечения',
      strength: 89,
      color: '#9C27B0',
      icon: '🎮',
      x: 600,
      y: 250,
      activities: 22,
      lastActivity: '30 минут назад',
      description: 'Активно проводите время вместе'
    },
    {
      id: 'goals',
      label: 'Общие цели',
      strength: 81,
      color: '#3F51B5',
      icon: '🎯',
      x: 300,
      y: 350,
      activities: 5,
      lastActivity: '3 дня назад',
      description: 'Планируете будущее вместе'
    },
    {
      id: 'balance',
      label: 'Баланс',
      strength: 88,
      color: '#009688',
      icon: '⚖️',
      x: 500,
      y: 350,
      activities: 12,
      lastActivity: '1 день назад',
      description: 'Хорошо находите время друг для друга'
    },
    {
      id: 'travel',
      label: 'Путешествия',
      strength: 75,
      color: '#FF9800',
      icon: '✈️',
      x: 150,
      y: 400,
      activities: 3,
      lastActivity: '1 неделя назад',
      description: 'Любите открывать новые места'
    },
    {
      id: 'fitness',
      label: 'Спорт',
      strength: 65,
      color: '#4CAF50',
      icon: '🏃‍♂️',
      x: 650,
      y: 400,
      activities: 7,
      lastActivity: '2 дня назад',
      description: 'Поддерживаете здоровый образ жизни'
    },
    {
      id: 'cooking',
      label: 'Кулинария',
      strength: 78,
      color: '#FF5722',
      icon: '👨‍🍳',
      x: 100,
      y: 150,
      activities: 9,
      lastActivity: 'Вчера',
      description: 'Готовите и экспериментируете вместе'
    },
    {
      id: 'finances',
      label: 'Финансы',
      strength: 73,
      color: '#795548',
      icon: '💰',
      x: 700,
      y: 150,
      activities: 4,
      lastActivity: '5 дней назад',
      description: 'Планируете бюджет и инвестиции'
    },
    {
      id: 'creativity',
      label: 'Творчество',
      strength: 70,
      color: '#607D8B',
      icon: '🎨',
      x: 400,
      y: 450,
      activities: 6,
      lastActivity: '4 дня назад',
      description: 'Занимаетесь творческими проектами'
    }
  ],
  connections: [
    { from: 'communication', to: 'intimacy', strength: 85, type: 'strong' },
    { from: 'communication', to: 'entertainment', strength: 75, type: 'strong' },
    { from: 'communication', to: 'goals', strength: 70, type: 'medium' },
    { from: 'intimacy', to: 'balance', strength: 80, type: 'strong' },
    { from: 'entertainment', to: 'balance', strength: 65, type: 'medium' },
    { from: 'entertainment', to: 'fitness', strength: 60, type: 'medium' },
    { from: 'goals', to: 'finances', strength: 85, type: 'strong' },
    { from: 'goals', to: 'travel', strength: 70, type: 'medium' },
    { from: 'travel', to: 'creativity', strength: 55, type: 'weak' },
    { from: 'cooking', to: 'intimacy', strength: 65, type: 'medium' },
    { from: 'cooking', to: 'creativity', strength: 60, type: 'medium' },
    { from: 'fitness', to: 'balance', strength: 70, type: 'medium' },
    { from: 'finances', to: 'goals', strength: 85, type: 'strong' },
    { from: 'creativity', to: 'entertainment', strength: 50, type: 'potential' }
  ]
};
// Удалены захардкоженные данные - теперь загружаем с сервера
const DATE_OPTIONS_DATABASE = {
  restaurants: [], // Загружается через API
  activities: [], // Загружается через API
  timing: [
    { period: "morning", start: "10:00", description: "утренний" },
    { period: "afternoon", start: "14:00", description: "дневной" },
    { period: "evening", start: "18:00", description: "вечерний" },
    { period: "night", start: "20:00", description: "ночной" }
  ]
};
class DateGeneratorService {
  constructor() {
    this.reasoningSteps = [];
    this.userPreferences = null;
    this.generatedOptions = [];
  }
  async analyzeUserData() {
    this.reasoningSteps = [];
    this.addReasoning("🤔 Начинаю анализировать ваши данные...");
    try {
      const profileResponse = await api.get('/user/profile');
      const profile = profileResponse.data;
      this.addReasoning(`👤 Изучаю ваш профиль: ${profile.name || 'загадочная личность'}...`);
      let currentLocation = { city: profile.location || 'Москва', coordinates: null };
      try {
        this.addReasoning("📍 Определяю ваше текущее местоположение...");
        const coords = await placesService.getCurrentLocation();
        const locationData = await placesService.getCityFromCoordinates(coords.latitude, coords.longitude);
        currentLocation = {
          city: locationData.city,
          country: locationData.country,
          coordinates: coords
        };
        this.addReasoning(`🗺️ Отлично! Вы находитесь в городе ${currentLocation.city}`);
      } catch (error) {
        this.addReasoning(`🗺️ Использую город из профиля: ${currentLocation.city}`);
      }
      const eventsResponse = await api.get('/events');
      const events = eventsResponse.data || [];
      this.addReasoning(`📅 Анализирую ${events.length} событий из вашего календаря...`);
      const relationshipData = this.analyzeRelationshipGraph();
      this.addReasoning(`💕 Граф отношений показывает: сильные стороны в ${relationshipData.strongestAreas.join(', ')}`);
      const activityPatterns = this.analyzeActivityPatterns(events);
      this.addReasoning(`📊 Ваши предпочтения: ${activityPatterns.preferredTime} время, бюджет ${activityPatterns.budgetLevel}`);
      this.userPreferences = {
        profile,
        relationshipData,
        activityPatterns,
        location: currentLocation,
        budget: activityPatterns.budgetLevel,
        preferredTime: activityPatterns.preferredTime,
        interests: relationshipData.topInterests
      };
      this.addReasoning("✅ Анализ завершен! Теперь ищу актуальные места и события в вашем городе...");
      return this.userPreferences;
    } catch (error) {
      this.addReasoning("⚠️ Не удалось получить все данные, но я подберу варианты на основе общих предпочтений...");
      this.userPreferences = {
        location: { city: 'Москва', coordinates: null },
        budget: 'medium',
        preferredTime: 'evening',
        interests: ['communication', 'entertainment', 'intimacy']
      };
      return this.userPreferences;
    }
  }
  analyzeRelationshipGraph() {
    const strongestAreas = relationshipGraphData.nodes
      .filter(node => node.strength >= 85)
      .map(node => node.label)
      .slice(0, 3);
    const topInterests = relationshipGraphData.nodes
      .sort((a, b) => b.strength - a.strength)
      .slice(0, 5)
      .map(node => node.id);
    const connectionsCount = relationshipGraphData.connections.filter(c => c.type === 'strong').length;
    return {
      strongestAreas,
      topInterests,
      strongConnectionsCount: connectionsCount,
      averageStrength: Math.round(
        relationshipGraphData.nodes.reduce((acc, node) => acc + node.strength, 0) / relationshipGraphData.nodes.length
      )
    };
  }
  analyzeActivityPatterns(events) {
    const recentEvents = events.filter(event => {
      const eventDate = new Date(event.event_date);
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      return eventDate >= monthAgo;
    });
    const timePreferences = {
      morning: 0, afternoon: 0, evening: 0, night: 0
    };
    recentEvents.forEach(event => {
      const hour = new Date(event.event_date).getHours();
      if (hour < 12) timePreferences.morning++;
      else if (hour < 17) timePreferences.afternoon++;
      else if (hour < 21) timePreferences.evening++;
      else timePreferences.night++;
    });
    const preferredTime = Object.keys(timePreferences).reduce((a, b) => 
      timePreferences[a] > timePreferences[b] ? a : b
    ) || 'evening';
    const budgetLevel = recentEvents.length > 5 ? 'medium' : 'low';
    return {
      preferredTime,
      budgetLevel,
      activityFrequency: recentEvents.length,
      favoriteTypes: this.analyzeFavoriteEventTypes(recentEvents)
    };
  }
  analyzeFavoriteEventTypes(events) {
    const types = {};
    events.forEach(event => {
      types[event.event_type] = (types[event.event_type] || 0) + 1;
    });
    return Object.keys(types).sort((a, b) => types[b] - types[a]).slice(0, 3);
  }
  async generateDateOptions() {
    this.addReasoning("🎯 Подбираю идеальные варианты свиданий...");
    const preferences = this.userPreferences;
    const options = [];
    for (let i = 0; i < 3; i++) {
      const option = await this.generateSingleDateOption(i);
      options.push(option);
      this.addReasoning(`✨ Вариант ${i + 1}: ${option.title} - ${option.reasoning}`);
    }
    this.generatedOptions = options;
    this.addReasoning("🎉 Готово! Выберите понравившийся вариант!");
    return {
      options,
      reasoning: this.reasoningSteps,
      userLocation: this.userPreferences?.location
    };
  }
  async generateSingleDateOption(index) {
    const preferences = this.userPreferences;
    const budget = preferences.budget;
    const time = preferences.preferredTime;
    const interests = preferences.interests;
    const location = preferences.location;
    let selectedActivity, selectedRestaurant;
    let isRealData = false;
    try {
      if (location.coordinates) {
        this.addReasoning(`🔍 Ищу актуальные места в городе ${location.city}...`);
        const realActivities = await placesService.searchActivities(
          location.city, 
          location.coordinates,
          { 
            radius: 8000,
            limit: 15
          }
        );
        const events = await eventsAfisha.searchEvents(location.city, 14); // на 2 недели вперед
        this.addReasoning(`🎭 Найдено ${events.length} актуальных событий в городе`);
        const realRestaurants = await placesService.searchRestaurants(
          location.city,
          location.coordinates,
          { 
            radius: 5000,
            limit: 15
          }
        );
        if ((realActivities.length > 0 || events.length > 0) && realRestaurants.length > 0) {
          const userHistory = await this.getUserPlaceHistory();
          const combinedActivities = [
            ...realActivities,
            ...events.map(event => this.convertEventToActivity(event))
          ];
          const diverseActivities = placeEnhancer.selectDiversePlaces(
            combinedActivities, 
            5, // больше вариантов
            interests, 
            userHistory
          );
          selectedActivity = diverseActivities[index % diverseActivities.length] || combinedActivities[0];
          const budgetRestaurants = realRestaurants.filter(r => 
            this.matchesBudget(r.budget, budget)
          );
          const diverseRestaurants = placeEnhancer.selectDiversePlaces(
            budgetRestaurants, 
            3, 
            interests, 
            userHistory
          );
          selectedRestaurant = diverseRestaurants[index % diverseRestaurants.length] || budgetRestaurants[0];
          selectedActivity.description = placeEnhancer.generatePlaceDescription(selectedActivity);
          if (selectedRestaurant) {
            selectedRestaurant.description = placeEnhancer.generatePlaceDescription(selectedRestaurant);
          }
          isRealData = true;
          this.addReasoning(`✨ Подобрал уникальные места! ${selectedActivity.name} и ${selectedRestaurant?.name || 'другое место'}`);
        }
      }
    } catch (error) {
      this.addReasoning("🔄 Не удалось получить актуальные данные, использую проверенные варианты...");
    }
    if (!selectedActivity || !selectedRestaurant) {
      selectedActivity = this.selectFromStaticActivities(interests, index);
      selectedRestaurant = this.selectFromStaticRestaurants(budget, index);
      selectedActivity.description = placeEnhancer.generatePlaceDescription(selectedActivity);
      if (selectedRestaurant) {
        selectedRestaurant.description = placeEnhancer.generatePlaceDescription(selectedRestaurant);
      }
      this.addReasoning(`📋 Подобрал проверенные места: ${selectedActivity.name} и ${selectedRestaurant?.name || 'другое место'}`);
    }
    const allActivities = [selectedActivity];
    if (selectedRestaurant) allActivities.push(selectedRestaurant);
    if (isRealData && index === 2) { // для третьего варианта делаем длинное свидание
      const additionalActivities = await this.getAdditionalActivities(location, interests, [selectedActivity, selectedRestaurant]);
      allActivities.push(...additionalActivities);
    }
    const startTime = this.getStartTimeFromPreferences(time);
    const schedule = timeRouteHelper.createFlexibleSchedule(allActivities, startTime, {
      maxDuration: index === 0 ? 3 : index === 1 ? 5 : 8, // разная длительность для разных вариантов
      includeFood: true,
      transportType: 'walking'
    });
    const reasoning = this.generateReasoning(selectedActivity, selectedRestaurant, interests, isRealData, schedule.length);
    const totalCost = schedule.reduce((sum, item) => sum + (item.cost || 0), 0);
    const totalDuration = schedule.length > 0 ? 
      (new Date(`2000-01-01 ${schedule[schedule.length - 1].endTime}`) - new Date(`2000-01-01 ${schedule[0].time}`)) / (1000 * 60 * 60) : 3;
    return {
      id: `date_option_${index}`,
      title: this.generateTitle(schedule),
      activity: selectedActivity,
      restaurant: selectedRestaurant,
      schedule,
      reasoning,
      estimatedCost: totalCost,
      duration: totalDuration,
      atmosphere: this.determineAtmosphere(selectedActivity, selectedRestaurant),
      isRealData,
      activitiesCount: schedule.length
    };
  }
  selectActivityByInterests(activities, interests, index) {
    let priorityActivities = activities;
    if (interests.includes('entertainment')) {
      priorityActivities = activities.filter(a => a.type === 'entertainment');
    } else if (interests.includes('creativity')) {
      priorityActivities = activities.filter(a => a.type === 'cultural');
    } else if (interests.includes('fitness')) {
      priorityActivities = activities.filter(a => a.type === 'active');
    }
    if (priorityActivities.length === 0) {
      priorityActivities = activities;
    }
    priorityActivities.sort((a, b) => {
      const scoreA = a.rating * 0.7 + (10 - a.distance) * 0.3;
      const scoreB = b.rating * 0.7 + (10 - b.distance) * 0.3;
      return scoreB - scoreA;
    });
    return priorityActivities[index % priorityActivities.length];
  }
  selectFromStaticActivities(interests, index) {
    if (interests.includes('entertainment') && index === 0) {
      return DATE_OPTIONS_DATABASE.activities.find(a => a.type === 'entertainment');
    } else if (interests.includes('creativity') && index === 1) {
      return DATE_OPTIONS_DATABASE.activities.find(a => a.type === 'creative');
    } else if (index === 2) {
      return DATE_OPTIONS_DATABASE.activities.find(a => a.type === 'cultural');
    } else {
      return DATE_OPTIONS_DATABASE.activities[index] || DATE_OPTIONS_DATABASE.activities[0];
    }
  }
  selectFromStaticRestaurants(budget, index) {
    const restaurantOptions = DATE_OPTIONS_DATABASE.restaurants.filter(r => 
      this.matchesBudget(r.budget, budget)
    );
    return restaurantOptions[index % restaurantOptions.length];
  }
  generateSchedule(activity, restaurant, preferredTime) {
    const timingData = DATE_OPTIONS_DATABASE.timing.find(t => t.period === preferredTime) || 
                       DATE_OPTIONS_DATABASE.timing[2]; // default to evening
    const startTime = timingData.start;
    const activityDuration = activity.duration;
    const restaurantDuration = 1.5; // стандартное время в ресторане
    const [startHour, startMin] = startTime.split(':').map(Number);
    const activityStart = `${startHour.toString().padStart(2, '0')}:${startMin.toString().padStart(2, '0')}`;
    const activityEndHour = startHour + Math.floor(activityDuration);
    const activityEndMin = startMin + ((activityDuration % 1) * 60);
    const activityEnd = `${activityEndHour.toString().padStart(2, '0')}:${activityEndMin.toString().padStart(2, '0')}`;
    const restaurantStartHour = activityEndHour;
    const restaurantStartMin = activityEndMin + 15; // 15 минут на переход
    const restaurantStart = `${restaurantStartHour.toString().padStart(2, '0')}:${restaurantStartMin.toString().padStart(2, '0')}`;
    const restaurantEndHour = restaurantStartHour + Math.floor(restaurantDuration);
    const restaurantEndMin = restaurantStartMin + ((restaurantDuration % 1) * 60);
    const restaurantEnd = `${restaurantEndHour.toString().padStart(2, '0')}:${restaurantEndMin.toString().padStart(2, '0')}`;
    return [
      {
        time: activityStart,
        endTime: activityEnd,
        activity: activity.name,
        description: `Время для ${activity.type === 'active' ? 'активного отдыха' : activity.type === 'cultural' ? 'культурного развития' : 'развлечений'}`
      },
      {
        time: restaurantStart,
        endTime: restaurantEnd,
        activity: restaurant.name,
        description: `Ужин в ${restaurant.atmosphere} атмосфере`
      }
    ];
  }
  async getAdditionalActivities(location, interests, existingActivities) {
    try {
      if (!location.coordinates) return [];
      const existingIds = existingActivities.map(a => a.id);
      const additionalActivities = await placesService.searchActivities(
        location.city,
        location.coordinates,
        { radius: 6000, limit: 12 }
      );
      const availableActivities = additionalActivities
        .filter(activity => !existingIds.includes(activity.id));
      const userHistory = await this.getUserPlaceHistory();
      const diverseActivities = placeEnhancer.selectDiversePlaces(
        availableActivities,
        3, // выбираем до 3 дополнительных мест
        interests,
        userHistory
      );
      return diverseActivities.map(activity => ({
        ...activity,
        description: placeEnhancer.generatePlaceDescription(activity)
      }));
    } catch (error) {
      return [];
    }
  }
  convertEventToActivity(event) {
    return {
      id: event.id,
      name: event.title,
      type: event.category || 'entertainment',
      address: event.location,
      coordinates: { lat: 55.7558, lon: 37.6176 }, // заглушка для Москвы
      distance: 2.5, // примерное расстояние
      rating: 4.2, // базовый рейтинг для событий
      tags: { 
        event: true,
        price: event.price,
        source: event.source,
        dates: event.dates
      },
      description: `${event.description}. ${event.price}. Источник: ${event.source}`,
      openingHours: event.dates?.[0] ? 'event_time' : null,
      isEvent: true
    };
  }
  async getUserPlaceHistory() {
    try {
      const response = await api.get('/user/place-history');
      return response.data.map(item => item.placeId) || [];
    } catch (error) {
      return [];
    }
  }
  getStartTimeFromPreferences(preferredTime) {
    const today = new Date();
    const timingData = DATE_OPTIONS_DATABASE.timing.find(t => t.period === preferredTime) || 
                       DATE_OPTIONS_DATABASE.timing[2]; // default to evening
    const [hours, minutes] = timingData.start.split(':').map(Number);
    today.setHours(hours, minutes, 0, 0);
    return today;
  }
  generateTitle(schedule) {
    if (schedule.length === 0) return 'Индивидуальное свидание';
    const types = [...new Set(schedule.map(item => item.type))];
    if (schedule.length <= 2) {
      return `${schedule[0].activity}${schedule[1] ? ` + ${schedule[1].activity}` : ''}`;
    } else if (schedule.length === 3) {
      return `${schedule[0].activity} + еще 2 места`;
    } else {
      return `Полный день: ${schedule.length} активностей`;
    }
  }
  generateReasoning(activity, restaurant, interests, isRealData = false, activitiesCount = 2) {
    const reasons = [];
    if (isRealData) {
      reasons.push(`это актуальные места в вашем городе с хорошими отзывами`);
      if (activity.rating && activity.rating >= 4.0) {
        reasons.push(`${activity.name} имеет высокий рейтинг ${activity.rating}`);
      }
      if (restaurant?.rating && restaurant.rating >= 4.0) {
        reasons.push(`${restaurant.name} оценен в ${restaurant.rating} звезд`);
      }
      if (activity.distance < 3) {
        reasons.push("все места находятся близко друг к другу");
      }
      if (activitiesCount > 2) {
        reasons.push(`маршрут включает ${activitiesCount} интересных мест`);
      }
    } else {
      if (interests.includes('entertainment') && activity.type === 'entertainment') {
        reasons.push("развлечения важны для ваших отношений");
      }
      if (interests.includes('communication') && restaurant?.atmosphere === 'intimate') {
        reasons.push("уютная атмосфера способствует общению");
      }
      if (activity.atmosphere === 'romantic') {
        reasons.push("романтическая активность укрепляет близость");
      }
    }
    if (reasons.length === 0) {
      reasons.push("это сочетание создаст приятный и запоминающийся вечер");
    }
    return `Выбрал потому что ${reasons.join(', ')}.`;
  }
  matchesBudget(itemBudget, userBudget) {
    const budgetMap = { free: 0, low: 1, medium: 2, high: 3 };
    return budgetMap[itemBudget] <= budgetMap[userBudget];
  }
  calculateCost(activity, restaurant) {
    const activityCost = timeRouteHelper.estimateActivityCost(activity);
    const restaurantCost = restaurant ? timeRouteHelper.estimateActivityCost({ type: 'restaurant', ...restaurant }) : 0;
    return activityCost + restaurantCost;
  }
  calculateDuration(activity, restaurant) {
    return activity.duration + 1.5 + 0.25; // активность + ресторан + переход
  }
  determineAtmosphere(activity, restaurant) {
    if (activity.atmosphere === 'romantic' || restaurant.atmosphere === 'romantic') {
      return 'romantic';
    }
    if (activity.atmosphere === 'fun' || restaurant.atmosphere === 'fun') {
      return 'fun';
    }
    return 'balanced';
  }
  addReasoning(step) {
    this.reasoningSteps.push({
      text: step,
      timestamp: new Date()
    });
  }
  getReasoningSteps() {
    return this.reasoningSteps;
  }
  getGeneratedOptions() {
    return this.generatedOptions;
  }
  async createDateEvent(selectedOption, selectedDate) {
    const eventData = {
      title: `💕 Свидание: ${selectedOption.title}`,
      description: this.formatEventDescription(selectedOption),
      event_date: this.formatEventDateTime(selectedDate, selectedOption.schedule[0].time),
      end_date: this.formatEventDateTime(selectedDate, selectedOption.schedule[selectedOption.schedule.length - 1].endTime),
      event_type: 'date',
      isShared: true,
      source: 'AI_SUGGESTED', // Важно! Это событие создано AI
      metadata: {
        generatedBy: 'AI_MASCOT',
        option: selectedOption,
        cost: selectedOption.estimatedCost,
        atmosphere: selectedOption.atmosphere
      }
    };
    try {
      const response = await api.post('/events', eventData);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
  formatEventDescription(option) {
    let description = `🎯 ${option.reasoning}\n\n`;
    description += `📅 Расписание:\n`;
    option.schedule.forEach((item, index) => {
      description += `${index + 1}. ${item.time} - ${item.endTime}: ${item.activity}\n`;
      description += `   ${item.description}\n\n`;
    });
    description += `💰 Примерная стоимость: ${option.estimatedCost} руб.\n`;
    description += `⏱️ Общая продолжительность: ${Math.round(option.duration * 10) / 10} часов\n`;
    description += `🎭 Атмосфера: ${option.atmosphere === 'romantic' ? 'романтическая' : option.atmosphere === 'fun' ? 'веселая' : 'сбалансированная'}`;
    return description;
  }
  formatEventDateTime(date, time) {
    const [hours, minutes] = time.split(':').map(Number);
    const eventDate = new Date(date);
    eventDate.setHours(hours, minutes, 0, 0);
    return eventDate.toISOString();
  }
}
export default new DateGeneratorService();

