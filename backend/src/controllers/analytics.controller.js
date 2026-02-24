const Order = require('../models/Order');
const Store = require('../models/Store');
const User = require('../models/User');
const UserActivity = require('../models/UserActivity');

// Global revenue analytics (admin)
exports.getGlobalRevenue = async (req, res) => {
    try {
        const { period = '30' } = req.query;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(period));

        // Get all completed/non-cancelled orders in period
        const orders = await Order.find({
            createdAt: { $gte: startDate },
            status: { $ne: 'cancelled' }
        }).populate('store', 'name category');

        const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
        const totalOrders = orders.length;
        const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

        // Revenue per store
        const storeRevenue = {};
        orders.forEach(order => {
            const storeId = order.store?._id?.toString() || 'unknown';
            const storeName = order.store?.name || 'Unknown Store';
            const storeCategory = order.store?.category || 'Other';
            if (!storeRevenue[storeId]) {
                storeRevenue[storeId] = {
                    storeId,
                    storeName,
                    storeCategory,
                    totalRevenue: 0,
                    totalOrders: 0,
                    completedOrders: 0,
                    pendingOrders: 0
                };
            }
            storeRevenue[storeId].totalRevenue += order.totalAmount;
            storeRevenue[storeId].totalOrders += 1;
            if (order.status === 'completed') storeRevenue[storeId].completedOrders += 1;
            if (order.status === 'pending') storeRevenue[storeId].pendingOrders += 1;
        });

        const storeRevenueList = Object.values(storeRevenue)
            .sort((a, b) => b.totalRevenue - a.totalRevenue);

        // Daily revenue trend
        const dailyRevenue = {};
        orders.forEach(order => {
            const date = order.createdAt.toISOString().split('T')[0];
            if (!dailyRevenue[date]) {
                dailyRevenue[date] = { date, revenue: 0, orders: 0 };
            }
            dailyRevenue[date].revenue += order.totalAmount;
            dailyRevenue[date].orders += 1;
        });

        const revenueTrend = Object.values(dailyRevenue).sort((a, b) =>
            new Date(a.date) - new Date(b.date)
        );

        // Category breakdown
        const categoryRevenue = {};
        orders.forEach(order => {
            const cat = order.store?.category || 'Other';
            if (!categoryRevenue[cat]) {
                categoryRevenue[cat] = { category: cat, revenue: 0, orders: 0 };
            }
            categoryRevenue[cat].revenue += order.totalAmount;
            categoryRevenue[cat].orders += 1;
        });

        const categoryList = Object.values(categoryRevenue)
            .sort((a, b) => b.revenue - a.revenue);

        res.json({
            period: parseInt(period),
            overview: {
                totalRevenue,
                totalOrders,
                averageOrderValue: avgOrderValue,
                totalStores: storeRevenueList.length
            },
            storeRevenue: storeRevenueList,
            revenueTrend,
            categoryBreakdown: categoryList
        });
    } catch (error) {
        console.error('Get global revenue error:', error);
        res.status(500).json({ message: 'Failed to get revenue', error: error.message });
    }
};

// Track user activity
exports.trackActivity = async (req, res) => {
    try {
        const { action, details, location, sessionId } = req.body;

        const activity = await UserActivity.create({
            user: req.user._id,
            userRole: req.user.role,
            action,
            details: details || {},
            location: location ? {
                type: 'Point',
                coordinates: [location.lng || 0, location.lat || 0]
            } : undefined,
            sessionId,
            ip: req.ip,
            userAgent: req.headers['user-agent']
        });

        res.status(201).json({ tracked: true });
    } catch (error) {
        // Don't fail silently — just log and return success so tracking doesn't break the app
        console.error('Track activity error:', error);
        res.status(200).json({ tracked: false });
    }
};

// Get user activities (admin)
exports.getUserActivities = async (req, res) => {
    try {
        const { userId, role, action, limit = '100', page = '1' } = req.query;
        const query = {};
        if (userId) query.user = userId;
        if (role) query.userRole = role;
        if (action) query.action = action;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const activities = await UserActivity.find(query)
            .populate('user', 'username email phone role')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await UserActivity.countDocuments(query);

        res.json({ activities, total, page: parseInt(page), limit: parseInt(limit) });
    } catch (error) {
        console.error('Get user activities error:', error);
        res.status(500).json({ message: 'Failed to get activities', error: error.message });
    }
};

// Get active users with locations (admin - for map)
exports.getActiveUsers = async (req, res) => {
    try {
        const { minutes = '30' } = req.query;
        const since = new Date(Date.now() - parseInt(minutes) * 60 * 1000);

        // Get recent activities with location
        const recentActivities = await UserActivity.aggregate([
            {
                $match: {
                    createdAt: { $gte: since },
                    'location.coordinates': { $ne: [0, 0] }
                }
            },
            {
                $sort: { createdAt: -1 }
            },
            {
                $group: {
                    _id: '$user',
                    lastActivity: { $first: '$$ROOT' },
                    activityCount: { $sum: 1 },
                    actions: { $push: '$action' }
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'userInfo'
                }
            },
            {
                $unwind: '$userInfo'
            },
            {
                $project: {
                    userId: '$_id',
                    username: '$userInfo.username',
                    email: '$userInfo.email',
                    role: '$userInfo.role',
                    location: '$lastActivity.location',
                    lastAction: '$lastActivity.action',
                    lastPage: '$lastActivity.details.page',
                    activityCount: 1,
                    lastSeen: '$lastActivity.createdAt'
                }
            }
        ]);

        // Also get all users with stored location (for general view)
        const allUsersWithLocation = await User.find({
            'location.coordinates': { $ne: [0, 0] }
        }).select('username email role location createdAt');

        res.json({
            activeUsers: recentActivities,
            activeCount: recentActivities.length,
            allUsersWithLocation: allUsersWithLocation.map(u => ({
                userId: u._id,
                username: u.username,
                email: u.email,
                role: u.role,
                location: u.location,
                registeredAt: u.createdAt
            }))
        });
    } catch (error) {
        console.error('Get active users error:', error);
        res.status(500).json({ message: 'Failed to get active users', error: error.message });
    }
};

// Get user behavior summary (admin)
exports.getUserBehaviorSummary = async (req, res) => {
    try {
        const { userId } = req.params;
        const { days = '30' } = req.query;
        const since = new Date();
        since.setDate(since.getDate() - parseInt(days));

        const activities = await UserActivity.find({
            user: userId,
            createdAt: { $gte: since }
        }).sort({ createdAt: -1 }).limit(500);

        // Action breakdown
        const actionCounts = {};
        const pageCounts = {};
        const clickCounts = {};

        activities.forEach(a => {
            actionCounts[a.action] = (actionCounts[a.action] || 0) + 1;
            if (a.details?.page) pageCounts[a.details.page] = (pageCounts[a.details.page] || 0) + 1;
            if (a.details?.element) clickCounts[a.details.element] = (clickCounts[a.details.element] || 0) + 1;
        });

        // Daily activity
        const dailyActivity = {};
        activities.forEach(a => {
            const date = a.createdAt.toISOString().split('T')[0];
            dailyActivity[date] = (dailyActivity[date] || 0) + 1;
        });

        const user = await User.findById(userId).select('username email phone role createdAt');

        res.json({
            user,
            totalActivities: activities.length,
            actionBreakdown: Object.entries(actionCounts).map(([action, count]) => ({ action, count }))
                .sort((a, b) => b.count - a.count),
            pageViews: Object.entries(pageCounts).map(([page, count]) => ({ page, count }))
                .sort((a, b) => b.count - a.count),
            clickMap: Object.entries(clickCounts).map(([element, count]) => ({ element, count }))
                .sort((a, b) => b.count - a.count),
            dailyActivity: Object.entries(dailyActivity).map(([date, count]) => ({ date, count }))
                .sort((a, b) => new Date(a.date) - new Date(b.date)),
            recentActivities: activities.slice(0, 50)
        });
    } catch (error) {
        console.error('Get user behavior error:', error);
        res.status(500).json({ message: 'Failed to get user behavior', error: error.message });
    }
};
