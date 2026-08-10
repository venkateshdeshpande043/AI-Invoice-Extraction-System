const express = require('express');
const invoiceController = require('../controllers/invoiceController');
const authMiddleware = require('../middleware/authMiddleware');
const { upload: uploadMiddleware, handleMulterError } = require('../middleware/uploadMiddleware');
const validateMiddleware = require('../middleware/validateMiddleware');
const {
  listInvoicesValidator,
  generateInvoiceValidator,
} = require('../validators/invoiceValidators');

const router = express.Router();

router.use(authMiddleware);

router.post('/upload', uploadMiddleware.single('file'), handleMulterError, invoiceController.upload);
router.get('/', listInvoicesValidator, validateMiddleware, invoiceController.list);
// Bulk export must be registered before the /:id routes so /export is not captured as an id.
router.get('/export', listInvoicesValidator, validateMiddleware, invoiceController.exportMany);
// Phase F — invoice generation. /generate/next must precede /:id.
router.post('/generate', generateInvoiceValidator, validateMiddleware, invoiceController.generateInvoice);
router.get('/generate/next', invoiceController.getNextInvoiceNumber);
router.get('/:id', invoiceController.getById);
router.get('/:id/pdf', invoiceController.downloadPdf);
router.patch('/:id/payment', invoiceController.recordPayment);
router.delete('/:id', invoiceController.deleteInvoice);
router.get('/:id/export', invoiceController.exportInvoice);

module.exports = router;
