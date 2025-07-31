const { Op } = require('sequelize');
const { Event, Media, User, Pair } = require('../models');

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
    });
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
}

module.exports = new EventService();