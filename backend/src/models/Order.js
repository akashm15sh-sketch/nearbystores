const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    store: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Store',
        required: true,
        index: true
    },
    items: [{
        product: {
            type: String,
            required: true
        },
        productName: {
            type: String,
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            min: 1
        },
        price: {
            type: Number,
            required: true
        },
        subtotal: {
            type: Number,
            required: true
        }
    }],
    orderType: {
        type: String,
        enum: ['delivery', 'pickup'],
        required: true
    },
    deliveryAddress: {
        type: String,
        required: function () {
            return this.orderType === 'delivery';
        }
    },
    deliveryLocation: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number] // [longitude, latitude]
        }
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'completed', 'cancelled'],
        default: 'pending',
        index: true
    },
    totalAmount: {
        type: Number,
        // Not required because it's auto-calculated in pre-save hook
    },
    paymentMethod: {
        type: String,
        enum: ['cash', 'razorpay', 'qr'],
        default: 'cash'
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'failed'],
        default: 'pending'
    },
    notes: String,
    estimatedDeliveryTime: Date,
    actualDeliveryTime: Date,
    cancelReason: String,
    payment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Payment'
    },
    orderToken: {
        type: String,
        unique: true,
        index: true
    },
    rating: {
        type: Number,
        min: 1,
        max: 5
    },
    review: String
}, {
    timestamps: true
});

// Indexes for efficient querying
orderSchema.index({ customer: 1, createdAt: -1 });
orderSchema.index({ store: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ createdAt: -1 });

// Generate unique order token
function generateOrderToken() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let token = 'ORD-';
    for (let i = 0; i < 6; i++) {
        token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
}

// Generate order token before saving
orderSchema.pre('save', async function () {
    // Calculate total amount FIRST (before validation runs)
    if (this.items && this.items.length > 0) {
        this.totalAmount = this.items.reduce((total, item) => total + item.subtotal, 0);
    }

    // Then generate token for new orders
    if (this.isNew && !this.orderToken) {
        let token;
        let isUnique = false;

        // Keep generating until we get a unique token
        while (!isUnique) {
            token = generateOrderToken();
            const existingOrder = await this.constructor.findOne({ orderToken: token });
            if (!existingOrder) {
                isUnique = true;
            }
        }

        this.orderToken = token;
    }
});


module.exports = mongoose.model('Order', orderSchema);
