const Razorpay = require('razorpay');
const crypto = require('crypto');

class RazorpayService {
    constructor() {
        // Initialize Razorpay instance with test credentials
        // In production, these should come from environment variables
        this.razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_key',
            key_secret: process.env.RAZORPAY_KEY_SECRET || 'rzp_test_secret'
        });
    }

    /**
     * Create a Razorpay order
     * @param {Object} orderData - Order details
     * @param {Number} orderData.amount - Amount in rupees
     * @param {String} orderData.currency - Currency code (default: INR)
     * @param {String} orderData.receipt - Order receipt/token
     * @param {Object} orderData.notes - Additional notes
     * @returns {Promise<Object>} Razorpay order object
     */
    async createOrder({ amount, currency = 'INR', receipt, notes = {} }) {
        try {
            // Razorpay expects amount in paise (smallest currency unit)
            const amountInPaise = Math.round(amount * 100);

            const options = {
                amount: amountInPaise,
                currency,
                receipt,
                notes,
                payment_capture: 1 // Auto capture payment
            };

            const order = await this.razorpay.orders.create(options);
            return {
                success: true,
                order
            };
        } catch (error) {
            console.error('Razorpay order creation error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Verify Razorpay payment signature
     * @param {Object} paymentData
     * @param {String} paymentData.razorpay_order_id
     * @param {String} paymentData.razorpay_payment_id
     * @param {String} paymentData.razorpay_signature
     * @returns {Boolean} Verification result
     */
    verifyPaymentSignature({ razorpay_order_id, razorpay_payment_id, razorpay_signature }) {
        try {
            const text = `${razorpay_order_id}|${razorpay_payment_id}`;
            const secret = process.env.RAZORPAY_KEY_SECRET || 'rzp_test_secret';

            const generated_signature = crypto
                .createHmac('sha256', secret)
                .update(text)
                .digest('hex');

            return generated_signature === razorpay_signature;
        } catch (error) {
            console.error('Signature verification error:', error);
            return false;
        }
    }

    /**
     * Fetch payment details
     * @param {String} paymentId - Razorpay payment ID
     * @returns {Promise<Object>} Payment details
     */
    async fetchPayment(paymentId) {
        try {
            const payment = await this.razorpay.payments.fetch(paymentId);
            return {
                success: true,
                payment
            };
        } catch (error) {
            console.error('Fetch payment error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Refund a payment
     * @param {String} paymentId - Razorpay payment ID
     * @param {Number} amount - Amount to refund in rupees (optional, full refund if not provided)
     * @returns {Promise<Object>} Refund details
     */
    async refundPayment(paymentId, amount = null) {
        try {
            const options = {};
            if (amount) {
                options.amount = Math.round(amount * 100); // Convert to paise
            }

            const refund = await this.razorpay.payments.refund(paymentId, options);
            return {
                success: true,
                refund
            };
        } catch (error) {
            console.error('Refund error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get Razorpay key ID for frontend
     * @returns {String} Razorpay key ID
     */
    getKeyId() {
        return process.env.RAZORPAY_KEY_ID || 'rzp_test_key';
    }
}

module.exports = new RazorpayService();
