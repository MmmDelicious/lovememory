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

// Получение истории посещенных мест
exports.getPlaceHistory = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    // Пока возвращаем пустую историю
    // В будущем здесь будет запрос к базе данных
    res.json([]);
  } catch (error) {
    console.error('Get place history error:', error);
    res.status(500).json({ message: 'Ошибка при получении истории мест' });
  }
};

// Добавление места в историю
exports.addPlaceToHistory = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { placeId, placeName, placeType, visitDate } = req.body;
    
    // Пока просто возвращаем успешный ответ
    // В будущем здесь будет сохранение в базу данных
    res.json({ message: 'Место добавлено в историю' });
  } catch (error) {
    console.error('Add place to history error:', error);
    res.status(500).json({ message: 'Ошибка при добавлении места в историю' });
  }
};

// Поиск пользователей
exports.searchUsers = async (req, res, next) => {
  try {
    const { query } = req.query;
    
    // Пока возвращаем пустой результат
    // В будущем здесь будет поиск по базе данных
    res.json([]);
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ message: 'Ошибка при поиске пользователей' });
  }
};

// Сохранение FCM токена
exports.saveFCMToken = async (req, res, next) => {
  try {
    const { token } = req.body;
    const userId = req.user.id;
    
    // Пока просто возвращаем успешный ответ
    // В будущем здесь будет сохранение в базу данных
    res.json({ message: 'FCM token сохранен' });
  } catch (error) {
    console.error('Save FCM token error:', error);
    res.status(500).json({ message: 'Ошибка при сохранении FCM токена' });
  }
};