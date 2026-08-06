const express = require('express');
const invoiceController = require('../controllers/invoiceController');
const authMiddleware = require('../middleware/authMiddleware');
const { upload: uploadMiddleware, handleMulterError } = require('../middleware/uploadMiddleware');
const validateMiddleware = require('../middleware/validateMiddleware');
const { listInvoicesValidator } = require('../validators/invoiceValidators');

const router = express.Router();

router.use(authMiddleware);

router.post('/upload', uploadMiddleware.single('file'), handleMulterError, invoiceController.upload);
router.get('/', listInvoicesValidator, validateMiddleware, invoiceController.list);
router.get('/:id', invoiceController.getById);
router.delete('/:id', invoiceController.deleteInvoice);
router.get('/:id/export', invoiceController.exportInvoice);

module.exports = router;
