const path = require('path');
const dotenv = require('dotenv');

const projectRoot = path.resolve(__dirname, '../../../');
const serverRoot = path.resolve(__dirname, '../../');

dotenv.config({ path: path.join(projectRoot, '.env') });
dotenv.config({ path: path.join(projectRoot, '.env.local') });
dotenv.config({ path: path.join(serverRoot, '.env') });
dotenv.config({ path: path.join(serverRoot, '.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT, 10) || 5000,
  MONGODB_URI: process.env.MONGODB_URI,
  JWT_SECRET: process.env.JWT_SECRET || 'dev-secret-change-in-production',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  STORAGE_DRIVER: process.env.STORAGE_DRIVER || 'local',
  UPLOAD_DIR: process.env.UPLOAD_DIR || path.resolve(__dirname, '../uploads'),
  MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE, 10) || 10 * 1024 * 1024,
  LOG_LEVEL: process.env.LOG_LEVEL || 'debug',
  OCR_SERVICE_URL: process.env.OCR_SERVICE_URL || 'http://localhost:8765',
  OCR_TIMEOUT: parseInt(process.env.OCR_TIMEOUT, 10) || 60000,
};

const missing = ['MONGODB_URI'].filter((key) => !env[key]);
if (missing.length > 0) {
  const msg = `Missing required environment variables: ${missing.join(', ')}`;
  if (process.env.NODE_ENV === 'production') {
    throw new Error(msg);
  }
  console.warn(`[ENV WARNING] ${msg}. The server will start but database operations will fail.`);
}

module.exports = env;
