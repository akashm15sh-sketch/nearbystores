const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { protect, adminOnly } = require('../middleware/auth.middleware');

// Admin routes
router.get('/admin/all', protect, adminOnly, userController.getAllUsersAdmin);

module.exports = router;
