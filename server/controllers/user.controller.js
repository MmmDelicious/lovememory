const userService = require('../services/user.service');

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
      const error = new Error('Файл не был загружен');
      error.statusCode = 400;
      throw error;
    }
    
    const avatarUrl = await userService.uploadAvatar(req.user.id, req.file);
    res.status(200).json({ avatarUrl });
  } catch (error) {
    next(error);
  }
};