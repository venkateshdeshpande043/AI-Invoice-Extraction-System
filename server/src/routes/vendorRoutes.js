/**
 * Vendor routes (Phase D).
 */
const express = require('express');
const router = express.Router();
const vendorController = require('../controllers/vendorController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/', vendorController.list);
router.get('/:name', vendorController.detail);

module.exports = router;
