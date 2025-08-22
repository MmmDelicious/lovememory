class EventsAfishaService {
  constructor() {
    this.cache = new Map();
    this.cacheExpiry = 1000 * 60 * 60 * 2; // 2 часа
  }
  async searchEvents(city, dateRange = 30) {
    const cacheKey = `events_${city}_${dateRange}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;
    try {
      const events = await this.fetchEventsFromMultipleSources(city, dateRange);
      this.setCache(cacheKey, events);
      return events;
    } catch (error) {
      console.error('Error fetching events:', error);
      return this.getFallbackEvents(city);
    }
  }
  async fetchEventsFromMultipleSources(city, dateRange) {
    const sources = [
      this.fetchKudaGoEvents(city, dateRange),
      this.fetchTimepadEvents(city, dateRange),
      this.fetchTicketlandEvents(city, dateRange),
      this.fetchLocalEvents(city, dateRange)
    ];
    try {
      const results = await Promise.allSettled(sources);
      const allEvents = [];
      results.forEach(result => {
        if (result.status === 'fulfilled' && result.value) {
          allEvents.push(...result.value);
        }
      });
      return this.deduplicateAndSort(allEvents);
    } catch (error) {
      console.error('Error fetching from multiple sources:', error);
      return [];
    }
  }
  async fetchKudaGoEvents(city, dateRange) {
    try {
      const citySlug = this.getCitySlug(city);
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + dateRange);
      const url = `https://kudago.com/public-api/v1.4/events/?location=${citySlug}&actual_since=${Math.floor(startDate.getTime() / 1000)}&actual_until=${Math.floor(endDate.getTime() / 1000)}&fields=id,title,short_title,description,dates,price,location,images,categories&expand=location,images`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('KudaGo API error');
      const data = await response.json();
      return data.results?.map(event => ({
        id: `kudago_${event.id}`,
        title: event.title,
        description: event.description || event.short_title,
        dates: event.dates?.map(d => ({
          start: new Date(d.start * 1000),
          end: new Date(d.end * 1000)
        })) || [],
        price: event.price || 'Цена уточняется',
        location: event.location?.title || 'Локация уточняется',
        category: this.mapKudaGoCategory(event.categories),
        image: event.images?.[0]?.image || null,
        source: 'KudaGo',
        url: `https://kudago.com/msk/event/${event.id}/`
      })) || [];
    } catch (error) {
      console.error('KudaGo API error:', error);
      return [];
    }
  }
  async fetchTimepadEvents(city, dateRange) {
    try {
      return this.getMockTimepadEvents(city, dateRange);
    } catch (error) {
      console.error('Timepad API error:', error);
      return [];
    }
  }
  async fetchTicketlandEvents(city, dateRange) {
    try {
      return this.getMockTicketlandEvents(city, dateRange);
    } catch (error) {
      console.error('Ticketland API error:', error);
      return [];
    }
  }
  async fetchLocalEvents(city, dateRange) {
    const currentYear = new Date().getFullYear();
    const events2025 = this.getEvents2025(city);
    return events2025.filter(event => {
      const eventDate = new Date(event.dates[0]?.start);
      const now = new Date();
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + dateRange);
      return eventDate >= now && eventDate <= futureDate;
    });
  }
  getEvents2025(city) {
    const baseEvents = [
      {
        id: 'local_2025_1',
        title: 'Выставка "Цифровое искусство 2025"',
        description: 'Современные технологии в искусстве: VR, AR и нейросети',
        dates: [{ start: new Date('2025-02-15T18:00'), end: new Date('2025-02-15T22:00') }],
        price: '800-1500 ₽',
        location: 'Центр современного искусства',
        category: 'cultural',
        image: null,
        source: 'Local',
        url: null
      },
      {
        id: 'local_2025_2',
        title: 'Гастрономический фестиваль "Вкусы мира"',
        description: 'Кухни разных стран, мастер-классы от шеф-поваров',
        dates: [{ start: new Date('2025-02-20T12:00'), end: new Date('2025-02-20T20:00') }],
        price: '500-2000 ₽',
        location: 'Парк Сокольники',
        category: 'entertainment',
        image: null,
        source: 'Local',
        url: null
      },
      {
        id: 'local_2025_3',
        title: 'Концерт симфонического оркестра',
        description: 'Классическая музыка: Бах, Моцарт, Бетховен',
        dates: [{ start: new Date('2025-02-25T19:30'), end: new Date('2025-02-25T21:30') }],
        price: '1200-3000 ₽',
        location: 'Консерватория',
        category: 'cultural',
        image: null,
        source: 'Local',
        url: null
      },
      {
        id: 'local_2025_4',
        title: 'Стендап-комедия "Смех без границ"',
        description: 'Выступления популярных комиков и новых талантов',
        dates: [{ start: new Date('2025-03-01T20:00'), end: new Date('2025-03-01T22:00') }],
        price: '800-1800 ₽',
        location: 'Театр эстрады',
        category: 'entertainment',
        image: null,
        source: 'Local',
        url: null
      }
    ];
    if (city.toLowerCase().includes('москв')) {
      baseEvents.push({
        id: 'moscow_2025_1',
        title: 'Московские сезоны: Зимние развлечения',
        description: 'Катки, горки, зимние ярмарки по всей Москве',
        dates: [{ start: new Date('2025-02-10T10:00'), end: new Date('2025-02-28T22:00') }],
        price: 'Бесплатно',
        location: 'Различные парки Москвы',
        category: 'outdoor',
        image: null,
        source: 'Moscow',
        url: null
      });
    }
    return baseEvents;
  }
  getMockTimepadEvents(city, dateRange) {
    return [
      {
        id: 'timepad_mock_1',
        title: 'Мастер-класс по керамике',
        description: 'Создайте уникальную керамическую посуду своими руками',
        dates: [{ start: new Date('2025-02-18T15:00'), end: new Date('2025-02-18T18:00') }],
        price: '2500 ₽',
        location: 'Творческая мастерская "Глина"',
        category: 'creative',
        image: null,
        source: 'Timepad',
        url: null
      }
    ];
  }
  getMockTicketlandEvents(city, dateRange) {
    return [
      {
        id: 'ticketland_mock_1',
        title: 'Спектакль "Три сестры"',
        description: 'Классическая пьеса Чехова в современной интерпретации',
        dates: [{ start: new Date('2025-02-22T19:00'), end: new Date('2025-02-22T21:30') }],
        price: '1500-4000 ₽',
        location: 'Малый театр',
        category: 'cultural',
        image: null,
        source: 'Ticketland',
        url: null
      }
    ];
  }
  getCitySlug(city) {
    const cityMap = {
      'москва': 'msk',
      'санкт-петербург': 'spb',
      'питер': 'spb',
      'екатеринбург': 'ekb',
      'новосибирск': 'nsk',
      'казань': 'kzn',
      'нижний новгород': 'nnv',
      'самара': 'smr',
      'омск': 'oms',
      'челябинск': 'chl',
      'ростов-на-дону': 'rnd',
      'уфа': 'ufa'
    };
    return cityMap[city.toLowerCase()] || 'msk';
  }
  mapKudaGoCategory(categories) {
    if (!categories || categories.length === 0) return 'entertainment';
    const categoryMap = {
      'concert': 'entertainment',
      'theater': 'cultural',
      'exhibition': 'cultural',
      'show': 'entertainment',
      'master-class': 'creative',
      'festival': 'entertainment',
      'party': 'entertainment',
      'sport': 'active'
    };
    const firstCategory = categories[0];
    return categoryMap[firstCategory] || 'entertainment';
  }
  deduplicateAndSort(events) {
    const uniqueEvents = [];
    const seen = new Set();
    events.forEach(event => {
      const key = `${event.title}_${event.dates[0]?.start}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueEvents.push(event);
      }
    });
    return uniqueEvents.sort((a, b) => {
      const dateA = a.dates[0]?.start || new Date();
      const dateB = b.dates[0]?.start || new Date();
      return dateA - dateB;
    });
  }
  getFallbackEvents(city) {
    return [
      {
        id: 'fallback_1',
        title: 'Вечер настольных игр',
        description: 'Дружеская атмосфера и интересные игры в антикафе',
        dates: [{ start: new Date(Date.now() + 86400000), end: new Date(Date.now() + 86400000 + 3600000 * 3) }],
        price: '300-500 ₽/час',
        location: 'Антикафе "Мосигра"',
        category: 'entertainment',
        image: null,
        source: 'Fallback',
        url: null
      }
    ];
  }
  getFromCache(key) {
    const item = this.cache.get(key);
    if (item && Date.now() - item.timestamp < this.cacheExpiry) {
      return item.data;
    }
    this.cache.delete(key);
    return null;
  }
  setCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }
  clearCache() {
    this.cache.clear();
  }
}
export default new EventsAfishaService();

