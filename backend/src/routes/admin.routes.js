const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');

// Admin registration routes (public)
router.post('/send-otp', adminController.sendOTP);
router.post('/register', adminController.register);

module.exports = router;
