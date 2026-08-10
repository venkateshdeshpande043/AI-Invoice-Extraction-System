const express = require('express');
const insightController = require('../controllers/insightController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authMiddleware);

router.get('/', insightController.getInsights);

module.exports = router;
