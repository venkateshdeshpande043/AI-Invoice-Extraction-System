const express = require('express');
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
const validateMiddleware = require('../middleware/validateMiddleware');
const { registerValidator, loginValidator } = require('../validators/authValidators');

const router = express.Router();

router.post('/register', registerValidator, validateMiddleware, authController.register);
router.post('/login', loginValidator, validateMiddleware, authController.login);
router.get('/me', authMiddleware, authController.getMe);

module.exports = router;
