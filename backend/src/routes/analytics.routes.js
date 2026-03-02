const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analytics.controller');
const { protect, adminOnly } = require('../middleware/auth.middleware');

// Track activity (any authenticated user)
router.post('/track', protect, analyticsController.trackActivity);

// Admin-only analytics routes
router.get('/revenue', protect, adminOnly, analyticsController.getGlobalRevenue);
router.get('/activities', protect, adminOnly, analyticsController.getUserActivities);
router.get('/active-users', protect, adminOnly, analyticsController.getActiveUsers);
router.get('/user/:userId/behavior', protect, adminOnly, analyticsController.getUserBehaviorSummary);
router.get('/store/:storeId', protect, adminOnly, analyticsController.getStoreAnalytics);

module.exports = router;
