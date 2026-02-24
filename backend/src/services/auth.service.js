const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

class AuthService {
    // Generate JWT token
    generateToken(userId) {
        return jwt.sign(
            { id: userId },
            process.env.JWT_SECRET || 'default-secret-key',
            { expiresIn: '30d' }
        );
    }

    // Hash password
    async hashPassword(password) {
        const salt = await bcrypt.genSalt(10);
        return bcrypt.hash(password, salt);
    }

    // Compare password
    async comparePassword(password, hashedPassword) {
        return bcrypt.compare(password, hashedPassword);
    }

    // Verify JWT token
    verifyToken(token) {
        try {
            return jwt.verify(token, process.env.JWT_SECRET || 'default-secret-key');
        } catch (error) {
            return null;
        }
    }

    // Check username availability (scoped by role)
    async isUsernameAvailable(username, role) {
        const query = { username: username.toLowerCase() };
        if (role) query.role = role;
        const existingUser = await User.findOne(query);
        return !existingUser;
    }

    // Generate OTP (6-digit)
    generateOTP() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    // Store OTP temporarily (in production, use Redis or similar)
    // For now, we'll use an in-memory store
    otpStore = new Map();

    storeOTP(identifier, otp) {
        console.log(`[OTP] Generated OTP for ${identifier}: ${otp}`);
        this.otpStore.set(identifier, {
            otp,
            expiresAt: Date.now() + 30 * 60 * 1000 // 30 minutes
        });
    }

    verifyOTP(identifier, otp) {
        const stored = this.otpStore.get(identifier);
        if (!stored) return false;

        if (Date.now() > stored.expiresAt) {
            this.otpStore.delete(identifier);
            return false;
        }

        if (stored.otp === otp) {
            this.otpStore.delete(identifier);
            return true;
        }

        return false;
    }
}

module.exports = new AuthService();
