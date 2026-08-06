const multer = require('multer');
const path = require('path');
const AppError = require('../utils/AppError');
const env = require('../config/env');

const allowedMimeTypes = ['image/jpeg', 'image/png', 'application/pdf'];

const storage = multer.diskStorage({
  destination(_req, _file, cb) {
    cb(null, env.UPLOAD_DIR);
  },
  filename(_req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

function fileFilter(_req, file, cb) {
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError('Invalid file type. Only JPG, PNG, and PDF are allowed.', 400), false);
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: env.MAX_FILE_SIZE || 10 * 1024 * 1024,
  },
});

function handleMulterError(err, _req, _res, next) {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return next(new AppError('File is too large. Maximum size is 10 MB.', 400));
    }
    return next(new AppError(`Upload error: ${err.message}`, 400));
  }
  if (err) {
    return next(err);
  }
  next();
}

module.exports = { upload, handleMulterError };
