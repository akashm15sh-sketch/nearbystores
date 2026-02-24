const mongoose = require('mongoose');

const supportMessageSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    senderRole: {
        type: String,
        enum: ['customer', 'store_owner', 'admin'],
        required: true
    },
    senderName: {
        type: String,
        required: true
    },
    senderEmail: String,
    senderPhone: String,
    message: {
        type: String,
        required: true,
        maxlength: 1000
    },
    contactPreference: {
        type: String,
        enum: ['call', 'text', 'email'],
        default: 'text'
    },
    status: {
        type: String,
        enum: ['open', 'in_progress', 'resolved'],
        default: 'open',
        index: true
    },
    adminReply: String,
    adminNotes: String
}, {
    timestamps: true
});

supportMessageSchema.index({ createdAt: -1 });
supportMessageSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('SupportMessage', supportMessageSchema);
