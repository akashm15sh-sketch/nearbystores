const SupportMessage = require('../models/SupportMessage');
const User = require('../models/User');

// Create support message (authenticated customer or partner)
exports.createMessage = async (req, res) => {
    try {
        const { message, contactPreference } = req.body;

        if (!message || message.trim().length === 0) {
            return res.status(400).json({ message: 'Message is required' });
        }

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const supportMessage = await SupportMessage.create({
            sender: user._id,
            senderRole: user.role,
            senderName: user.username,
            senderEmail: user.email,
            senderPhone: user.phone,
            message: message.trim(),
            contactPreference: contactPreference || 'text'
        });

        res.status(201).json({
            message: 'Support message sent successfully',
            supportMessage
        });
    } catch (error) {
        console.error('Create support message error:', error);
        res.status(500).json({ message: 'Failed to send support message', error: error.message });
    }
};

// Get all support messages (admin only)
exports.getAllMessages = async (req, res) => {
    try {
        const { status } = req.query;
        const query = {};
        if (status && status !== 'all') {
            query.status = status;
        }

        const messages = await SupportMessage.find(query)
            .sort({ createdAt: -1 })
            .populate('sender', 'username email phone role')
            .limit(100);

        res.json({ messages });
    } catch (error) {
        console.error('Get support messages error:', error);
        res.status(500).json({ message: 'Failed to fetch messages', error: error.message });
    }
};

// Resolve a support message (admin only)
exports.resolveMessage = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, adminNotes, adminReply } = req.body;

        const supportMessage = await SupportMessage.findByIdAndUpdate(
            id,
            {
                status: status || 'resolved',
                ...(adminNotes !== undefined && { adminNotes }),
                ...(adminReply !== undefined && { adminReply })
            },
            { new: true }
        );

        if (!supportMessage) {
            return res.status(404).json({ message: 'Message not found' });
        }

        res.json({ message: 'Status updated', supportMessage });
    } catch (error) {
        console.error('Resolve support message error:', error);
        res.status(500).json({ message: 'Failed to update message', error: error.message });
    }
};

// Get support message count (admin) - for badge
exports.getOpenCount = async (req, res) => {
    try {
        const count = await SupportMessage.countDocuments({ status: 'open' });
        res.json({ count });
    } catch (error) {
        res.status(500).json({ message: 'Failed to get count', error: error.message });
    }
};
