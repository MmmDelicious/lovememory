// Временная замена express-validator (ТРЕБУЕТСЯ УСТАНОВКА)
// const { body, param, query, validationResult } = require('express-validator');

// Временная заглушка для обработки результатов валидации
const handleValidationErrors = (req, res, next) => {
  // TODO: Установить express-validator и восстановить валидацию
  console.warn('WARNING: express-validator не установлен, валидация отключена');
  next();
};

// Временная заглушка для валидации регистрации
const validateRegistration = [
  handleValidationErrors
];

// Временные заглушки для валидации (требуется express-validator)
const validateLogin = [handleValidationErrors];
const validateEvent = [handleValidationErrors];
const validateGameRoom = [handleValidationErrors];
const validateAIChat = [handleValidationErrors];
const validateUUID = (paramName) => [handleValidationErrors];
const validateSearch = [handleValidationErrors];

// Санитизация HTML для предотвращения XSS
const sanitizeHTML = (text) => {
  if (typeof text !== 'string') return text;
  return text
    .replace(/[<>]/g, '') // Удаляем < и >
    .replace(/javascript:/gi, '') // Удаляем javascript: схемы
    .replace(/on\w+=/gi, '') // Удаляем event handlers
    .trim();
};

module.exports = {
  validateRegistration,
  validateLogin,
  validateEvent,
  validateGameRoom,
  validateAIChat,
  validateUUID,
  validateSearch,
  handleValidationErrors,
  sanitizeHTML
};
