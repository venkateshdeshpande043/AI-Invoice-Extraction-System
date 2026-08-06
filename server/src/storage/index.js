const env = require('../config/env');
const LocalStorageDriver = require('./LocalStorageDriver');
const GcsStorageDriver = require('./GcsStorageDriver');

function getStorageDriver() {
  const driverName = env.STORAGE_DRIVER || 'local';

  switch (driverName) {
    case 'local':
      return new LocalStorageDriver();
    case 'gcs':
      return new GcsStorageDriver();
    default:
      throw new Error(`Unknown storage driver: ${driverName}. Use 'local' or 'gcs'.`);
  }
}

const storageDriver = getStorageDriver();

module.exports = storageDriver;
