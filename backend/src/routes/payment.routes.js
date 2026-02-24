const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');
const { protect, adminOnly } = require('../middleware/auth.middleware');

// Razorpay routes
router.post('/razorpay/create', protect, paymentController.createRazorpayOrder);
router.post('/razorpay/verify', protect, paymentController.verifyRazorpayPayment);

// QR payment routes
router.post('/qr/confirm', protect, paymentController.confirmQRPayment);
router.patch('/qr/:paymentId/verify', protect, paymentController.verifyQRPayment);

// Store QR code
router.get('/store/:storeId/qr', paymentController.getStoreQR);

// Payment details
router.get('/:paymentId', protect, paymentController.getPaymentDetails);

module.exports = router;
