const storageDriver = require('../storage');
const logger = require('../config/logger');

const storageService = {
  async saveFile(filename, buffer, mimetype) {
    logger.info(`Saving file: ${filename} (${mimetype})`);
    return storageDriver.saveFile(filename, buffer, mimetype);
  },

  async getFile(filePath) {
    return storageDriver.getFile(filePath);
  },

  async deleteFile(filePath) {
    logger.info(`Deleting file: ${filePath}`);
    return storageDriver.deleteFile(filePath);
  },

  getUrl(filePath) {
    return storageDriver.getUrl(filePath);
  },
};

module.exports = storageService;
