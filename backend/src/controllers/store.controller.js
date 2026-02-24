const Store = require('../models/Store');
const geolocationService = require('../services/geolocation.service');

// Get all stores (with optional filters)
exports.getAllStores = async (req, res) => {
    try {
        const { category, latitude, longitude, maxDistance = 10000 } = req.query;

        let query = { approvalStatus: 'approved' }; // Only show approved stores by default

        if (category && category !== 'all') {
            query.category = category;
        }

        let stores;

        // If location provided, find nearby stores
        if (latitude && longitude) {
            const nearbyStores = await geolocationService.findNearbyStores(
                parseFloat(longitude),
                parseFloat(latitude),
                parseInt(maxDistance)
            );

            // Filter by category and approval status
            stores = nearbyStores.filter(store => {
                const categoryMatch = !category || category === 'all' || store.category === category;
                const approvalMatch = store.approvalStatus === 'approved';
                return categoryMatch && approvalMatch;
            });
        } else {
            stores = await Store.find(query);
        }

        res.json({ stores, count: stores.length });
    } catch (error) {
        console.error('Get stores error:', error);
        res.status(500).json({ message: 'Failed to get stores', error: error.message });
    }
};

// Get single store
exports.getStore = async (req, res) => {
    try {
        const store = await Store.findById(req.params.id);

        if (!store) {
            return res.status(404).json({ message: 'Store not found' });
        }

        // Check if currently open
        const isOpen = store.isCurrentlyOpen();

        res.json({
            store: {
                ...store.toObject(),
                isCurrentlyOpen: isOpen
            }
        });
    } catch (error) {
        console.error('Get store error:', error);
        res.status(500).json({ message: 'Failed to get store', error: error.message });
    }
};

// Create store (admin only)
exports.createStore = async (req, res) => {
    try {
        const storeData = req.body;

        // Set owner to current user
        storeData.owner = req.user.id;

        const store = await Store.create(storeData);

        res.status(201).json({
            message: 'Store created successfully',
            store
        });
    } catch (error) {
        console.error('Create store error:', error);
        res.status(500).json({ message: 'Failed to create store', error: error.message });
    }
};

// Update store (admin only)
exports.updateStore = async (req, res) => {
    try {
        const store = await Store.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!store) {
            return res.status(404).json({ message: 'Store not found' });
        }

        res.json({
            message: 'Store updated successfully',
            store
        });
    } catch (error) {
        console.error('Update store error:', error);
        res.status(500).json({ message: 'Failed to update store', error: error.message });
    }
};

// Delete store (admin only)
exports.deleteStore = async (req, res) => {
    try {
        const store = await Store.findByIdAndDelete(req.params.id);

        if (!store) {
            return res.status(404).json({ message: 'Store not found' });
        }

        res.json({ message: 'Store deleted successfully' });
    } catch (error) {
        console.error('Delete store error:', error);
        res.status(500).json({ message: 'Failed to delete store', error: error.message });
    }
};

// Update store status (admin only)
exports.updateStoreStatus = async (req, res) => {
    try {
        const { status } = req.body;

        if (!['open', 'closed', 'busy'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const store = await Store.findByIdAndUpdate(
            req.params.id,
            { currentStatus: status },
            { new: true }
        );

        if (!store) {
            return res.status(404).json({ message: 'Store not found' });
        }

        res.json({
            message: 'Store status updated',
            store
        });
    } catch (error) {
        console.error('Update status error:', error);
        res.status(500).json({ message: 'Failed to update status', error: error.message });
    }
};

// Update user location and check proximity
exports.updateLocation = async (req, res) => {
    try {
        const { latitude, longitude } = req.body;

        if (!latitude || !longitude) {
            return res.status(400).json({ message: 'Latitude and longitude are required' });
        }

        await geolocationService.updateUserLocation(
            req.user.id,
            parseFloat(longitude),
            parseFloat(latitude)
        );

        res.json({ message: 'Location updated successfully' });
    } catch (error) {
        console.error('Update location error:', error);
        res.status(500).json({ message: 'Failed to update location', error: error.message });
    }
};

// Register new store (for store owners)
exports.registerStore = async (req, res) => {
    try {
        const storeData = req.body;

        // Set owner to current user
        storeData.owner = req.user.id;

        // Set approval status to pending
        storeData.approvalStatus = 'pending';

        const store = await Store.create(storeData);

        res.status(201).json({
            message: 'Store registration submitted successfully. Awaiting approval.',
            store
        });
    } catch (error) {
        console.error('Register store error:', error);
        res.status(500).json({ message: 'Failed to register store', error: error.message });
    }
};

// Get stores owned by current user
exports.getMyStores = async (req, res) => {
    try {
        const stores = await Store.find({ owner: req.user.id });

        res.json({ stores, count: stores.length });
    } catch (error) {
        console.error('Get my stores error:', error);
        res.status(500).json({ message: 'Failed to get stores', error: error.message });
    }
};

// Update own store
exports.updateMyStore = async (req, res) => {
    try {
        const store = await Store.findOne({
            _id: req.params.id,
            owner: req.user.id
        });

        if (!store) {
            return res.status(404).json({ message: 'Store not found or unauthorized' });
        }

        // Don't allow changing approval status
        delete req.body.approvalStatus;
        delete req.body.owner;
        delete req.body.approvedBy;

        Object.assign(store, req.body);
        await store.save();

        res.json({
            message: 'Store updated successfully',
            store
        });
    } catch (error) {
        console.error('Update my store error:', error);
        res.status(500).json({ message: 'Failed to update store', error: error.message });
    }
};

// Get all stores for admin (includes pending, rejected, etc.)
exports.getAllStoresAdmin = async (req, res) => {
    try {
        const stores = await Store.find()
            .populate('owner', 'name email username')
            .sort({ createdAt: -1 });

        res.json({ stores, count: stores.length });
    } catch (error) {
        console.error('Get all stores admin error:', error);
        res.status(500).json({ message: 'Failed to get stores', error: error.message });
    }
};

// Get all pending stores (admin only)
exports.getPendingStores = async (req, res) => {
    try {
        const stores = await Store.find({ approvalStatus: 'pending' })
            .populate('owner', 'name email username');

        res.json({ stores, count: stores.length });
    } catch (error) {
        console.error('Get pending stores error:', error);
        res.status(500).json({ message: 'Failed to get pending stores', error: error.message });
    }
};

// Approve store (admin only)
exports.approveStore = async (req, res) => {
    try {
        const store = await Store.findById(req.params.id);

        if (!store) {
            return res.status(404).json({ message: 'Store not found' });
        }

        store.approvalStatus = 'approved';
        store.isVerified = true;
        store.verifiedAt = new Date();
        store.approvedBy = req.user.id;

        await store.save();

        res.json({
            message: 'Store approved successfully',
            store
        });
    } catch (error) {
        console.error('Approve store error:', error);
        res.status(500).json({ message: 'Failed to approve store', error: error.message });
    }
};

// Reject store (admin only)
exports.rejectStore = async (req, res) => {
    try {
        const { reason } = req.body;

        const store = await Store.findById(req.params.id);

        if (!store) {
            return res.status(404).json({ message: 'Store not found' });
        }

        store.approvalStatus = 'rejected';
        store.rejectionReason = reason || 'No reason provided';

        await store.save();

        res.json({
            message: 'Store rejected',
            store
        });
    } catch (error) {
        console.error('Reject store error:', error);
        res.status(500).json({ message: 'Failed to reject store', error: error.message });
    }
};

