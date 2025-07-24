const User = require('../models/User');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
  try {
    const { email, password, first_name } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email и пароль обязательны.' });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ message: 'Пароль должен быть не менее 6 символов.' });
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'Пользователь с таким email уже существует.' });
    }
    
    const newUser = await User.create({
      email,
      password_hash: password, // Хук в модели User.js автоматически захэширует это значение
      first_name,
    });

    res.status(201).json({ message: 'Пользователь успешно зарегистрирован.' });

  } catch (error) {
    console.error('!!! Ошибка в register:', error);
    res.status(500).json({ message: 'Ошибка на сервере при регистрации.' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(401).json({ message: 'Пользователь не найден.' });
    }

    const isMatch = await user.validPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Неверный пароль.' });
    }

    const payload = {
      userId: user.id,
      email: user.email,
    };

    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(200).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        coins: user.coins,
      }
    });

  } catch (error) {
    console.error('!!! Ошибка в login:', error);
    res.status(500).json({ message: 'Ошибка на сервере при входе.' });
  }
};