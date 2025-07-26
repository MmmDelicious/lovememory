const { Event } = require('../models');
const { Op } = require('sequelize');

class RecurringEventService {
  /**
   * Генерирует экземпляры повторяющегося события
   * @param {Object} event - Родительское событие
   * @param {Date} startDate - Начальная дата диапазона
   * @param {Date} endDate - Конечная дата диапазона
   * @returns {Array} Массив событий
   */
  static generateInstances(event, startDate, endDate) {
    if (!event.is_recurring || !event.recurrence_rule) {
      return [event];
    }

    const instances = [];
    const rule = event.recurrence_rule;
    const eventStart = new Date(event.event_date);
    let currentDate = new Date(eventStart);

    // Простая реализация для основных типов повторений
    while (currentDate <= endDate && instances.length < 365) { // Лимит для безопасности
      if (currentDate >= startDate) {
        const instance = {
          ...event.toJSON(),
          id: `${event.id}_${currentDate.toISOString().split('T')[0]}`,
          event_date: new Date(currentDate),
          end_date: event.end_date ? 
            new Date(currentDate.getTime() + (new Date(event.end_date) - eventStart)) : 
            null,
          parent_event_id: event.id,
          is_instance: true
        };
        instances.push(instance);
      }

      // Вычисляем следующую дату на основе правила
      switch (rule.freq) {
        case 'DAILY':
          currentDate.setDate(currentDate.getDate() + (rule.interval || 1));
          break;
        case 'WEEKLY':
          currentDate.setDate(currentDate.getDate() + 7 * (rule.interval || 1));
          break;
        case 'MONTHLY':
          currentDate.setMonth(currentDate.getMonth() + (rule.interval || 1));
          break;
        case 'YEARLY':
          currentDate.setFullYear(currentDate.getFullYear() + (rule.interval || 1));
          break;
        default:
          break;
      }

      // Проверяем условие окончания
      if (rule.until && currentDate > new Date(rule.until)) {
        break;
      }
      if (rule.count && instances.length >= rule.count) {
        break;
      }
    }

    return instances;
  }

  /**
   * Обновляет серию повторяющихся событий
   * @param {string} eventId - ID события
   * @param {Object} changes - Изменения
   * @param {string} updateType - 'this', 'future', 'all'
   */
  static async updateSeries(eventId, changes, updateType = 'this') {
    const event = await Event.findByPk(eventId);
    if (!event) {
      throw new Error('Событие не найдено');
    }

    const parentId = event.parent_event_id || event.id;
    
    switch (updateType) {
      case 'this':
        // Обновляем только это событие
        await event.update(changes);
        break;
        
      case 'future':
        // Обновляем это и все будущие события
        await Event.update(changes, {
          where: {
            [Op.or]: [
              { id: parentId },
              { parent_event_id: parentId }
            ],
            event_date: {
              [Op.gte]: event.event_date
            }
          }
        });
        break;
        
      case 'all':
        // Обновляем всю серию
        await Event.update(changes, {
          where: {
            [Op.or]: [
              { id: parentId },
              { parent_event_id: parentId }
            ]
          }
        });
        break;
    }
  }

  /**
   * Удаляет серию повторяющихся событий
   * @param {string} eventId - ID события
   * @param {string} deleteType - 'this', 'future', 'all'
   */
  static async deleteSeries(eventId, deleteType = 'this') {
    const event = await Event.findByPk(eventId);
    if (!event) {
      throw new Error('Событие не найдено');
    }

    const parentId = event.parent_event_id || event.id;
    
    switch (deleteType) {
      case 'this':
        // Удаляем только это событие
        await event.destroy();
        break;
        
      case 'future':
        // Удаляем это и все будущие события
        await Event.destroy({
          where: {
            [Op.or]: [
              { id: parentId },
              { parent_event_id: parentId }
            ],
            event_date: {
              [Op.gte]: event.event_date
            }
          }
        });
        break;
        
      case 'all':
        // Удаляем всю серию
        await Event.destroy({
          where: {
            [Op.or]: [
              { id: parentId },
              { parent_event_id: parentId }
            ]
          }
        });
        break;
    }
  }

  /**
   * Создает простое правило повторения
   * @param {string} frequency - 'daily', 'weekly', 'monthly', 'yearly'
   * @param {number} interval - Интервал повторения
   * @param {Date} until - Дата окончания (опционально)
   * @param {number} count - Количество повторений (опционально)
   */
  static createRecurrenceRule(frequency, interval = 1, until = null, count = null) {
    return {
      freq: frequency.toUpperCase(),
      interval,
      until: until ? until.toISOString() : null,
      count
    };
  }
}

module.exports = RecurringEventService; 