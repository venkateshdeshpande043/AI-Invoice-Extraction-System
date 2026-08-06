class GcsStorageDriver {
  async saveFile(_filename, _buffer, _mimetype) {
    throw new Error(
      'GCS storage not configured. Set GOOGLE_APPLICATION_CREDENTIALS and GCS_BUCKET environment variables, then set STORAGE_DRIVER=gcs.'
    );
  }

  async getFile(_filePath) {
    throw new Error(
      'GCS storage not configured. Set GOOGLE_APPLICATION_CREDENTIALS and GCS_BUCKET environment variables, then set STORAGE_DRIVER=gcs.'
    );
  }

  async deleteFile(_filePath) {
    throw new Error(
      'GCS storage not configured. Set GOOGLE_APPLICATION_CREDENTIALS and GCS_BUCKET environment variables, then set STORAGE_DRIVER=gcs.'
    );
  }

  getUrl(_filePath) {
    throw new Error(
      'GCS storage not configured. Set GOOGLE_APPLICATION_CREDENTIALS and GCS_BUCKET environment variables, then set STORAGE_DRIVER=gcs.'
    );
  }
}

module.exports = GcsStorageDriver;
