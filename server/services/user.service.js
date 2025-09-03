const { User, Event, GameRoom, Media } = require('../models');
const { Op } = require('sequelize');
const fs = require('fs').promises;
const path = require('path');

class UserService {
  async getProfile(userId) {
    const user = await User.findByPk(userId, {
      attributes: ['id', 'email', 'first_name', 'last_name', 'display_name', 'locale', 'bio', 'avatarUrl', 'telegram_chat_id', 'coins', 'gender', 'age', 'city', 'role', 'last_active', 'streak_days', 'total_login_days', 'preferences']
    });
    if (!user) {
      const error = new Error('Пользователь не найден.');
      error.statusCode = 404;
      throw error;
    }
    
    // Формируем полный URL для аватара
    const baseUrl = 'http://localhost:5000';
    const fullAvatarUrl = user.avatarUrl ? `${baseUrl}${user.avatarUrl}` : null;
    
    return {
      ...user.toJSON(),
      avatarUrl: fullAvatarUrl
    };
  }

  async updateProfile(userId, updateData) {
    const { first_name, last_name, display_name, locale, bio, telegram_chat_id, gender, age, city, preferences } = updateData;
    const user = await User.findByPk(userId);

    if (!user) {
      const error = new Error('Пользователь не найден.');
      error.statusCode = 404;
      throw error;
    }

    if (telegram_chat_id) {
        const existingUser = await User.findOne({ where: { telegram_chat_id } });
        if (existingUser && existingUser.id !== userId) {
            const error = new Error('Этот Telegram ID уже привязан к другому аккаунту.');
            error.statusCode = 400;
            throw error;
        }
    }
    
    // Обновляем поля профиля
    if (first_name !== undefined) user.first_name = first_name;
    if (last_name !== undefined) user.last_name = last_name;
    if (display_name !== undefined) user.display_name = display_name;
    if (locale !== undefined) user.locale = locale;
    if (bio !== undefined) user.bio = bio;
    if (telegram_chat_id !== undefined) user.telegram_chat_id = telegram_chat_id;
    if (gender !== undefined) user.gender = gender;
    if (age !== undefined) user.age = age;
    if (city !== undefined) user.city = city;
    if (preferences !== undefined) user.preferences = preferences;
    
    await user.save();
    
    // Формируем полный URL для аватара
    const baseUrl = 'http://localhost:5000';
    const fullAvatarUrl = user.avatarUrl ? `${baseUrl}${user.avatarUrl}` : null;

    return {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        bio: user.bio,
        avatarUrl: fullAvatarUrl,
        telegram_chat_id: user.telegram_chat_id,
        coins: user.coins,
        gender: user.gender,
        age: user.age,
        city: user.city,
        role: user.role,
        last_active: user.last_active,
        streak_days: user.streak_days,
        total_login_days: user.total_login_days,
        preferences: user.preferences
    };
  }

  async getProfileStats(userId) {
    // Оптимизация: выполняем все запросы параллельно
    const [eventsCount, memoriesCount, gamesPlayed, user] = await Promise.all([
      // Получаем количество событий
      Event.count({
        where: { userId: userId }
      }),
      
      // Получаем количество медиа (воспоминаний)
      Media.count({
        include: [{
          model: Event,
          where: { userId: userId }
        }]
      }),
      
      // Получаем количество сыгранных игр
      GameRoom.count({
        where: {
          [Op.or]: [
            { host_id: userId },
            { players: { [Op.contains]: [userId] } }
          ],
          status: 'finished'
        }
      }),
      
      // Получаем информацию о пользователе
      User.findByPk(userId, {
        attributes: ['coins', 'createdAt', 'streak_days', 'total_login_days', 'last_active', 'role']
      })
    ]);

    // Вычисляем дни с регистрации
    const daysSinceRegistration = Math.floor((new Date() - new Date(user.createdAt)) / (1000 * 60 * 60 * 24));

    return {
      events: eventsCount,
      memories: memoriesCount,
      gamesPlayed: gamesPlayed,
      coins: user.coins,
      daysSinceRegistration: daysSinceRegistration,
      streakDays: user.streak_days,
      totalLoginDays: user.total_login_days,
      lastActive: user.last_active,
      role: user.role
    };
  }

  async uploadAvatar(userId, file) {
    const user = await User.findByPk(userId);
    if (!user) {
      const error = new Error('Пользователь не найден.');
      error.statusCode = 404;
      throw error;
    }

    // Удаляем старый аватар если есть
    if (user.avatarUrl && user.avatarUrl !== '/uploads/default-avatar.png') {
      try {
        const oldAvatarPath = path.join(__dirname, '..', user.avatarUrl);
        await fs.unlink(oldAvatarPath);
      } catch (error) {
        }
    }

    // Сохраняем новый аватар
    const avatarUrl = `/uploads/${file.filename}`;
    user.avatarUrl = avatarUrl;
    await user.save();

    // Возвращаем полный URL для клиента
    const baseUrl = 'http://localhost:5000';
    const fullAvatarUrl = `${baseUrl}${avatarUrl}`;
    
    return fullAvatarUrl;
  }
}

module.exports = new UserService();