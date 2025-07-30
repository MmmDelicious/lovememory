const { User } = require('../models');

class UserService {
  async getProfile(userId) {
    const user = await User.findByPk(userId, {
      attributes: ['id', 'email', 'first_name', 'telegram_chat_id', 'coins']
    });
    if (!user) {
      const error = new Error('Пользователь не найден.');
      error.statusCode = 404;
      throw error;
    }
    return user;
  }

  async updateProfile(userId, updateData) {
    const { telegram_chat_id } = updateData;
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
    
    user.telegram_chat_id = telegram_chat_id || null;
    await user.save();
    
    return {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        telegram_chat_id: user.telegram_chat_id,
        coins: user.coins
    };
  }
}

module.exports = new UserService();