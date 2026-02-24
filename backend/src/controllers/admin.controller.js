const User = require('../models/User');
const authService = require('../services/auth.service');
const notificationService = require('../services/notification.service');

const ADMIN_SECRET = process.env.ADMIN_SECRET || 'admin-secret-2026';

// Admin Registration
exports.register = async (req, res) => {
    try {
        const { username, email, password, otp, adminSecret } = req.body;

        // Validate admin secret
        if (adminSecret !== ADMIN_SECRET) {
            return res.status(403).json({ message: 'Invalid admin secret key' });
        }

        // Verify OTP
        if (!authService.verifyOTP(email, otp)) {
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }

        // Check if user already exists as admin
        const existingUser = await User.findOne({
            $or: [{ email, role: 'admin' }, { username, role: 'admin' }]
        });
        if (existingUser) {
            return res.status(400).json({ message: 'Admin with this email or username already exists' });
        }

        // Hash password and create admin user
        const hashedPassword = await authService.hashPassword(password);
        const user = await User.create({
            username,
            email,
            password: hashedPassword,
            role: 'admin'
        });

        const token = authService.generateToken(user._id);

        res.status(201).json({
            message: 'Admin account created successfully',
            token,
            user
        });
    } catch (error) {
        console.error('Admin registration error:', error);
        res.status(500).json({ message: 'Failed to register admin', error: error.message });
    }
};

// Send OTP for admin registration
exports.sendOTP = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }

        const otp = authService.generateOTP();
        authService.storeOTP(email, otp);

        await notificationService.sendOTP(email, otp);

        res.json({
            message: 'OTP sent successfully',
            identifier: email
        });
    } catch (error) {
        console.error('Admin OTP error:', error);
        res.status(500).json({ message: 'Failed to send OTP', error: error.message });
    }
};
