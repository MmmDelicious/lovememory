const jwt = require('jsonwebtoken');
const { User } = require('../models');

class AuthService {
  async register(userData) {
    const { email, password, first_name, gender, age, city } = userData;

    if (!email || !password) {
      const error = new Error('Email и пароль обязательны.');
      error.statusCode = 400;
      throw error;
    }
    
    // For regular registration, all fields are required
    if (!gender || !age || !city) {
      const error = new Error('Все поля обязательны для регистрации.');
      error.statusCode = 400;
      throw error;
    }
    
    if (password.length < 6) {
      const error = new Error('Пароль должен быть не менее 6 символов.');
      error.statusCode = 400;
      throw error;
    }

    if (!['male', 'female', 'other'].includes(gender)) {
      const error = new Error('Недопустимое значение пола.');
      error.statusCode = 400;
      throw error;
    }

    const ageNum = parseInt(age, 10);
    if (isNaN(ageNum) || ageNum < 18 || ageNum > 99) {
      const error = new Error('Возраст должен быть от 18 до 99 лет.');
      error.statusCode = 400;
      throw error;
    }

    if (city.length > 100) {
      const error = new Error('Название города слишком длинное.');
      error.statusCode = 400;
      throw error;
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      const error = new Error('Пользователь с таким email уже существует.');
      error.statusCode = 400;
      throw error;
    }
    
    const user = await User.create({
      email,
      password_hash: password,
      first_name,
      display_name: first_name, // По умолчанию display_name = first_name
      locale: 'ru', // По умолчанию русская локаль
      gender,
      age: ageNum,
      city,
    });

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
        display_name: user.display_name || user.first_name, // Приоритет display_name
        locale: user.locale || 'ru',
        gender: user.gender,
        age: user.age,
        city: user.city,
        coins: user.coins,
        role: user.role,
      }
    };
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
        display_name: user.display_name || user.first_name, // Приоритет display_name
        locale: user.locale || 'ru',
        gender: user.gender,
        age: user.age,
        city: user.city,
        coins: user.coins,
        role: user.role,
      }
    };
  }
}

module.exports = new AuthService();