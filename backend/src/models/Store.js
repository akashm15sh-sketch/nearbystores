const mongoose = require('mongoose');

const storeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    category: {
        type: String,
        enum: ['food', 'grocery', 'bakery', 'restaurant', 'pharmacy', 'electronics', 'clothing', 'beauty', 'sports', 'books', 'pets', 'hardware', 'home_decor', 'general', 'other'],
        required: true,
        index: true
    },
    description: {
        type: String,
        trim: true
    },
    images: [{
        type: String // URLs to images
    }],
    icon: {
        type: String, // URL to custom store icon
        default: null
    },
    approvalStatus: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending',
        index: true
    },
    rejectionReason: {
        type: String
    },
    verificationDocuments: [{
        type: String // URLs to verification documents
    }],
    location: {
        type: {
            type: String,
            enum: ['Point'],
            required: true,
            default: 'Point'
        },
        coordinates: {
            type: [Number], // [longitude, latitude]
            required: true
        },
        address: {
            type: String,
            required: true
        }
    },
    schedule: {
        monday: {
            open: { type: String, default: '09:00' },
            close: { type: String, default: '21:00' },
            isOpen: { type: Boolean, default: true }
        },
        tuesday: {
            open: { type: String, default: '09:00' },
            close: { type: String, default: '21:00' },
            isOpen: { type: Boolean, default: true }
        },
        wednesday: {
            open: { type: String, default: '09:00' },
            close: { type: String, default: '21:00' },
            isOpen: { type: Boolean, default: true }
        },
        thursday: {
            open: { type: String, default: '09:00' },
            close: { type: String, default: '21:00' },
            isOpen: { type: Boolean, default: true }
        },
        friday: {
            open: { type: String, default: '09:00' },
            close: { type: String, default: '21:00' },
            isOpen: { type: Boolean, default: true }
        },
        saturday: {
            open: { type: String, default: '09:00' },
            close: { type: String, default: '21:00' },
            isOpen: { type: Boolean, default: true }
        },
        sunday: {
            open: { type: String, default: '10:00' },
            close: { type: String, default: '20:00' },
            isOpen: { type: Boolean, default: true }
        }
    },
    currentStatus: {
        type: String,
        enum: ['open', 'closed', 'busy'],
        default: 'closed'
    },
    products: [{
        name: {
            type: String,
            required: true
        },
        price: {
            type: Number,
            required: true
        },
        image: String,
        inStock: {
            type: Boolean,
            default: true
        }
    }],
    contact: {
        phone: String,
        email: String,
        whatsapp: String
    },
    rating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
    },
    paymentMethods: {
        upiId: {
            type: String,
            trim: true
        },
        qrCodeUrl: {
            type: String
        },
        razorpayEnabled: {
            type: Boolean,
            default: false
        },
        cashOnDelivery: {
            type: Boolean,
            default: true
        }
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    verifiedAt: {
        type: Date
    },
    approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

// Create geospatial index for location-based queries
storeSchema.index({ location: '2dsphere' });

// Method to check if store is currently open
storeSchema.methods.isCurrentlyOpen = function () {
    const now = new Date();
    const day = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][now.getDay()];
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const daySchedule = this.schedule[day];
    if (!daySchedule.isOpen) return false;

    return currentTime >= daySchedule.open && currentTime <= daySchedule.close;
};

module.exports = mongoose.model('Store', storeSchema);
