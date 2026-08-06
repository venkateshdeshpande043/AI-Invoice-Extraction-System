const rateLimit = require('express-rate-limit');
const AppError = require('../utils/AppError');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler(_req, _res, next) {
    next(new AppError('Too many requests. Please try again in 15 minutes.', 429));
  },
});

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler(_req, _res, next) {
    next(new AppError('Too many requests. Please try again in a minute.', 429));
  },
});

module.exports = { authLimiter, apiLimiter };
