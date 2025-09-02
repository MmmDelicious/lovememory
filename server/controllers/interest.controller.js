const { Interest, UserInterest, User } = require('../models');
const { ValidationError, NotFoundError } = require('../utils/errors');

/**
 * Получить все доступные интересы
 */
exports.getAllInterests = async (req, res, next) => {
  try {
    const { category, search, limit = 100 } = req.query;
    
    const where = { is_active: true };
    
    if (category) {
      where.category = category;
    }
    
    if (search) {
      where.name = {
        [require('sequelize').Op.iLike]: `%${search}%`
      };
    }
    
    const interests = await Interest.findAll({
      where,
      attributes: ['id', 'name', 'category', 'description', 'emoji', 'is_active', 'popularity_score'],
      order: [['popularity_score', 'DESC'], ['name', 'ASC']],
      limit: parseInt(limit)
    });
    
    res.status(200).json(interests);
  } catch (error) {
    next(error);
  }
};

/**
 * Получить интересы по категориям
 */
exports.getInterestsByCategory = async (req, res, next) => {
  try {
    const interests = await Interest.findAll({
      where: { is_active: true },
      attributes: ['id', 'name', 'category', 'description', 'emoji', 'is_active', 'popularity_score'],
      order: [['category', 'ASC'], ['popularity_score', 'DESC'], ['name', 'ASC']]
    });
    
    // Группируем по категориям
    const groupedInterests = interests.reduce((acc, interest) => {
      if (!acc[interest.category]) {
        acc[interest.category] = [];
      }
      acc[interest.category].push(interest);
      return acc;
    }, {});
    
    res.status(200).json(groupedInterests);
  } catch (error) {
    next(error);
  }
};

/**
 * Получить популярные интересы
 */
exports.getPopularInterests = async (req, res, next) => {
  try {
    const { limit = 20 } = req.query;
    
    const interests = await Interest.getPopular(parseInt(limit));
    res.status(200).json(interests);
  } catch (error) {
    next(error);
  }
};

/**
 * Получить интересы пользователя
 */
exports.getUserInterests = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { preference } = req.query;
    
    // Проверяем права доступа (пользователь может смотреть только свои интересы)
    if (userId !== req.user.id) {
      const error = new Error('Access denied');
      error.statusCode = 403;
      throw error;
    }
    
    const userInterests = await UserInterest.getForUser(userId, preference);
    res.status(200).json(userInterests);
  } catch (error) {
    next(error);
  }
};

/**
 * Добавить/обновить интерес пользователя
 */
exports.setUserInterest = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { interest_id, preference, intensity, metadata } = req.body;
    
    // Проверяем права доступа
    if (userId !== req.user.id) {
      const error = new Error('Access denied');
      error.statusCode = 403;
      throw error;
    }
    
    // Валидация
    if (!interest_id || !preference) {
      const error = new ValidationError('interest_id and preference are required');
      throw error;
    }
    
    // Проверяем существование интереса
    const interest = await Interest.findByPk(interest_id);
    if (!interest || !interest.is_active) {
      const error = new NotFoundError('Interest not found');
      throw error;
    }
    
    // Создаем или обновляем интерес пользователя
    const [userInterest, created] = await UserInterest.upsert({
      user_id: userId,
      interest_id,
      preference,
      intensity: intensity || 5,
      metadata: metadata || {},
      added_at: created ? new Date() : undefined
    });
    
    // Увеличиваем популярность интереса
    if (created && (preference === 'love' || preference === 'like')) {
      await Interest.incrementPopularity(interest_id);
    }
    
    // Получаем полную информацию об интересе
    const fullUserInterest = await UserInterest.findOne({
      where: { user_id: userId, interest_id },
      include: [{
        model: Interest,
        as: 'Interest'
      }]
    });
    
    res.status(created ? 201 : 200).json(fullUserInterest);
  } catch (error) {
    next(error);
  }
};

/**
 * Массовое добавление интересов пользователя (для онбординга)
 */
exports.setMultipleUserInterests = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { interests } = req.body; // [{ interest_id, preference, intensity }]
    

    
    // Проверяем права доступа
    if (userId !== req.user.id) {
      const error = new Error('Access denied');
      error.statusCode = 403;
      throw error;
    }
    
    // Проверяем существование пользователя
    const user = await User.findByPk(userId);
    if (!user) {
      const error = new NotFoundError('User not found');
      throw error;
    }

    
    if (!Array.isArray(interests) || interests.length === 0) {
      const error = new ValidationError('interests array is required');
      throw error;
    }
    
    const results = [];
    const interestIds = [];
    
    for (const interestData of interests) {
      const { interest_id, preference, intensity } = interestData;
      

      
      // Валидация каждого интереса
      if (!interest_id || !preference) {

        continue; // Пропускаем некорректные данные
      }
      
      // Проверяем существование интереса
      const interest = await Interest.findByPk(interest_id);
      if (!interest || !interest.is_active) {

        continue; // Пропускаем несуществующие интересы
      }
      

      
      const [userInterest, created] = await UserInterest.upsert({
        user_id: userId,
        interest_id,
        preference,
        intensity: intensity || 5,
        metadata: {}
      });
      

      results.push(userInterest);
      
      // Увеличиваем популярность интереса
      if (created && (preference === 'love' || preference === 'like')) {
        interestIds.push(interest_id);
      }
    }
    

    
    // Массово увеличиваем популярность
    for (const interestId of interestIds) {
      await Interest.incrementPopularity(interestId);
    }
    
    // Получаем полную информацию о добавленных интересах
    const fullUserInterests = await UserInterest.findAll({
      where: { 
        user_id: userId,
        interest_id: results.map(r => r.interest_id)
      },
      include: [{
        model: Interest,
        as: 'Interest'
      }]
    });
    

    res.status(201).json(fullUserInterests);
  } catch (error) {

    next(error);
  }
};

/**
 * Удалить интерес пользователя
 */
exports.removeUserInterest = async (req, res, next) => {
  try {
    const { userId, interestId } = req.params;
    
    // Проверяем права доступа
    if (userId !== req.user.id) {
      const error = new Error('Access denied');
      error.statusCode = 403;
      throw error;
    }
    
    const deleted = await UserInterest.destroy({
      where: {
        user_id: userId,
        interest_id: interestId
      }
    });
    
    if (deleted === 0) {
      const error = new NotFoundError('User interest not found');
      throw error;
    }
    
    res.status(200).json({ message: 'Interest removed successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * Найти общие интересы между пользователями в паре
 */
exports.getCommonInterests = async (req, res, next) => {
  try {
    const { userId1, userId2 } = req.params;
    
    // Проверяем права доступа (пользователь должен быть одним из участников)
    if (userId1 !== req.user.id && userId2 !== req.user.id) {
      const error = new Error('Access denied');
      error.statusCode = 403;
      throw error;
    }
    
    const commonInterests = await UserInterest.findCommonInterests(userId1, userId2);
    res.status(200).json(commonInterests);
  } catch (error) {
    next(error);
  }
};

/**
 * Обновить активность интереса (когда пользователь взаимодействует с интересом)
 */
exports.updateInterestActivity = async (req, res, next) => {
  try {
    const { userId, interestId } = req.params;
    
    // Проверяем права доступа
    if (userId !== req.user.id) {
      const error = new Error('Access denied');
      error.statusCode = 403;
      throw error;
    }
    
    await UserInterest.updateActivity(userId, interestId);
    res.status(200).json({ message: 'Activity updated successfully' });
  } catch (error) {
    next(error);
  }
};
