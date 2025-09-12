import eventService from './event.service.js';
import { differenceInDays, format, subDays, subWeeks, subMonths, subYears } from 'date-fns';
import { ru } from 'date-fns/locale';
class MemoriesService {
  async findMemories() {
    try {
      const response = await eventService.getEvents();
      const allEvents = response.data;
      const eventsWithMedia = await this.getEventsWithMedia(allEvents);
      const memories = await this.generateMemoriesByPeriods(eventsWithMedia);
      return memories;
    } catch (error) {
      console.error('Error finding memories:', error);
      return [];
    }
  }
  async getEventsWithMedia(events) {
    const eventsWithMedia = [];
    for (const event of events) {
      try {
        const mediaResponse = await eventService.getMediaForEvent(event.id);
        const validMedia = (mediaResponse.data || []).filter(media => {
          const url = media.file_url || '';
          const isValidImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
          const hasValidName = !/^(утро|день|вечер|ночь|план|память|годовщина|путешествие)(\.(jpg|jpeg|png|gif|webp))?$/i.test(url.split('/').pop() || '');
          return isValidImage && hasValidName && url.includes('/uploads/');
        });
        if (validMedia.length > 0) {
          eventsWithMedia.push({
            ...event,
            media: validMedia
          });
        }
      } catch (error) {
        console.error(`Error getting media for event ${event.id}:`, error);
      }
    }
    return eventsWithMedia;
  }
  async generateMemoriesByPeriods(eventsWithMedia) {
    const today = new Date();
    const memories = [];
    const periods = [
      { type: 'year', amount: 1, label: 'год назад' },
      { type: 'year', amount: 2, label: '2 года назад' },
      { type: 'year', amount: 3, label: '3 года назад' },
      { type: 'months', amount: 6, label: '6 месяцев назад' },
      { type: 'months', amount: 3, label: '3 месяца назад' },
      { type: 'months', amount: 1, label: 'месяц назад' },
      { type: 'weeks', amount: 2, label: '2 недели назад' },
      { type: 'weeks', amount: 1, label: 'неделя назад' },
    ];
    for (const period of periods) {
      const periodMemories = this.findMemoriesForPeriod(eventsWithMedia, today, period);
      if (periodMemories.length > 0) {
        memories.push(...periodMemories);
      }
    }
    return memories.sort((a, b) => new Date(b.originalDate) - new Date(a.originalDate));
  }
  findMemoriesForPeriod(eventsWithMedia, today, period) {
    const { type, amount, label } = period;
    let targetDate;
    if (type === 'year') {
      targetDate = subYears(today, amount);
    } else if (type === 'months') {
      targetDate = subMonths(today, amount);
    } else if (type === 'weeks') {
      targetDate = subWeeks(today, amount);
    } else {
      return [];
    }
    const startRange = subDays(targetDate, 7);
    const endRange = subDays(targetDate, -7);
    const eventsInRange = eventsWithMedia.filter(event => {
      const eventDate = new Date(event.event_date);
      return eventDate >= startRange && eventDate <= endRange;
    });
    if (eventsInRange.length === 0) return [];
    const selectedEvents = this.shuffleArray(eventsInRange).slice(0, 3);
    return selectedEvents.map(event => ({
      id: `memory-${period.type}-${amount}-${event.id}`,
      type: 'memory',
      title: `Воспоминание: ${label}`,
      subtitle: event.title,
      originalDate: event.event_date,
      period: label,
      events: [event], // Пока один event, но можно расширить
      mediaCount: event.media.length,
      coverImage: event.media[0]?.file_url
    }));
  }
  async createMemoryStory(eventsCollection) {
    const slides = [];
    const totalMedia = eventsCollection.reduce((acc, event) => acc + event.media.length, 0);
    const oldestDate = format(new Date(Math.min(...eventsCollection.map(e => new Date(e.event_date)))), 'dd MMMM yyyy', { locale: ru });
    const newestDate = format(new Date(Math.max(...eventsCollection.map(e => new Date(e.event_date)))), 'dd MMMM yyyy', { locale: ru });
    const uniquePeriods = [...new Set(eventsCollection.map(e => e.memoryPeriod))];
    const periodLabel = uniquePeriods.length === 1 ? uniquePeriods[0] : `${uniquePeriods.length} периодов`;
    slides.push({
      type: 'memoryCover',
      title: '💭 Воспоминания',
      subtitle: eventsCollection.length === 1 ? oldestDate : `${oldestDate} - ${newestDate}`,
      stats: {
        events: eventsCollection.length,
        photos: totalMedia,
        period: periodLabel
      }
    });
    const eventsByDay = this.groupEventsByDay(eventsCollection);
    for (const [dayKey, dayEvents] of Object.entries(eventsByDay)) {
      if (Object.keys(eventsByDay).length > 1) {
        const dayDate = new Date(dayEvents[0].event_date);
        slides.push({
          type: 'dayHeader',
          date: format(dayDate, 'cccc, d MMMM yyyy', { locale: ru }),
          timeAgo: this.getTimeAgoLabel(dayEvents[0].event_date),
          eventsCount: dayEvents.length
        });
      }
      for (const event of dayEvents) {
        slides.push({
          type: 'memoryEvent',
          event,
          date: format(new Date(event.event_date), 'cccc, d MMMM yyyy', { locale: ru }),
          timeAgo: event.memoryPeriod || this.getTimeAgoLabel(event.event_date),
          hasMedia: event.media.length > 0,
          mainImage: event.media[0]?.file_url
        });
        event.media.forEach((media, index) => {
          slides.push({
            type: 'memoryMedia',
            event,
            media,
            mediaIndex: index,
            totalMedia: event.media.length,
            date: format(new Date(event.event_date), 'd MMMM yyyy', { locale: ru })
          });
        });
      }
    }
    return {
      type: 'memory',
      slides,
      totalEvents: eventsCollection.length,
      totalMedia,
      dateRange: eventsCollection.length === 1 ? oldestDate : `${oldestDate} - ${newestDate}`
    };
  }
  groupEventsByDay(events) {
    const grouped = {};
    events.forEach(event => {
      const dayKey = new Date(event.event_date).toDateString();
      if (!grouped[dayKey]) {
        grouped[dayKey] = [];
      }
      grouped[dayKey].push(event);
    });
    Object.keys(grouped).forEach(dayKey => {
      grouped[dayKey].sort((a, b) => new Date(a.event_date) - new Date(b.event_date));
    });
    return grouped;
  }
  async getRandomMemoryForMascot() {
    try {
      const response = await eventService.getEvents();
      const allEvents = response.data;
      const eventsWithMedia = await this.getEventsWithMedia(allEvents);
      if (eventsWithMedia.length === 0) return null;
      const memoryCollection = await this.createMemoryCollection(eventsWithMedia);
      return memoryCollection.length > 0 ? memoryCollection : null;
    } catch (error) {
      console.error('Error getting random memory for mascot:', error);
      return null;
    }
  }
  async createMemoryCollection(eventsWithMedia) {
    const today = new Date();
    const collectedEvents = [];
    const periods = [
      { type: 'year', amount: 1, label: 'год назад', maxEvents: 2 },
      { type: 'year', amount: 2, label: '2 года назад', maxEvents: 2 },
      { type: 'months', amount: 6, label: '6 месяцев назад', maxEvents: 1 },
      { type: 'months', amount: 3, label: '3 месяца назад', maxEvents: 1 },
      { type: 'months', amount: 1, label: 'месяц назад', maxEvents: 1 },
    ];
    for (const period of periods) {
      const periodEvents = this.getEventsFromPeriod(eventsWithMedia, today, period);
      if (periodEvents.length > 0) {
        const selectedEvents = this.shuffleArray(periodEvents)
          .slice(0, period.maxEvents)
          .map(event => ({
            ...event,
            memoryPeriod: period.label,
            memoryType: period.type
          }));
        collectedEvents.push(...selectedEvents);
        if (collectedEvents.length >= 7) break;
      }
    }
    collectedEvents.sort((a, b) => new Date(a.event_date) - new Date(b.event_date));
    return collectedEvents.slice(0, 7);
  }
  getEventsFromPeriod(eventsWithMedia, today, period) {
    const { type, amount } = period;
    let targetDate;
    if (type === 'year') {
      targetDate = subYears(today, amount);
    } else if (type === 'months') {
      targetDate = subMonths(today, amount);
    } else if (type === 'weeks') {
      targetDate = subWeeks(today, amount);
    } else {
      return [];
    }
    const startRange = subDays(targetDate, 14);
    const endRange = subDays(targetDate, -14);
    return eventsWithMedia.filter(event => {
      const eventDate = new Date(event.event_date);
      return eventDate >= startRange && eventDate <= endRange;
    });
  }
  shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
  getTimePeriodLabel(eventDate) {
    const daysDiff = differenceInDays(new Date(), new Date(eventDate));
    if (daysDiff < 7) return 'неделя назад';
    if (daysDiff < 30) return 'месяц назад';
    if (daysDiff < 90) return '3 месяца назад';
    if (daysDiff < 180) return '6 месяцев назад';
    if (daysDiff < 365) return 'год назад';
    const years = Math.floor(daysDiff / 365);
    return `${years} ${years === 1 ? 'год' : years < 5 ? 'года' : 'лет'} назад`;
  }
  getTimeAgoLabel(eventDate) {
    const daysDiff = differenceInDays(new Date(), new Date(eventDate));
    if (daysDiff === 0) return 'сегодня';
    if (daysDiff === 1) return 'вчера';
    if (daysDiff < 7) return `${daysDiff} дней назад`;
    if (daysDiff < 30) return `${Math.floor(daysDiff / 7)} недель назад`;
    if (daysDiff < 365) return `${Math.floor(daysDiff / 30)} месяцев назад`;
    const years = Math.floor(daysDiff / 365);
    return `${years} ${years === 1 ? 'год' : years < 5 ? 'года' : 'лет'} назад`;
  }
}
export default new MemoriesService();

