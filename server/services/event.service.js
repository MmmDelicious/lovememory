const { Op } = require('sequelize');
const { Event, Media, User, Pair, ActivityLog } = require('../models');

class EventService {
  async getEventsForUser(userId) {
    const activePair = await Pair.findOne({
      where: {
        status: 'active',
        [Op.or]: [{ user1Id: userId }, { user2Id: userId }],
      },
    });

    let whereClause = { userId: userId };

    if (activePair) {
      const partnerId = activePair.user1Id === userId ? activePair.user2Id : activePair.user1Id;
      whereClause = {
        [Op.or]: [
          { userId: userId },
          { userId: partnerId, isShared: true }
        ]
      };
    }

    const allEvents = await Event.findAll({
      where: whereClause,
      order: [['event_date', 'DESC']],
      include: [{ model: User, attributes: ['email', 'first_name'] }]
    });

    return allEvents;
  }

  async createEvent(userId, eventData) {
    const { title, description, event_date, end_date, event_type, isShared, is_recurring, recurrence_rule } = eventData;
    
    // Находим активную пару пользователя для логирования
    const activePair = await Pair.findOne({
      where: {
        status: 'active',
        [Op.or]: [{ user1Id: userId }, { user2Id: userId }],
      },
    });

    const newEvent = await Event.create({
      title,
      description,
      event_date: event_date || new Date(),
      end_date: end_date || null,
      event_type,
      isShared: isShared || false,
      is_recurring: is_recurring || false,
      recurrence_rule: recurrence_rule || null,
      userId: userId,
      pair_id: activePair?.id || null, // Добавляем pair_id если есть активная пара
    });

    // Логируем создание события
    if (activePair) {
      await ActivityLog.logEventCreated(activePair.id, userId, {
        id: newEvent.id,
        title: newEvent.title,
        event_type: newEvent.event_type,
        isShared: newEvent.isShared
      });
    }

    return Event.findByPk(newEvent.id, {
        include: [{ model: User, attributes: ['email', 'first_name'] }]
    });
  }

  async updateEvent(eventId, userId, updateData) {
    const event = await Event.findOne({ where: { id: eventId, userId: userId } });

    if (!event) {
      const error = new Error('Событие не найдено или у вас нет прав на его редактирование.');
      error.statusCode = 404;
      throw error;
    }
    
    await event.update(updateData);
    return Event.findByPk(event.id, {
        include: [{ model: User, attributes: ['email', 'first_name'] }]
    });
  }

  async deleteEvent(eventId, userId) {
    const event = await Event.findOne({ where: { id: eventId, userId: userId } });
    if (!event) {
      const error = new Error('Событие не найдено или у вас нет прав на его удаление.');
      error.statusCode = 404;
      throw error;
    }
    await event.destroy();
    return { message: 'Событие успешно удалено' };
  }

  async addMediaToEvent(eventId, userId, file) {
    if (!file) {
      const error = new Error('Файл не был загружен');
      error.statusCode = 400;
      throw error;
    }

    const event = await Event.findOne({ where: { id: eventId, userId: userId } });
    if (!event) {
      const error = new Error('Событие не найдено для загрузки');
      error.statusCode = 404;
      throw error;
    }

    return Media.create({
      eventId: eventId,
      file_url: `/uploads/${file.filename}`,
      file_type: 'image',
    });
  }

  async getMediaForEvent(eventId, userId) {
    const event = await Event.findByPk(eventId);
    if (!event) {
      const error = new Error('Событие не найдено');
      error.statusCode = 404;
      throw error;
    }

    const activePair = await Pair.findOne({
        where: {
            status: 'active',
            [Op.or]: [{ user1Id: userId }, { user2Id: userId }]
        }
    });
    
    const partnerId = activePair ? (activePair.user1Id === userId ? activePair.user2Id : activePair.user1Id) : null;

    if (event.userId !== userId && event.userId !== partnerId) {
        const error = new Error('У вас нет доступа к медиа этого события');
        error.statusCode = 403;
        throw error;
    }

    return Media.findAll({ where: { eventId: eventId } });
  }

  async moveMediaToEvent(mediaId, targetEventId, userId) {
    try {
      // Проверяем, что медиа существует и принадлежит пользователю
      const media = await Media.findByPk(mediaId, {
        include: [{ model: Event }]
      });

      if (!media) {
        const error = new Error('Медиа не найдено');
        error.statusCode = 404;
        throw error;
      }

      if (!media.Event || media.Event.userId !== userId) {
        const error = new Error('У вас нет прав на перемещение этого медиа');
        error.statusCode = 403;
        throw error;
      }

      // Проверяем, что целевое событие существует и принадлежит пользователю
      const targetEvent = await Event.findOne({ 
        where: { id: targetEventId, userId: userId } 
      });

      if (!targetEvent) {
        const error = new Error('Целевое событие не найдено или у вас нет прав на него');
        error.statusCode = 404;
        throw error;
      }

      // Перемещаем медиа
      await media.update({ eventId: targetEventId });

      return { message: 'Медиа успешно перемещено' };
    } catch (error) {
      console.error('Error in moveMediaToEvent:', error);
      throw error;
    }
  }
}

module.exports = new EventService();