function errorHandler(err, req, res, next) {
    console.error('Error occurred:', err.message);
    const statusCode = err.statusCode || 500;
    const message = err.message || 'An unexpected error occurred on the server.';
    res.status(statusCode).json({
      status: 'error',
      statusCode,
      message
    });
  }
  module.exports = errorHandler;
