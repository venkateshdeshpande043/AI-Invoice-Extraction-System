const fs = require('fs/promises');
const path = require('path');
const env = require('../config/env');

class LocalStorageDriver {
  async saveFile(filename, buffer, _mimetype) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const relativePath = `${year}/${month}`;
    const dirPath = path.resolve(env.UPLOAD_DIR, relativePath);

    await fs.mkdir(dirPath, { recursive: true });

    const filePath = path.join(dirPath, filename);
    await fs.writeFile(filePath, buffer);

    return {
      url: `/uploads/${relativePath}/${filename}`,
      path: `${relativePath}/${filename}`,
    };
  }

  async getFile(filePath) {
    const fullPath = path.resolve(env.UPLOAD_DIR, filePath);
    return fs.readFile(fullPath);
  }

  async deleteFile(filePath) {
    const fullPath = path.resolve(env.UPLOAD_DIR, filePath);
    try {
      await fs.unlink(fullPath);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  }

  getUrl(filePath) {
    return `/uploads/${filePath}`;
  }
}

module.exports = LocalStorageDriver;
