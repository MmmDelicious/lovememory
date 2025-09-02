const jwt = require('jsonwebtoken');
const { User } = require('../models');

class AuthService {
  async register(userData) {
    const { email, password, first_name, gender, age, city } = userData;
    // Вся валидация была удалена, так как она обрабатывается
    // middleware на уровне маршрутизации и валидацией модели Sequelize.

    // Проверка на существующего пользователя будет обработана
    // ограничением уникальности в базе данных, и ошибка будет перехвачена в контроллере.
    const user = await User.create({
      email,
      password_hash: password, // Будет автоматически захеширован в beforeCreate хуке
      first_name,
      display_name: first_name,
      locale: 'ru',
      gender,
      age: parseInt(age, 10),
      city,
    });

    // Сервис больше не генерирует токен, это ответственность контроллера.
    // Возвращаем только созданного пользователя.
    return { user };
  }

  async login(credentials) {
    const { email, password } = credentials;
    const user = await User.findOne({ where: { email } });

    // Объединяем проверки, чтобы избежать тайминг-атак
    if (!user || !(await user.validPassword(password))) {
      const error = new Error('Неверный email или пароль');
      error.statusCode = 401;
      throw error;
    }

    // Сервис больше не генерирует токен, это ответственность контроллера.
    // Возвращаем только найденного пользователя.
    return { user };
  }
}

module.exports = new AuthService();