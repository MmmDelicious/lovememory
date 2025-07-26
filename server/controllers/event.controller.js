const { Op } = require('sequelize');
const { Event, Media, User, Pair } = require('../models');
// const RecurringEventService = require('../services/recurringEvent.service'); // временно отключено

exports.getEvents = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Пользователь не аутентифицирован.' });
    }
    const userId = req.user.id;
    let userIds = [userId];

    const activePair = await Pair.findOne({
      where: {
        status: 'active',
        [Op.or]: [{ user1Id: userId }, { user2Id: userId }],
      },
    });

    if (activePair) {
      const partnerId = activePair.user1Id === userId ? activePair.user2Id : activePair.user1Id;
      userIds.push(partnerId);
    }

    // Получаем события пользователя (личные + общие которые он создал)
    const userEvents = await Event.findAll({
      where: {
        userId: userId
      },
      order: [['event_date', 'DESC']],
      include: [{ model: User, attributes: ['email', 'first_name'] }]
    });

    let allEvents = [...userEvents];

    // Если есть пара, добавляем общие события партнера
    if (activePair) {
      const partnerId = activePair.user1Id === userId ? activePair.user2Id : activePair.user1Id;
      
      const partnerSharedEvents = await Event.findAll({
        where: {
          userId: partnerId,
          isShared: true // Только общие события партнера
        },
        order: [['event_date', 'DESC']],
        include: [{ model: User, attributes: ['email', 'first_name'] }]
      });

      allEvents = [...allEvents, ...partnerSharedEvents];
    }

    res.status(200).json(allEvents);
  } catch (error) {
    console.error('!!! Ошибка в getEvents:', error);
    res.status(500).json({ message: 'Ошибка на сервере', error: error.message });
  }
};

exports.createEvent = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Пользователь не аутентифицирован.' });
    }
    const { 
      title, 
      description, 
      event_date, 
      event_type, 
      isShared, 
      is_recurring, 
      recurrence_rule 
    } = req.body;

    const newEvent = await Event.create({
      title,
      description,
      event_date: event_date || new Date(),
      event_type,
      isShared: isShared || false,
      is_recurring: is_recurring || false,
      recurrence_rule: recurrence_rule || null,
      userId: req.user.id,
    });
    res.status(201).json(newEvent);
  } catch (error) {
    console.error('!!! Ошибка в createEvent:', error);
    res.status(500).json({ message: 'Ошибка на сервере', error: error.message });
  }
};

// --- ИЗМЕНЕНИЯ ЗДЕСЬ ---
exports.updateEvent = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Пользователь не аутентифицирован.' });
    }
    const { id } = req.params;
    // Получаем все возможные поля из тела запроса
    const { 
      title, 
      description, 
      event_date, 
      end_date, 
      event_type, 
      isShared, 
      is_recurring, 
      recurrence_rule 
    } = req.body;

    const event = await Event.findOne({ where: { id, userId: req.user.id } });

    if (!event) {
      return res.status(404).json({ message: 'Событие не найдено или у вас нет прав на его редактирование.' });
    }

    // Создаем объект с данными для обновления
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (event_date !== undefined) updateData.event_date = event_date;
    if (end_date !== undefined) updateData.end_date = end_date;
    if (event_type !== undefined) updateData.event_type = event_type;
    if (isShared !== undefined) updateData.isShared = isShared;
    if (is_recurring !== undefined) updateData.is_recurring = is_recurring;
    if (recurrence_rule !== undefined) updateData.recurrence_rule = recurrence_rule;

    // Обновляем событие только теми полями, которые были переданы
    await event.update(updateData);
    
    res.status(200).json(event);
  } catch (error) {
    console.error('!!! Ошибка в updateEvent:', error);
    res.status(500).json({ message: 'Ошибка на сервере', error: error.message });
  }
};
// --- КОНЕЦ ИЗМЕНЕНИЙ ---

exports.deleteEvent = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Пользователь не аутентифицирован.' });
    }
    const { id } = req.params;
    const event = await Event.findOne({ where: { id, userId: req.user.id } });
    if (!event) {
      return res.status(404).json({ message: 'Событие не найдено или у вас нет прав на его удаление.' });
    }
    await event.destroy();
    res.status(200).json({ message: 'Событие успешно удалено' });
  } catch (error) {
    console.error('!!! Ошибка в deleteEvent:', error);
    res.status(500).json({ message: 'Ошибка на сервере', error: error.message });
  }
};

exports.uploadFile = async (req, res) => {
  const { id } = req.params;
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Пользователь не аутентифицирован.' });
    }
    if (!req.file) {
      return res.status(400).json({ message: 'Файл не был загружен' });
    }
    const event = await Event.findOne({ where: { id, userId: req.user.id } });
    if (!event) {
      return res.status(404).json({ message: 'Событие не найдено для загрузки' });
    }
    const newMedia = await Media.create({
      eventId: id,
      file_url: `/uploads/${req.file.filename}`,
      file_type: 'image',
    });
    res.status(201).json(newMedia);
  } catch (error) {
    console.error(`!!! Ошибка в uploadFile для события ${id}:`, error);
    res.status(500).json({ message: 'Ошибка на сервере', error: error.message });
  }
};

exports.getMediaForEvent = async (req, res) => {
  const { id } = req.params;
  try {
    if (!req.user || !req.user.id) {
        return res.status(401).json({ message: 'Пользователь не аутентифицирован.' });
    }
    const event = await Event.findByPk(id);
    if (!event) {
        return res.status(404).json({ message: 'Событие не найдено' });
    }

    const activePair = await Pair.findOne({
        where: {
            status: 'active',
            [Op.or]: [{ user1Id: req.user.id }, { user2Id: req.user.id }]
        }
    });
    
    const partnerId = activePair ? (activePair.user1Id === req.user.id ? activePair.user2Id : activePair.user1Id) : null;

    if (event.userId !== req.user.id && event.userId !== partnerId) {
        return res.status(403).json({ message: 'У вас нет доступа к медиа этого события' });
    }

    const media = await Media.findAll({ where: { eventId: id } });
    res.status(200).json(media);
  } catch (error) {
    console.error(`!!! Ошибка в getMediaForEvent для события ${id}:`, error);
    res.status(500).json({ message: 'Ошибка на сервере', error: error.message });
  }
};