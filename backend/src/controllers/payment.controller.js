const Payment = require('../models/Payment');
const Order = require('../models/Order');
const Store = require('../models/Store');
const razorpayService = require('../services/razorpay.service');

// Create Razorpay order
exports.createRazorpayOrder = async (req, res) => {
    try {
        const { orderId } = req.body;

        // Find the order
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Check if order belongs to user
        if (order.customer.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        // Check if payment already exists
        if (order.payment) {
            const existingPayment = await Payment.findById(order.payment);
            if (existingPayment && existingPayment.status === 'completed') {
                return res.status(400).json({ message: 'Order already paid' });
            }
        }

        // Create Razorpay order
        const razorpayOrder = await razorpayService.createOrder({
            amount: order.totalAmount,
            currency: 'INR',
            receipt: order.orderToken,
            notes: {
                orderId: order._id.toString(),
                customerId: req.user.id
            }
        });

        if (!razorpayOrder.success) {
            return res.status(500).json({
                message: 'Failed to create Razorpay order',
                error: razorpayOrder.error
            });
        }

        // Create payment record
        const payment = await Payment.create({
            order: order._id,
            amount: order.totalAmount,
            method: 'razorpay',
            status: 'pending',
            razorpayOrderId: razorpayOrder.order.id
        });

        // Update order with payment reference
        order.payment = payment._id;
        order.paymentMethod = 'razorpay';
        await order.save();

        res.json({
            success: true,
            orderId: razorpayOrder.order.id,
            amount: razorpayOrder.order.amount,
            currency: razorpayOrder.order.currency,
            keyId: razorpayService.getKeyId(),
            orderToken: order.orderToken
        });
    } catch (error) {
        console.error('Create Razorpay order error:', error);
        res.status(500).json({ message: 'Failed to create payment order', error: error.message });
    }
};

// Verify Razorpay payment
exports.verifyRazorpayPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;

        // Verify signature
        const isValid = razorpayService.verifyPaymentSignature({
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature
        });

        if (!isValid) {
            return res.status(400).json({
                success: false,
                message: 'Invalid payment signature'
            });
        }

        // Find payment by Razorpay order ID
        const payment = await Payment.findOne({ razorpayOrderId: razorpay_order_id });
        if (!payment) {
            return res.status(404).json({ message: 'Payment not found' });
        }

        // Update payment status
        payment.status = 'completed';
        payment.razorpayPaymentId = razorpay_payment_id;
        payment.razorpaySignature = razorpay_signature;
        await payment.save();

        // Update order status
        const order = await Order.findById(payment.order);
        if (order) {
            order.paymentStatus = 'paid';
            order.status = 'confirmed';
            await order.save();
        }

        res.json({
            success: true,
            message: 'Payment verified successfully',
            orderToken: order.orderToken,
            paymentId: razorpay_payment_id
        });
    } catch (error) {
        console.error('Verify payment error:', error);
        res.status(500).json({ message: 'Payment verification failed', error: error.message });
    }
};

// Confirm QR payment
exports.confirmQRPayment = async (req, res) => {
    try {
        const { orderId, transactionId, screenshot } = req.body;

        // Find the order
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Check if order belongs to user
        if (order.customer.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        // Create or update payment record
        let payment;
        if (order.payment) {
            payment = await Payment.findById(order.payment);
            payment.qrTransactionId = transactionId;
            payment.qrScreenshot = screenshot;
            payment.status = 'pending'; // Pending verification
            await payment.save();
        } else {
            payment = await Payment.create({
                order: order._id,
                amount: order.totalAmount,
                method: 'qr',
                status: 'pending',
                qrTransactionId: transactionId,
                qrScreenshot: screenshot,
                qrVerified: false
            });

            order.payment = payment._id;
            order.paymentMethod = 'qr';
        }

        // Update order
        order.paymentStatus = 'pending';
        order.status = 'pending';
        await order.save();

        res.json({
            success: true,
            message: 'Payment confirmation submitted. Awaiting verification.',
            orderToken: order.orderToken,
            paymentId: payment._id
        });
    } catch (error) {
        console.error('QR payment confirmation error:', error);
        res.status(500).json({ message: 'Failed to confirm payment', error: error.message });
    }
};

// Get store QR code
exports.getStoreQR = async (req, res) => {
    try {
        const { storeId } = req.params;

        const store = await Store.findById(storeId);
        if (!store) {
            return res.status(404).json({ message: 'Store not found' });
        }

        if (!store.paymentMethods || !store.paymentMethods.upiId) {
            return res.status(404).json({ message: 'QR payment not available for this store' });
        }

        res.json({
            success: true,
            upiId: store.paymentMethods.upiId,
            qrCodeUrl: store.paymentMethods.qrCodeUrl,
            storeName: store.name
        });
    } catch (error) {
        console.error('Get store QR error:', error);
        res.status(500).json({ message: 'Failed to get QR code', error: error.message });
    }
};

// Verify QR payment (Admin/Store owner)
exports.verifyQRPayment = async (req, res) => {
    try {
        const { paymentId } = req.params;
        const { verified, reason } = req.body;

        const payment = await Payment.findById(paymentId).populate('order');
        if (!payment) {
            return res.status(404).json({ message: 'Payment not found' });
        }

        // Check if user is admin or store owner
        const order = payment.order;
        const store = await Store.findById(order.store);

        if (req.user.role !== 'admin' && store.owner.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        // Update payment
        if (verified) {
            payment.status = 'completed';
            payment.qrVerified = true;
            order.paymentStatus = 'paid';
            order.status = 'confirmed';
        } else {
            payment.status = 'failed';
            payment.failureReason = reason || 'Payment verification failed';
            order.paymentStatus = 'failed';
            order.status = 'cancelled';
            order.cancelReason = reason || 'Payment verification failed';
        }

        await payment.save();
        await order.save();

        res.json({
            success: true,
            message: verified ? 'Payment verified successfully' : 'Payment rejected',
            payment
        });
    } catch (error) {
        console.error('Verify QR payment error:', error);
        res.status(500).json({ message: 'Failed to verify payment', error: error.message });
    }
};

// Get payment details
exports.getPaymentDetails = async (req, res) => {
    try {
        const { paymentId } = req.params;

        const payment = await Payment.findById(paymentId).populate('order');
        if (!payment) {
            return res.status(404).json({ message: 'Payment not found' });
        }

        // Check authorization
        if (payment.order.customer.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        res.json({
            success: true,
            payment
        });
    } catch (error) {
        console.error('Get payment details error:', error);
        res.status(500).json({ message: 'Failed to get payment details', error: error.message });
    }
};
