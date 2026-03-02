const User = require('../models/User');
const authService = require('../services/auth.service');
const notificationService = require('../services/notification.service');

// Send OTP
exports.sendOTP = async (req, res) => {
    try {
        const { email, phone } = req.body;

        if (!email && !phone) {
            return res.status(400).json({ message: 'Email or phone is required' });
        }

        // Generate OTP
        const otp = authService.generateOTP();
        const identifier = email || phone;

        // Store OTP
        authService.storeOTP(identifier, otp);

        // Send OTP via email
        if (email) {
            await notificationService.sendOTP(email, otp);
        } else {
            // SMS OTP would go here (requires paid service)
            console.log(`SMS OTP for ${phone}: ${otp}`);
        }

        res.json({
            message: 'OTP sent successfully',
            identifier: email ? 'email' : 'phone'
        });
    } catch (error) {
        console.error('Send OTP error:', error);
        res.status(500).json({ message: 'Failed to send OTP', error: error.message });
    }
};

// Verify OTP and Register
exports.register = async (req, res) => {
    try {
        const { email, phone, otp, username, password, phoneVerified } = req.body;

        // Validate input
        if (!username || !password) {
            return res.status(400).json({ message: 'Username and password are required' });
        }

        if (!email && !phone) {
            return res.status(400).json({ message: 'Email or phone is required' });
        }

        const identifier = email || phone;

        // Verify OTP — skip if phone was already verified by Firebase
        if (phoneVerified && phone) {
            // Phone was verified by Firebase on the frontend, no backend OTP check needed
            console.log(`[Auth] Phone ${phone} verified via Firebase`);
        } else {
            // Email OTP verification (existing flow)
            const isValidOTP = authService.verifyOTP(identifier, otp);
            if (!isValidOTP) {
                return res.status(400).json({ message: 'Invalid or expired OTP' });
            }
        }

        // Check if username is available for this role
        const isAvailable = await authService.isUsernameAvailable(username, 'customer');
        if (!isAvailable) {
            return res.status(400).json({ message: 'Username already taken' });
        }

        // Check if email/phone already exists for customer role
        const orConditions = [];
        if (email) orConditions.push({ email, role: 'customer' });
        if (phone) orConditions.push({ phone, role: 'customer' });

        const existingUser = orConditions.length > 0
            ? await User.findOne({ $or: orConditions })
            : null;

        if (existingUser) {
            return res.status(400).json({ message: 'Email or phone already registered' });
        }

        // Hash password
        const hashedPassword = await authService.hashPassword(password);

        // Create user
        const user = await User.create({
            username: username.toLowerCase(),
            email,
            phone,
            password: hashedPassword,
            isVerified: true
        });

        // Generate token
        const token = authService.generateToken(user._id);

        res.status(201).json({
            message: 'Registration successful',
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                phone: user.phone,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Registration failed', error: error.message });
    }
};

// Login
exports.login = async (req, res) => {
    try {
        const { username, password, role } = req.body;

        if (!username || !password) {
            return res.status(400).json({ message: 'Username/Email and password are required' });
        }

        // Build query - find by username or email, scoped by role if provided
        const query = {
            $or: [
                { username: username.toLowerCase() },
                { email: username.toLowerCase() }
            ]
        };
        if (role) {
            query.role = role;
        }

        const user = await User.findOne(query).select('+password');

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Check password
        const isValidPassword = await authService.comparePassword(password, user.password);

        if (!isValidPassword) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Generate token
        const token = authService.generateToken(user._id);

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                phone: user.phone,
                role: user.role,
                preferences: user.preferences
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Login failed', error: error.message });
    }
};

// Check username availability
exports.checkUsername = async (req, res) => {
    try {
        const { username } = req.params;
        const { role } = req.query;

        if (!username || username.length < 3) {
            return res.status(400).json({ message: 'Username must be at least 3 characters' });
        }

        const isAvailable = await authService.isUsernameAvailable(username, role || 'customer');

        res.json({ available: isAvailable });
    } catch (error) {
        console.error('Check username error:', error);
        res.status(500).json({ message: 'Failed to check username', error: error.message });
    }
};

// Get current user
exports.getCurrentUser = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({ user });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ message: 'Failed to get user', error: error.message });
    }
};

// Update user preferences
exports.updatePreferences = async (req, res) => {
    try {
        const { emailNotifications, whatsappNotifications, proximityAlerts } = req.body;

        const user = await User.findByIdAndUpdate(
            req.user.id,
            {
                preferences: {
                    emailNotifications,
                    whatsappNotifications,
                    proximityAlerts
                }
            },
            { new: true }
        );

        res.json({ message: 'Preferences updated', user });
    } catch (error) {
        console.error('Update preferences error:', error);
        res.status(500).json({ message: 'Failed to update preferences', error: error.message });
    }
};
