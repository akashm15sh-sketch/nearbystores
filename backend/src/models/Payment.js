const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    method: {
        type: String,
        enum: ['qr', 'razorpay', 'cash'],
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'refunded'],
        default: 'pending',
        index: true
    },
    // Razorpay specific fields
    razorpayOrderId: {
        type: String,
        sparse: true,
        index: true
    },
    razorpayPaymentId: {
        type: String,
        sparse: true
    },
    razorpaySignature: {
        type: String
    },
    // QR payment specific fields
    qrTransactionId: {
        type: String,
        sparse: true
    },
    qrScreenshot: {
        type: String // URL to uploaded screenshot
    },
    qrVerified: {
        type: Boolean,
        default: false
    },
    // General metadata
    metadata: {
        type: mongoose.Schema.Types.Mixed
    },
    failureReason: {
        type: String
    },
    refundId: {
        type: String
    },
    refundedAt: {
        type: Date
    }
}, {
    timestamps: true
});

// Index for efficient queries
paymentSchema.index({ order: 1, status: 1 });
paymentSchema.index({ razorpayOrderId: 1 });
paymentSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Payment', paymentSchema);
