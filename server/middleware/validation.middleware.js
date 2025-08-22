const handleValidationErrors = (req, res, next) => {
  next();
};
const validateRegistration = [
  handleValidationErrors
];
const validateLogin = [handleValidationErrors];
const validateEvent = [handleValidationErrors];
const validateGameRoom = [handleValidationErrors];
const validateAIChat = [handleValidationErrors];
const validateUUID = (paramName) => [handleValidationErrors];
const validateSearch = [handleValidationErrors];
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

