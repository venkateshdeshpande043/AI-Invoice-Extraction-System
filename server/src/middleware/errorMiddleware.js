const logger = require('../config/logger');

function errorMiddleware(err, _req, res, _next) {
  logger.error(`${err.message}${err.stack ? '\n' + err.stack : ''}`);

  if (err.name === 'MongooseError' && err.message.includes('buffering timed out')) {
    return res.status(503).json({
      success: false,
      message: 'Database connection not ready. Please wait and try again.',
      errors: [],
    });
  }

  if (err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.errors || [],
    });
  }

  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    return res.status(400).json({
      success: false,
      message: errors.map((e) => e.message).join(', '),
      errors,
    });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid ID format',
      errors: [],
    });
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(409).json({
      success: false,
      message: `Duplicate value for ${field}. This ${field} is already in use.`,
      errors: [{ field, message: `Duplicate ${field}` }],
    });
  }

  return res.status(500).json({
    success: false,
    message: 'Internal server error',
    errors: [],
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}

module.exports = errorMiddleware;
