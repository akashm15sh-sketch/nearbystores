const Store = require('../models/Store');
const User = require('../models/User');
const authService = require('../services/auth.service');

// Register new store partner
exports.registerPartner = async (req, res) => {
    try {
        const {
            username, email, phone, password,
            storeName, category, description, address,
            upiId
        } = req.body;

        // Basic validation
        if (!username || !password || !email) {
            console.log('Registration failed: Missing user details', req.body);
            return res.status(400).json({ message: 'User details required' });
        }
        if (!storeName || !category || !address) {
            console.log('Registration failed: Missing store details', req.body);
            return res.status(400).json({ message: 'Store details required' });
        }

        // Verify OTP
        if (!req.body.otp) {
            return res.status(400).json({ message: 'OTP is required' });
        }

        const otpIdentifier = email || phone;
        const isValidOTP = authService.verifyOTP(otpIdentifier, req.body.otp);
        if (!isValidOTP) {
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }

        // Check if user exists with store_owner role
        const orConditions = [];
        if (email) orConditions.push({ email, role: 'store_owner' });
        if (phone) orConditions.push({ phone, role: 'store_owner' });
        if (username) orConditions.push({ username, role: 'store_owner' });

        const existingUser = orConditions.length > 0
            ? await User.findOne({ $or: orConditions })
            : null;

        if (existingUser) {
            return res.status(400).json({ message: 'User already exists as a partner' });
        }

        // Process files
        const storeImages = req.files['images'] ? req.files['images'].map(f => `/uploads/${f.filename}`) : [];
        const qrCodeUrl = req.files['qrCode'] ? `/uploads/${req.files['qrCode'][0].filename}` : null;
        const iconUrl = req.files['icon'] ? `/uploads/${req.files['icon'][0].filename}` : null;

        // 1. Create User
        const hashedPassword = await authService.hashPassword(password);
        const user = await User.create({
            username,
            email,
            phone,
            password: hashedPassword,
            role: 'store_owner',
            isVerified: true // Auto-verify email for now to simplify
        });

        // 2. Create Store
        let schedule = undefined;
        if (req.body.schedule) {
            try {
                schedule = typeof req.body.schedule === 'string'
                    ? JSON.parse(req.body.schedule)
                    : req.body.schedule;
            } catch (e) {
                console.error('Failed to parse schedule:', e);
            }
        }

        const store = await Store.create({
            name: storeName,
            category,
            description,
            location: {
                type: 'Point',
                coordinates: [
                    parseFloat(req.body.longitude) || 0,
                    parseFloat(req.body.latitude) || 0
                ],
                address
            },
            ...(schedule && { schedule }),
            images: storeImages,
            icon: iconUrl,
            paymentMethods: {
                upiId,
                qrCodeUrl,
                cashOnDelivery: true
            },
            owner: user._id,
            approvalStatus: 'pending'
        });

        // Generate token
        const token = authService.generateToken(user._id);

        res.status(201).json({
            message: 'Partner registration successful',
            token,
            user: {
                id: user._id,
                username: user.username,
                role: user.role
            },
            store: {
                id: store._id,
                name: store.name,
                status: store.approvalStatus
            }
        });

    } catch (error) {
        console.error('Partner registration error:', error);
        res.status(500).json({ message: 'Registration failed', error: error.message });
    }
};
