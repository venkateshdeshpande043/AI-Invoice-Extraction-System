const { param, query } = require('express-validator');

const vendorListValidator = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('search').optional().trim().escape(),
  query('sortBy').optional().isIn(['spend', 'name', 'count', 'recent']).withMessage('Invalid sort field'),
  query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc'),
];

const vendorDetailValidator = [
  param('name').trim().notEmpty().withMessage('Vendor name is required'),
];

module.exports = { vendorListValidator, vendorDetailValidator };
