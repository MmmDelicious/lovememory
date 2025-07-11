const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  if (req.method === 'OPTIONS') {
    return next();
  }

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ message: 'Нет авторизации: отсутствует заголовок' });
    }

    const token = authHeader.split(' ')[1]; // "Bearer TOKEN"
    if (!token) {
      return res.status(401).json({ message: 'Нет авторизации: токен не найден' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Вот оно, финальное исправление!
    // Мы создаем объект req.user в формате, который ожидают контроллеры.
    req.user = { id: decoded.userId, email: decoded.email };
    
    next();
  } catch (e) {
    res.status(401).json({ message: 'Нет авторизации: невалидный токен' });
  }
};