const express = require('express');
const aiController = require('../controllers/aiController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authMiddleware);

router.post('/ask', aiController.ask);
router.get('/suggestions', aiController.suggestions);

module.exports = router;
