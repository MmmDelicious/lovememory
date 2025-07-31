const jwt = require('jsonwebtoken');
const { User } = require('../models');

class AuthService {
  async register(userData) {
    const { email, password, first_name, gender, age, city } = userData;

    if (!email || !password || !gender || !age || !city) {
      const error = new Error('Все поля обязательны.');
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

    if (age < 18 || age > 99) {
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
    
    await User.create({
      email,
      password_hash: password,
      first_name,
      gender,
      age,
      city,
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
        gender: user.gender,
        age: user.age,
        city: user.city,
        coins: user.coins,
      }
    };
  }
}

module.exports = new AuthService();