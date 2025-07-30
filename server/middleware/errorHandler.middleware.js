function errorHandler(err, req, res, next) {
    console.error('!!! Произошла ошибка:', err.message);
  
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Произошла непредвиденная ошибка на сервере.';
  
    res.status(statusCode).json({
      status: 'error',
      statusCode,
      message
    });
  }
  
  module.exports = errorHandler;