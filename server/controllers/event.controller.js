const eventService = require('../services/event.service');
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
    console.log('Moving media:', { mediaId, targetEventId, userId: req.user.id });
    const result = await eventService.moveMediaToEvent(mediaId, targetEventId, req.user.id);
    res.status(200).json(result);
  } catch (error) {
    console.error('Error in moveMediaToEvent controller:', error);
    next(error);
  }
};
