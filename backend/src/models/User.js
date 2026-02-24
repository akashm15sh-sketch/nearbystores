const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        trim: true,
        minlength: 3,
        maxlength: 30
    },
    email: {
        type: String,
        required: function () {
            return !this.phone;
        },
        lowercase: true,
        trim: true
    },
    phone: {
        type: String,
        sparse: true,
        trim: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    role: {
        type: String,
        enum: ['customer', 'admin', 'store_owner'],
        default: 'customer'
    },
    location: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number], // [longitude, latitude]
            default: [0, 0]
        }
    },
    preferences: {
        emailNotifications: {
            type: Boolean,
            default: true
        },
        whatsappNotifications: {
            type: Boolean,
            default: false
        },
        proximityAlerts: {
            type: Boolean,
            default: true
        }
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    lastNotificationSent: {
        type: Map,
        of: Date,
        default: new Map()
    }
}, {
    timestamps: true
});

// Compound unique indexes scoped by role
// Same email/username/phone can exist across different roles, but not within the same role
userSchema.index({ email: 1, role: 1 }, { unique: true, sparse: true });
userSchema.index({ username: 1, role: 1 }, { unique: true });
userSchema.index({ phone: 1, role: 1 }, { unique: true, sparse: true });

// Create geospatial index for location-based queries
userSchema.index({ location: '2dsphere' });

// Don't return password in JSON responses
userSchema.methods.toJSON = function () {
    const user = this.toObject();
    delete user.password;
    return user;
};

module.exports = mongoose.model('User', userSchema);
