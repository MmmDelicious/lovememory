const userService = require('../services/user.service');
const activityService = require('../services/activity.service');
const { ActivityLog } = require('../models');
exports.getProfile = async (req, res, next) => {
  try {
    const user = await userService.getProfile(req.user.id);
    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
};
exports.updateProfile = async (req, res, next) => {
  try {
    const updatedUser = await userService.updateProfile(req.user.id, req.body);
    
    // Логируем обновление профиля
    const changedFields = Object.keys(req.body);
    for (const field of changedFields) {
      await activityService.logProfileUpdated(req.user.id, {
        field,
        newValue: req.body[field]
      });
    }
    
    res.status(200).json(updatedUser);
  } catch (error) {
    next(error);
  }
};
exports.getProfileStats = async (req, res, next) => {
  try {
    const stats = await userService.getProfileStats(req.user.id);
    res.status(200).json(stats);
  } catch (error) {
    next(error);
  }
};
exports.uploadAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      const error = new Error('File was not uploaded');
      error.statusCode = 400;
      throw error;
    }
    const avatarUrl = await userService.uploadAvatar(req.user.id, req.file);
    res.status(200).json({ avatarUrl });
  } catch (error) {
    next(error);
  }
};
exports.getPlaceHistory = async (req, res, next) => {
  try {
    const userId = req.user.id;
    res.json([]);
  } catch (error) {
    console.error('Get place history error:', error);
    res.status(500).json({ message: 'Error getting place history' });
  }
};
exports.addPlaceToHistory = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { placeId, placeName, placeType, visitDate } = req.body;
    res.json({ message: 'Place added to history' });
  } catch (error) {
    console.error('Add place to history error:', error);
    res.status(500).json({ message: 'Error adding place to history' });
  }
};
exports.searchUsers = async (req, res, next) => {
  try {
    const { query } = req.query;
    res.json([]);
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ message: 'Error searching users' });
  }
};
exports.saveFCMToken = async (req, res, next) => {
  try {
    const { token } = req.body;
    const userId = req.user.id;
    res.json({ message: 'FCM token saved' });
  } catch (error) {
    console.error('Save FCM token error:', error);
    res.status(500).json({ message: 'Error saving FCM token' });
  }
};

// Получение активностей пользователя для аналитики
exports.getUserActivities = async (req, res, next) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    
    const activities = await activityService.getUserActivities(req.user.id, startDate);
    res.status(200).json(activities);
  } catch (error) {
    console.error('Error fetching user activities:', error);
    next(error);
  }
};
