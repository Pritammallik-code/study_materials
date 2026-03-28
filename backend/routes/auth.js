const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/authController');
const { validate } = require('../middleware/validation');
const { authLimiter } = require('../middleware/rateLimiter');

// Apply strict rate limiting to authentication endpoints
router.post('/register', authLimiter, validate('register'), register);
router.post('/login', authLimiter, validate('login'), login);

module.exports = router;
