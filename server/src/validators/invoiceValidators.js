const { query } = require('express-validator');

const listInvoicesValidator = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('search').optional().trim().escape(),
  query('vendor').optional().trim().escape(),
  query('status').optional().isIn(['pending', 'processed', 'failed']).withMessage('Invalid status filter'),
  query('dateFrom').optional().isISO8601().withMessage('Invalid date format for dateFrom'),
  query('dateTo').optional().isISO8601().withMessage('Invalid date format for dateTo'),
  query('sortBy')
    .optional()
    .isIn(['createdAt', 'invoiceDate', 'totalAmount', 'vendorName', 'invoiceNumber'])
    .withMessage('Invalid sort field'),
  query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc'),
];

module.exports = { listInvoicesValidator };
