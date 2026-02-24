const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');

// Public routes
router.post('/send-otp', authController.sendOTP);
router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/check-username/:username', authController.checkUsername);

// Protected routes
router.get('/me', protect, authController.getCurrentUser);
router.put('/preferences', protect, authController.updatePreferences);

module.exports = router;
