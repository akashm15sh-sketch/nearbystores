const express = require('express');
const router = express.Router();
const supportController = require('../controllers/support.controller');
const { protect, adminOnly } = require('../middleware/auth.middleware');

// Customer/Partner routes
router.post('/', protect, supportController.createMessage);

// Admin-only routes
router.get('/admin', protect, adminOnly, supportController.getAllMessages);
router.get('/admin/count', protect, adminOnly, supportController.getOpenCount);
router.patch('/admin/:id', protect, adminOnly, supportController.resolveMessage);

module.exports = router;
