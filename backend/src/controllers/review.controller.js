const Review = require('../models/Review');
const Store = require('../models/Store');

// Create or update a review
exports.createReview = async (req, res) => {
    try {
        const { storeId, rating, comment } = req.body;
        const customerId = req.user.id;

        if (!storeId || !rating) {
            return res.status(400).json({ message: 'Store ID and rating are required' });
        }

        if (rating < 1 || rating > 5) {
            return res.status(400).json({ message: 'Rating must be between 1 and 5' });
        }

        // Check if store exists
        const store = await Store.findById(storeId);
        if (!store) {
            return res.status(404).json({ message: 'Store not found' });
        }

        // Upsert — create or update existing review
        const review = await Review.findOneAndUpdate(
            { store: storeId, customer: customerId },
            { rating, comment: comment || '' },
            { upsert: true, new: true, runValidators: true }
        );

        // Recalculate store average rating
        const stats = await Review.aggregate([
            { $match: { store: store._id } },
            { $group: { _id: null, avgRating: { $avg: '$rating' }, count: { $sum: 1 } } }
        ]);

        if (stats.length > 0) {
            store.rating = Math.round(stats[0].avgRating * 10) / 10;
            await store.save();
        }

        const populated = await Review.findById(review._id).populate('customer', 'username');

        res.status(201).json({
            message: 'Review submitted',
            review: populated,
            storeRating: store.rating
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'You have already reviewed this store' });
        }
        console.error('Create review error:', error);
        res.status(500).json({ message: 'Failed to submit review', error: error.message });
    }
};

// Get reviews for a store
exports.getStoreReviews = async (req, res) => {
    try {
        const { storeId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;

        const reviews = await Review.find({ store: storeId })
            .populate('customer', 'username')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        const total = await Review.countDocuments({ store: storeId });

        // Rating distribution
        const distribution = await Review.aggregate([
            { $match: { store: require('mongoose').Types.ObjectId.createFromHexString(storeId) } },
            { $group: { _id: '$rating', count: { $sum: 1 } } },
            { $sort: { _id: -1 } }
        ]);

        const ratingDist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
        distribution.forEach(d => { ratingDist[d._id] = d.count; });

        res.json({
            reviews,
            total,
            page,
            pages: Math.ceil(total / limit),
            distribution: ratingDist
        });
    } catch (error) {
        console.error('Get reviews error:', error);
        res.status(500).json({ message: 'Failed to get reviews', error: error.message });
    }
};
