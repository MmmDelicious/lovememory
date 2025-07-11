const { User } = require('../models');

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'email', 'first_name', 'telegram_chat_id', 'coins']
    });
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден.' });
    }
    res.status(200).json(user);
  } catch (error) {
    console.error('!!! Ошибка в getProfile:', error);
    res.status(500).json({ message: 'Ошибка на сервере' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { telegram_chat_id } = req.body;
    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден.' });
    }

    if (telegram_chat_id) {
        const existingUser = await User.findOne({ where: { telegram_chat_id } });
        if (existingUser && existingUser.id !== req.user.id) {
            return res.status(400).json({ message: 'Этот Telegram ID уже привязан к другому аккаунту.' });
        }
    }
    
    user.telegram_chat_id = telegram_chat_id || null;
    await user.save();
    
    res.status(200).json({
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        telegram_chat_id: user.telegram_chat_id,
        coins: user.coins
    });
  } catch (error) {
    console.error('!!! Ошибка в updateProfile:', error);
    res.status(500).json({ message: 'Ошибка на сервере' });
  }
};