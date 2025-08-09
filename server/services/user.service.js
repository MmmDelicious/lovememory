const { User, Event, GameRoom, Media } = require('../models');
const { Op } = require('sequelize');
const fs = require('fs').promises;
const path = require('path');

class UserService {
  async getProfile(userId) {
    const user = await User.findByPk(userId, {
      attributes: ['id', 'email', 'first_name', 'last_name', 'bio', 'avatarUrl', 'telegram_chat_id', 'coins', 'gender', 'age', 'city']
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
    const { first_name, last_name, bio, telegram_chat_id, gender, age, city } = updateData;
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
    if (bio !== undefined) user.bio = bio;
    if (telegram_chat_id !== undefined) user.telegram_chat_id = telegram_chat_id;
    if (gender !== undefined) user.gender = gender;
    if (age !== undefined) user.age = age;
    if (city !== undefined) user.city = city;
    
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
        city: user.city
    };
  }

  async getProfileStats(userId) {
    // Получаем количество событий
    const eventsCount = await Event.count({
      where: { userId: userId }
    });

    // Получаем количество медиа (воспоминаний)
    const memoriesCount = await Media.count({
      include: [{
        model: Event,
        where: { userId: userId }
      }]
    });

    // Получаем количество сыгранных игр (используем правильный статус)
    const gamesPlayed = await GameRoom.count({
      where: {
        [Op.or]: [
          { hostId: userId },
          { players: { [Op.contains]: [userId] } }
        ],
        status: 'finished'
      }
    });

    // Получаем информацию о пользователе
    const user = await User.findByPk(userId, {
      attributes: ['coins', 'createdAt']
    });

    // Вычисляем дни с регистрации
    const daysSinceRegistration = Math.floor((new Date() - new Date(user.createdAt)) / (1000 * 60 * 60 * 24));

    return {
      events: eventsCount,
      memories: memoriesCount,
      gamesPlayed: gamesPlayed,
      coins: user.coins,
      daysSinceRegistration: daysSinceRegistration
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
        console.log('Старый аватар не найден для удаления:', error.message);
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