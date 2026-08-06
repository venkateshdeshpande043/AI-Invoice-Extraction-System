const { v4: uuidv4 } = require('uuid');
const path = require('path');

function generateFilename(originalName) {
  const ext = path.extname(originalName);
  return `${uuidv4()}${ext}`;
}

function getFileExtension(mimetype) {
  const map = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'application/pdf': '.pdf',
  };
  return map[mimetype] || '.bin';
}

function sanitizeFileName(name) {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_');
}

function parsePagination(query) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

function buildSortQuery(sortBy, sortOrder) {
  const allowedFields = ['createdAt', 'invoiceDate', 'totalAmount', 'vendorName', 'invoiceNumber'];
  const field = allowedFields.includes(sortBy) ? sortBy : 'createdAt';
  const order = sortOrder === 'asc' ? 1 : -1;
  return { [field]: order };
}

module.exports = {
  generateFilename,
  getFileExtension,
  sanitizeFileName,
  parsePagination,
  buildSortQuery,
};
