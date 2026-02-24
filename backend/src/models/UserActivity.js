const mongoose = require('mongoose');

const userActivitySchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    userRole: {
        type: String,
        enum: ['customer', 'store_owner', 'admin'],
        required: true
    },
    action: {
        type: String,
        required: true,
        enum: [
            'page_view', 'button_click', 'search', 'store_view',
            'product_view', 'add_to_cart', 'order_placed', 'order_cancelled',
            'login', 'logout', 'profile_update', 'support_message',
            'store_edit', 'product_update', 'order_status_update'
        ]
    },
    details: {
        page: String,           // which page
        element: String,        // what was clicked
        storeId: String,        // related store
        productName: String,    // related product
        searchQuery: String,    // search term
        orderId: String,        // related order
        metadata: mongoose.Schema.Types.Mixed  // any extra data
    },
    location: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number], // [lng, lat]
            default: [0, 0]
        }
    },
    sessionId: String,
    ip: String,
    userAgent: String
}, {
    timestamps: true
});

userActivitySchema.index({ createdAt: -1 });
userActivitySchema.index({ user: 1, createdAt: -1 });
userActivitySchema.index({ action: 1, createdAt: -1 });
userActivitySchema.index({ location: '2dsphere' });

module.exports = mongoose.model('UserActivity', userActivitySchema);
