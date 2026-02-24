const User = require('../models/User');

// Get all users (admin only)
exports.getAllUsersAdmin = async (req, res) => {
    try {
        const users = await User.find().select('-password').sort({ createdAt: -1 });

        res.json({ users, count: users.length });
    } catch (error) {
        console.error('Get all users admin error:', error);
        res.status(500).json({ message: 'Failed to get users', error: error.message });
    }
};
