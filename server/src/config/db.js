const mongoose = require('mongoose');
const logger = require('./logger');

let isConnected = false;

async function connectDB() {
  const env = require('./env');
  if (!env.MONGODB_URI) {
    logger.warn('MONGODB_URI not set. Database operations will be unavailable.');
    return false;
  }
  try {
    const conn = await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 30000,
      connectTimeoutMS: 30000,
    });
    isConnected = true;
    logger.info(`MongoDB connected: ${conn.connection.host}`);
    mongoose.connection.on('disconnected', () => {
      isConnected = false;
      logger.warn('MongoDB disconnected');
    });
    mongoose.connection.on('reconnected', () => {
      isConnected = true;
      logger.info('MongoDB reconnected');
    });
    return true;
  } catch (error) {
    logger.error(`MongoDB connection error: ${error.message || error}`);
    return false;
  }
}

function getConnectionStatus() {
  return isConnected;
}

module.exports = connectDB;
module.exports.getConnectionStatus = getConnectionStatus;
