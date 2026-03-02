const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    store: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Store',
        required: true,
        index: true
    },
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    comment: {
        type: String,
        trim: true,
        maxlength: 1000
    }
}, {
    timestamps: true
});

// One review per customer per store
reviewSchema.index({ store: 1, customer: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);
