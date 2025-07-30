const jwt = require('jsonwebtoken');
const { User } = require('../models');

class AuthService {
  async register(userData) {
    const { email, password, first_name } = userData;

    if (!email || !password) {
      const error = new Error('Email и пароль обязательны.');
      error.statusCode = 400;
      throw error;
    }
    
    if (password.length < 6) {
      const error = new Error('Пароль должен быть не менее 6 символов.');
      error.statusCode = 400;
      throw error;
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      const error = new Error('Пользователь с таким email уже существует.');
      error.statusCode = 400;
      throw error;
    }
    
    await User.create({
      email,
      password_hash: password,
      first_name,
    });

    return { message: 'Пользователь успешно зарегистрирован.' };
  }

  async login(credentials) {
    const { email, password } = credentials;
    const user = await User.findOne({ where: { email } });

    if (!user) {
      const error = new Error('Пользователь не найден.');
      error.statusCode = 401;
      throw error;
    }

    const isMatch = await user.validPassword(password);
    if (!isMatch) {
      const error = new Error('Неверный пароль.');
      error.statusCode = 401;
      throw error;
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

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        coins: user.coins,
      }
    };
  }
}

module.exports = new AuthService();