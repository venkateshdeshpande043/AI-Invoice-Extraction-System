const { validationResult } = require('express-validator');
const AppError = require('../utils/AppError');

function validateMiddleware(req, _res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((err) => ({
      field: err.path,
      message: err.msg,
    }));
    const message = errorMessages.map((e) => `${e.field}: ${e.message}`).join(', ');
    const error = new AppError(message, 400);
    error.errors = errorMessages;
    return next(error);
  }
  next();
}

module.exports = validateMiddleware;
