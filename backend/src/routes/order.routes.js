const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const { protect, adminOnly } = require('../middleware/auth.middleware');

// Customer routes
router.post('/', protect, orderController.createOrder);
router.get('/my-orders', protect, orderController.getCustomerOrders);
router.patch('/:orderId/cancel', protect, orderController.cancelOrder);

// Store owner routes (no adminOnly — ownership verified in controller)
router.get('/store/:storeId', protect, orderController.getStoreOrders);
router.patch('/:orderId/partner-status', protect, orderController.updateOrderStatusPartner);

// Admin-only routes
router.patch('/:orderId/status', protect, adminOnly, orderController.updateOrderStatus);
router.get('/store/:storeId/analytics', protect, adminOnly, orderController.getStoreAnalytics);

module.exports = router;
