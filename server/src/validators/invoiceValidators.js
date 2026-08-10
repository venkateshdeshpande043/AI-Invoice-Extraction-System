const { query, body } = require('express-validator');

const listInvoicesValidator = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('search').optional().trim().escape(),
  query('vendor').optional().trim().escape(),
  query('status').optional().isIn(['pending', 'processed', 'failed']).withMessage('Invalid status filter'),
  query('paymentStatus').optional().isIn(['unpaid', 'partial', 'paid', 'overdue']).withMessage('Invalid payment status filter'),
  query('amountFrom').optional().isFloat({ min: 0 }).withMessage('amountFrom must be a non-negative number'),
  query('amountTo').optional().isFloat({ min: 0 }).withMessage('amountTo must be a non-negative number'),
  query('dateFrom').optional().isISO8601().withMessage('Invalid date format for dateFrom'),
  query('dateTo').optional().isISO8601().withMessage('Invalid date format for dateTo'),
  query('sortBy')
    .optional()
    .isIn(['createdAt', 'invoiceDate', 'totalAmount', 'vendorName', 'invoiceNumber'])
    .withMessage('Invalid sort field'),
  query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc'),
];

const generateInvoiceValidator = [
  body('customerName').optional().trim().isLength({ min: 1, max: 200 }).withMessage('Customer name is too long'),
  body('customerGstin').optional().trim().isLength({ max: 40 }),
  body('invoiceNumber').optional().trim().isLength({ max: 60 }),
  body('poNumber').optional().trim().isLength({ max: 60 }),
  body('invoiceDate').optional().isISO8601().withMessage('Invoice date must be a valid date'),
  body('dueDate').optional().isISO8601().withMessage('Due date must be a valid date'),
  body('taxRate').optional({ values: 'falsy' }).isFloat({ min: 0, max: 100 }).withMessage('Tax rate must be between 0 and 100'),
  body('taxAmount').optional({ values: 'falsy' }).isFloat({ min: 0 }).withMessage('Tax amount must be non-negative'),
  body('discount').optional({ values: 'falsy' }).isFloat({ min: 0 }).withMessage('Discount must be non-negative'),
  body('currency').optional().trim().isLength({ min: 3, max: 8 }).withMessage('Currency must be a 3-letter code'),
  body('template').optional().isIn(['classic', 'minimal']).withMessage('Unknown template'),
  body('notes').optional().trim().isLength({ max: 1000 }),
  body('paymentTerms').optional().trim().isLength({ max: 300 }),
  body('seller.name').optional().trim().isLength({ max: 200 }),
  body('seller.address').optional().trim().isLength({ max: 500 }),
  body('seller.phone').optional().trim().isLength({ max: 60 }),
  body('seller.email').optional().trim().isLength({ max: 120 }).isEmail().withMessage('Seller email is invalid'),
  body('seller.gstVatNumber').optional().trim().isLength({ max: 40 }),
  body('lineItems').optional().isArray({ max: 200 }).withMessage('Too many line items'),
  body('lineItems.*.description').optional().trim().isLength({ max: 300 }),
  body('lineItems.*.quantity').optional({ values: 'falsy' }).isFloat({ min: 0 }).withMessage('Quantity must be non-negative'),
  body('lineItems.*.unitPrice').optional({ values: 'falsy' }).isFloat({ min: 0 }).withMessage('Unit price must be non-negative'),
  body('lineItems.*.amount').optional({ values: 'falsy' }).isFloat({ min: 0 }).withMessage('Line amount must be non-negative'),
];

module.exports = { listInvoicesValidator, generateInvoiceValidator };
