const eventService = require('../services/event.service');
const activityService = require('../services/activity.service');
const { triggerAnalysisOnEvent } = require('./queue.controller');
exports.getEvents = async (req, res, next) => {
  try {
    const events = await eventService.getEventsForUser(req.user.id);
    res.status(200).json(events);
  } catch (error) {
    next(error);
  }
};
exports.createEvent = async (req, res, next) => {
  try {
    const newEvent = await eventService.createEvent(req.user.id, req.body);
    
    // Логируем создание события
    await activityService.logEventCreated(req.user.id, {
      eventId: newEvent.id,
      title: newEvent.title,
      type: newEvent.event_type,
      scheduled_at: newEvent.event_date,
      pairId: newEvent.pair_id
    });

    // 🚀 Автоматически запускаем фоновый анализ (если Redis доступен)
    try {
      await triggerAnalysisOnEvent(req.user.id, newEvent.id);
      // Тихо - логи уже в triggerAnalysisOnEvent
    } catch (error) {
      // Тихо пропускаем ошибки - не должны влиять на создание события
    }
    
    res.status(201).json(newEvent);
  } catch (error) {
    next(error);
  }
};
exports.updateEvent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updatedEvent = await eventService.updateEvent(id, req.user.id, req.body);
    res.status(200).json(updatedEvent);
  } catch (error) {
    next(error);
  }
};
exports.deleteEvent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await eventService.deleteEvent(id, req.user.id);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
exports.uploadFile = async (req, res, next) => {
  try {
    const { id } = req.params;
    const newMedia = await eventService.addMediaToEvent(id, req.user.id, req.file);
    
    // Логируем загрузку медиа
    await activityService.logMediaShared(req.user.id, {
      size_MB: req.file.size / (1024 * 1024),
      type: req.file.mimetype.startsWith('image/') ? 'photo' : 'video',
      mediaId: newMedia.id,
      eventId: id
    });
    
    // Логируем создание воспоминания
    await activityService.logMemoryCreated(req.user.id, {
      memoryId: newMedia.id,
      media_count: 1,
      is_shared: true,
      eventId: id
    });
    
    res.status(201).json(newMedia);
  } catch (error) {
    next(error);
  }
};
exports.getMediaForEvent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const media = await eventService.getMediaForEvent(id, req.user.id);
    res.status(200).json(media);
  } catch (error) {
    next(error);
  }
};
exports.moveMediaToEvent = async (req, res, next) => {
  try {
    const { mediaId } = req.params;
    const { targetEventId } = req.body;
    const result = await eventService.moveMediaToEvent(mediaId, targetEventId, req.user.id);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
