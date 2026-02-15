const express = require('express');
const jwt = require('jsonwebtoken');
const { body } = require('express-validator');
const User = require('../models/User');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

// Register
router.post(
    '/register',
    [
        body('username').trim().isLength({ min: 3, max: 30 }),
        body('password').isLength({ min: 6 }),
        body('confirmPassword').custom((value, { req }) => value === req.body.password)
    ],
    validate,
    async (req, res) => {
    try {
        const { username, password, confirmPassword } = req.body;

        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            return res.status(500).json({ error: 'JWT secret not configured' });
        }

        // Validation
        if (!username || !password || !confirmPassword) {
            return res.status(400).json({ error: 'All fields required' });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({ error: 'Passwords do not match' });
        }

        if (username.length < 3) {
            return res.status(400).json({ error: 'Username must be at least 3 characters' });
        }

        if (password.length < 3) {
            return res.status(400).json({ error: 'Password must be at least 3 characters' });
        }

        // Check if user exists
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        // Create new user
        const user = new User({
            username,
            password,
            balance: 10000
        });

        await user.save();

        // Generate token
        const token = jwt.sign(
            { id: user._id, username: user.username },
            jwtSecret,
            { expiresIn: process.env.JWT_EXPIRE || '7d' }
        );

        res.status(201).json({
            token,
            user: {
                id: user._id,
                username: user.username,
                balance: user.balance
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Login
router.post(
    '/login',
    [
        body('username').trim().notEmpty(),
        body('password').notEmpty()
    ],
    validate,
    async (req, res) => {
    try {
        const { username, password } = req.body;

        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            return res.status(500).json({ error: 'JWT secret not configured' });
        }

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password required' });
        }

        const user = await User.findOne({ username });
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const isValidPassword = await user.comparePassword(password);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        user.lastLogin = new Date();
        await user.save();

        const token = jwt.sign(
            { id: user._id, username: user.username },
            jwtSecret,
            { expiresIn: process.env.JWT_EXPIRE || '7d' }
        );

        res.json({
            token,
            user: {
                id: user._id,
                username: user.username,
                balance: user.balance,
                totalBets: user.totalBets,
                totalWins: user.totalWins,
                biggestWin: user.biggestWin
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Logout (frontend should just delete token)
router.post('/logout', auth, (req, res) => {
    res.json({ message: 'Logged out successfully' });
});

module.exports = router;
