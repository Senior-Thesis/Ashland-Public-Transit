const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { protect } = require('../middleware/authMiddleware');

// Generate JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'secret_dev_key_123', {
        expiresIn: '30d',
    });
};

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        // Check for user
        const user = await User.findOne({ username });

        // Check password (simple override for 'Ashland2026' legacy, or bcrypt)
        // MIGRATION HELPER: If user doesn't exist, create default Admin on first login with matching password
        if (!user && username === 'admin' && password === 'Ashland2026') {
            // Hash password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            const admin = await User.create({
                username: 'admin',
                password: hashedPassword,
                role: 'Admin'
            });

            return res.json({
                _id: admin.id,
                username: admin.username,
                token: generateToken(admin.id),
                role: admin.role
            });
        }

        if (user && (await bcrypt.compare(password, user.password))) {
            res.json({
                _id: user.id,
                username: user.username,
                token: generateToken(user.id),
                role: user.role,
                walletBalance: user.walletBalance
            });
        } else {
            res.status(401).json({ message: 'Invalid credentials' });
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// @route   POST /api/auth/signup
// @desc    Register a new user (Rider/Driver) - ADMIN protected? No, public for Riders.
// @access  Public
router.post('/signup', async (req, res) => {
    try {
        const { username, password, email, role, phoneNumber, pushToken } = req.body;

        if (!username || !password) {
            return res.status(400).json({ message: "Username and password are required." });
        }

        // 1. Check if user exists
        const userExists = await User.findOne({ username });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // 2. Security: Force role to Rider unless explicitly Driver (Validation needed usually, but for now allow Driver)
        // STRICTLY FORBID 'Admin' or 'Dispatcher' creation via this public signup
        let assignedRole = 'Rider';
        if (role === 'Driver') {
            assignedRole = 'Driver';
            // TODO: Driver signup might need manual approval in real world
        }

        // 3. Hash Password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 4. Create User
        const user = await User.create({
            username,
            password: hashedPassword,
            role: assignedRole,
            phoneNumber,
            pushToken,
            walletBalance: 0 // Start with 0
        });

        if (user) {
            res.status(201).json({
                _id: user.id,
                username: user.username,
                role: user.role,
                token: generateToken(user.id)
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// @route   PATCH /api/auth/vehicle
// @desc    Update logged-in user's current vehicle
// @access  Private
router.patch('/vehicle', protect, async (req, res) => {
    try {
        const { vehicleId } = req.body;
        const user = await User.findById(req.user.id);

        if (user) {
            user.currentVehicle = vehicleId || null;
            await user.save();
            res.json({ message: 'Vehicle updated', currentVehicle: user.currentVehicle });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// @route   GET /api/auth/users
// @desc    Get all users (Used to fetch Drivers)
// @access  Public (Protected in real app, but open for Demo/Dispatcher)
router.get('/users', async (req, res) => { // TODO: Add protect middleware
    try {
        const { role } = req.query;
        let query = {};
        if (role) query.role = role;

        const users = await User.find(query)
            .select('-password')
            .populate('currentVehicle'); // POpulate vehicle details

        res.json(users);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
