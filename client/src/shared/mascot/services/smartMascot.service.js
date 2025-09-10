import api from '../../services/api';
class SmartMascotService {
  constructor() {
    this.userContext = {
      partner: null,
      user: null,
      recentEvents: [],
      preferences: {},
      relationshipStats: {},
      communicationStyle: 'friendly', // friendly, romantic, playful, wise
      lastInteractions: [],
      memoryPersistence: new Map()
    };
    this.loadUserContext();
  }
  loadUserContext() {
    try {
      const savedContext = localStorage.getItem('mascot_context');
      if (savedContext) {
        const parsed = JSON.parse(savedContext);
        this.userContext = { ...this.userContext, ...parsed };
      }
    } catch (error) {
      console.error('Error loading mascot context:', error);
    }
  }
  saveUserContext() {
    try {
      localStorage.setItem('mascot_context', JSON.stringify({
        ...this.userContext,
        lastSaved: new Date().toISOString()
      }));
    } catch (error) {
      console.error('Error saving mascot context:', error);
    }
  }
  updateUserContext(userData, partnerData = null) {
    this.userContext.user = userData;
    if (partnerData) {
      this.userContext.partner = partnerData;
    }
    this.saveUserContext();
  }
  updateRecentActivity(events, stats = {}) {
    this.userContext.recentEvents = events.slice(-10); // Последние 10 событий
    this.userContext.relationshipStats = stats;
    this.saveUserContext();
  }
  generatePastMemoryMessage(event) {
    const { user, partner } = this.userContext;
    const userName = user?.name || 'дорогой';
    const partnerName = partner?.name || 'ваш партнер';
    const eventDate = new Date(event.event_date);
    const monthsAgo = Math.floor((new Date() - eventDate) / (1000 * 60 * 60 * 24 * 30));
    const dayName = eventDate.toLocaleDateString('ru-RU', { weekday: 'long' });
    const dateStr = eventDate.toLocaleDateString('ru-RU', { 
      month: 'long', 
      day: 'numeric',
      year: eventDate.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    });
    const memoryTemplates = [
      `${userName}, помните тот волшебный ${dayName}, ${dateStr}? "${event.title}" - это было так прекрасно! ${partnerName} наверняка тоже помнит эти моменты ❤️`,
      `Эх, как быстро летит время... ${monthsAgo} ${this.getMonthForm(monthsAgo)} назад у вас было "${event.title}". ${partnerName}, наверное, до сих пор улыбается, вспоминая тот день!`,
      `${userName}, я тут листал ваши воспоминания и наткнулся на "${event.title}" от ${dateStr}. Может, расскажете ${partnerName} что-то особенное из того дня? 😊`,
      `Знаете, что меня вдохновляет в ваших отношениях? Такие моменты как "${event.title}" ${monthsAgo} ${this.getMonthForm(monthsAgo)} назад. Давайте создадим еще одно прекрасное воспоминание!`,
      `${userName}, иногда самые дорогие моменты становятся еще ценнее со временем. "${event.title}" ${dateStr} - один из таких. ${partnerName} тоже дорожит этими воспоминаниями ✨`
    ];
    const styleIndex = this.getStyleBasedIndex(memoryTemplates.length);
    return memoryTemplates[styleIndex];
  }
  generateFutureEventMessage(event) {
    const { user, partner } = this.userContext;
    const userName = user?.name || 'дорогой';
    const partnerName = partner?.name || 'ваш партнер';
    const eventDate = new Date(event.event_date);
    const today = new Date();
    const diffTime = eventDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const timeOfDay = this.getEventTimeContext(eventDate);
    const dayName = eventDate.toLocaleDateString('ru-RU', { weekday: 'long' });
    let futureTemplates = [];
    if (diffDays === 0) {
      futureTemplates = [
        `🎉 ${userName}, сегодня тот самый день! "${event.title}" ${timeOfDay}. ${partnerName} уже готовится? Будет незабываемо!`,
        `Ура! Сегодня "${event.title}"! ${userName}, я так взволнован за вас двоих. Это будет особенный день ✨`,
        `${userName}, чувствуете эти бабочки в животе? Сегодня "${event.title}"! ${partnerName} наверняка тоже в предвкушении 💕`,
      ];
    } else if (diffDays === 1) {
      futureTemplates = [
        `⏰ ${userName}, завтра в ${dayName} у вас "${event.title}"! Уже придумали, что надеть? ${partnerName} точно будет в восторге!`,
        `Завтра волшебный день! "${event.title}" ждет вас двоих. ${userName}, может, подготовите небольшой сюрприз для ${partnerName}? 😊`,
        `${userName}, осталась всего одна ночь до "${event.title}"! Я так рад за ваши отношения - вы умеете радовать друг друга 💫`,
      ];
    } else if (diffDays <= 7) {
      futureTemplates = [
        `📅 ${userName}, через ${diffDays} ${this.getDayForm(diffDays)} у вас "${event.title}"! Время пролетит незаметно. ${partnerName} наверняка тоже считает дни!`,
        `Скоро-скоро! "${event.title}" уже на горизонте - через ${diffDays} ${this.getDayForm(diffDays)}. ${userName}, предвкушение - это часть удовольствия ✨`,
        `${userName}, знаете что? Через ${diffDays} ${this.getDayForm(diffDays)} вас ждет "${event.title}". Время подумать о деталях, которые сделают день особенным!`,
      ];
    } else {
      futureTemplates = [
        `🗓️ ${userName}, впереди кое-что замечательное! "${event.title}" ${eventDate.toLocaleDateString('ru-RU', { month: 'long', day: 'numeric' })}. ${partnerName} уже в курсе всех планов?`,
        `У нас есть время подготовиться к чему-то особенному! "${event.title}" через ${diffDays} ${this.getDayForm(diffDays)}. ${userName}, какие у вас ожидания? 🤔`,
        `${userName}, я обожаю, как вы планируете время вместе! "${event.title}" будет через ${diffDays} ${this.getDayForm(diffDays)} - есть время добавить изюминку!`,
      ];
    }
    const styleIndex = this.getStyleBasedIndex(futureTemplates.length);
    return futureTemplates[styleIndex];
  }
  generateContextualMessage(context = {}) {
    const { user, partner, relationshipStats } = this.userContext;
    const userName = user?.name || 'дорогой';
    const partnerName = partner?.name || 'ваш близкий человек';
    
    // Определяем контекст страницы
    const currentPage = context.page || this.detectCurrentPage();
    
    const contextTemplates = {
      // Основные состояния
      idle: [
        `${userName}, давненько не видел вас здесь! Как дела? Может, время запланировать что-то особенное? 💭`,
        `Соскучился по вашим приключениям! ${userName}, что нового в отношениях? 😊`,
        `${userName}, помните, что лучшие отношения требуют внимания. Когда в последний раз делали что-то спонтанное? ✨`,
      ],
      // Контексты для конкретных страниц
      dashboard: [
        `${userName}, отличный способ начать день - посмотреть на ваши воспоминания! 🌅`,
        `Какие планы на сегодня? Может, добавим что-то особенное в календарь? 📅`,
        `${userName}, LoveMemory помогает создавать моменты. Что будем планировать? ✨`,
      ],
      games: [
        `${userName}, игры вместе - отличный способ повеселиться и сблизиться! 🎮`,
        `Готовы к веселью? Игры помогают лучше узнать друг друга! 😄`,
        `${userName}, а давайте проверим совместимость в играх? 🎯`,
      ],
      insights: [
        `${userName}, аналитика отношений может открыть много интересного! 📊`,
        `Давайте изучим ваши паттерны общения и близости! 🔍`,
        `${userName}, данные помогают понять, как сделать отношения еще лучше! 💡`,
      ],
      profile: [
        `${userName}, профиль - это ваша история в LoveMemory! ✨`,
        `Не забывайте обновлять информацию о себе! 📝`,
        `${userName}, как идут дела с достижениями? 🏆`,
      ],
      active: [
        `${userName}, вы с ${partnerName} просто молодцы! Столько активности - отношения процветают! 🌟`,
        `Обожаю наблюдать за вашими с ${partnerName} приключениями, ${userName}! Вы знаете, как сделать жизнь яркой 🎨`,
        `${userName}, ваша с ${partnerName} энергия заразительна! Продолжайте в том же духе! 💪`,
      ],
      communication: [
        `${userName}, общение - это основа крепких отношений. Как часто вы с ${partnerName} делитесь своими мыслями? 💬`,
        `Знаете, ${userName}, ${partnerName} наверняка ценит ваши откровенные разговоры. Не стесняйтесь быть собой! 💕`,
        `${userName}, помните: даже простое "как дела?" может укрепить связь с ${partnerName} 🤗`,
      ],
      growth: [
        `${userName}, а не попробовать ли вам с ${partnerName} что-то новое? Новые опыты сближают! 🌱`,
        `Видел ваши успехи с ${partnerName}, ${userName}! А что если сделать следующий шаг в ваших отношениях? 🚀`,
        `${userName}, рост отношений - это путешествие. Куда бы вы хотели отправиться вместе с ${partnerName}? 🗺️`,
      ]
    };
    // Сначала пробуем найти специфичные для страницы фразы
    let templates = contextTemplates[currentPage];
    
    // Если нет специфичных фраз для страницы, используем общий контекст
    if (!templates) {
      const contextType = context.type || this.determineContextType();
      templates = contextTemplates[contextType] || contextTemplates.growth;
    }
    
    const styleIndex = this.getStyleBasedIndex(templates.length);
    return templates[styleIndex];
  }

  // Определяем текущую страницу по URL
  detectCurrentPage() {
    const path = window.location.pathname;
    if (path.includes('/dashboard')) return 'dashboard';
    if (path.includes('/games')) return 'games';
    if (path.includes('/insights')) return 'insights';
    if (path.includes('/profile')) return 'profile';
    if (path.includes('/lessons')) return 'lessons';
    if (path.includes('/calendar')) return 'calendar';
    return 'general';
  }
  determineContextType() {
    const { recentEvents, lastInteractions } = this.userContext;
    const now = new Date();
    const recentActivity = recentEvents.filter(event => 
      (now - new Date(event.created_at)) < (7 * 24 * 60 * 60 * 1000) // Последние 7 дней
    );
    if (recentActivity.length === 0 && lastInteractions.length === 0) {
      return 'idle';
    } else if (recentActivity.length > 3) {
      return 'active';
    } else if (Math.random() > 0.5) {
      return 'communication';
    } else {
      return 'growth';
    }
  }
  analyzeLoveLanguages(events, interactions = []) {
    const loveLanguageAnalysis = {
      physical_touch: 0,      // Объятия, прикосновения
      quality_time: 0,        // Совместное время
      words_of_affirmation: 0, // Слова поддержки
      acts_of_service: 0,     // Помощь и забота
      receiving_gifts: 0      // Подарки
    };
    events.forEach(event => {
      const title = event.title.toLowerCase();
      const description = (event.description || '').toLowerCase();
      const content = title + ' ' + description;
      if (content.includes('время вместе') || content.includes('вместе') || 
          content.includes('поход') || content.includes('кино') ||
          content.includes('прогулка') || content.includes('путешествие')) {
        loveLanguageAnalysis.quality_time += 2;
      }
      if (content.includes('подарок') || content.includes('сюрприз') ||
          content.includes('цветы') || content.includes('покупка')) {
        loveLanguageAnalysis.receiving_gifts += 2;
      }
      if (content.includes('поздравление') || content.includes('поддержка') ||
          content.includes('комплимент') || content.includes('признание')) {
        loveLanguageAnalysis.words_of_affirmation += 2;
      }
      if (content.includes('помощь') || content.includes('забота') ||
          content.includes('приготовить') || content.includes('убрать')) {
        loveLanguageAnalysis.acts_of_service += 2;
      }
      if (content.includes('обнять') || content.includes('поцелуй') ||
          content.includes('массаж') || content.includes('близость')) {
        loveLanguageAnalysis.physical_touch += 2;
      }
    });
    const sortedLanguages = Object.entries(loveLanguageAnalysis)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 2);
    return {
      analysis: loveLanguageAnalysis,
      dominant: sortedLanguages,
      suggestions: this.generateLoveLanguageSuggestions(sortedLanguages)
    };
  }
  generateLoveLanguageSuggestions(dominantLanguages) {
    const suggestions = {
      physical_touch: [
        "Попробуйте больше объятий и нежных прикосновений",
        "Массаж для партнера - отличная идея для вечера",
        "Держитесь за руки во время прогулок"
      ],
      quality_time: [
        "Запланируйте вечер только для вас двоих",
        "Отключите телефоны и просто поговорите",
        "Найдите новое хобби, которым можете заниматься вместе"
      ],
      words_of_affirmation: [
        "Чаще говорите комплименты друг другу",
        "Оставляйте милые записки с признаниями",
        "Благодарите партнера за мелочи"
      ],
      acts_of_service: [
        "Сделайте что-то приятное без просьбы",
        "Приготовьте любимое блюдо партнера",
        "Помогите с делами, которые партнер не любит"
      ],
      receiving_gifts: [
        "Подарите что-то символичное и значимое",
        "Удивите маленьким сюрпризом без повода",
        "Создайте подарок своими руками"
      ]
    };
    return dominantLanguages.map(([language]) => 
      suggestions[language][Math.floor(Math.random() * suggestions[language].length)]
    );
  }
  getMonthForm(months) {
    if (months === 1) return 'месяц';
    if (months >= 2 && months <= 4) return 'месяца';
    return 'месяцев';
  }
  getDayForm(days) {
    if (days === 1) return 'день';
    if (days >= 2 && days <= 4) return 'дня';
    return 'дней';
  }
  getEventTimeContext(eventDate) {
    const hour = eventDate.getHours();
    if (hour < 12) return 'утром';
    if (hour < 17) return 'днем';
    if (hour < 21) return 'вечером';
    return 'ночью';
  }
  getStyleBasedIndex(length) {
    const { communicationStyle } = this.userContext;
    const random = Math.random();
    switch (communicationStyle) {
      case 'romantic':
        return Math.floor(random * Math.min(2, length)); // Более романтичные варианты
      case 'playful':
        return Math.floor(random * length); // Любые варианты
      case 'wise':
        return Math.floor((length - 1) * random); // Более мудрые варианты
      default:
        return Math.floor(random * length);
    }
  }
  recordInteraction(type, data = {}) {
    const interaction = {
      type,
      data,
      timestamp: new Date().toISOString()
    };
    this.userContext.lastInteractions.unshift(interaction);
    if (this.userContext.lastInteractions.length > 20) {
      this.userContext.lastInteractions = this.userContext.lastInteractions.slice(0, 20);
    }
    this.saveUserContext();
  }
  adaptCommunicationStyle(userReaction) {
    const { communicationStyle } = this.userContext;
    if (userReaction === 'positive') {
    } else if (userReaction === 'negative') {
      const styles = ['friendly', 'romantic', 'playful', 'wise'];
      const currentIndex = styles.indexOf(communicationStyle);
      const newIndex = (currentIndex + 1) % styles.length;
      this.userContext.communicationStyle = styles[newIndex];
      this.saveUserContext();
    }
  }
}
export default new SmartMascotService();

