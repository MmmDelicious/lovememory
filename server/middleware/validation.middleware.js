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
    .replace(/[<>]/g, '') // Remove < and >
    .replace(/javascript:/gi, '') // Remove javascript: schemes
    .replace(/on\w+=/gi, '') // Remove event handlers
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

