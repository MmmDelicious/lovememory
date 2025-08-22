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
    if (!decoded.userId) {
      console.error('JWT token missing userId:', decoded);
      return res.status(401).json({ message: 'Нет авторизации: невалидный токен - отсутствует userId' });
    }
    req.user = { 
      id: decoded.userId, 
      email: decoded.email,
      role: decoded.role || 'user' // Добавляем роль с fallback
    };
    console.log('Auth middleware: User authenticated:', { id: req.user.id, email: req.user.email });
    next();
  } catch (e) {
    res.status(401).json({ message: 'Нет авторизации: невалидный токен' });
  }
};
