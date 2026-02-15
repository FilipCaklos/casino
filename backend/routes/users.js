const express = require('express');
const { body } = require('express-validator');
const User = require('../models/User');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const validate = require('../middleware/validate');

const router = express.Router();

// Get user profile
router.get('/profile', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Get user balance
router.get('/balance', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        res.json({ balance: user.balance });
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Update balance after game
router.post(
    '/update-balance',
    auth,
    [
        body('game').isString().isIn(['slots', 'blackjack', 'roulette', 'dice', 'poker', 'keno']),
        body('bet').isFloat({ min: 0 }),
        body('win').isFloat({ min: 0 })
    ],
    validate,
    async (req, res) => {
    try {
        const { game, bet, win } = req.body;

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const betAmount = Number(bet);
        const winAmount = Number(win);
        if (!Number.isFinite(betAmount) || !Number.isFinite(winAmount)) {
            return res.status(400).json({ error: 'Invalid amount' });
        }

        if (betAmount > user.balance) {
            return res.status(400).json({ error: 'Insufficient balance' });
        }
        
        // Deduct bet
        user.balance -= betAmount;
        user.totalBets++;

        // Add win
        if (winAmount > 0) {
            user.balance += winAmount;
            user.totalWins++;
            if (winAmount > user.biggestWin) {
                user.biggestWin = winAmount;
            }
        }

        // Update game stats
        if (user.stats[game + 'Played'] !== undefined) {
            user.stats[game + 'Played']++;
        }

        await user.save();

        res.json({
            balance: user.balance,
            totalBets: user.totalBets,
            totalWins: user.totalWins,
            biggestWin: user.biggestWin
        });
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Reset balance (admin only)
router.post('/reset-balance', auth, admin, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        user.balance = 10000;
        user.totalBets = 0;
        user.totalWins = 0;
        user.biggestWin = 0;
        await user.save();
        
        res.json({ message: 'Balance reset', balance: user.balance });
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Get global statistics (all users combined)
router.get('/global-stats', auth, admin, async (req, res) => {
    try {
        const stats = await User.aggregate([
            {
                $group: {
                    _id: null,
                    totalUsers: { $sum: 1 },
                    totalBets: { $sum: '$totalBets' },
                    totalWins: { $sum: '$totalWins' },
                    totalMoneyBet: { $sum: '$totalBets' }, // Approximate
                    biggestWinEver: { $max: '$biggestWin' }
                }
            }
        ]);

        if (stats.length === 0) {
            return res.json({
                totalUsers: 0,
                totalBets: 0,
                totalWins: 0,
                totalMoneyBet: 0,
                biggestWinEver: 0
            });
        }

        res.json(stats[0]);
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Change password
router.post(
    '/change-password',
    auth,
    [
        body('currentPassword').notEmpty(),
        body('newPassword').isLength({ min: 6 })
    ],
    validate,
    async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'All fields required' });
        }

        if (newPassword.length < 4) {
            return res.status(400).json({ error: 'New password must be at least 4 characters' });
        }

        const user = await User.findById(req.user.id);
        const isMatch = await user.comparePassword(currentPassword);

        if (!isMatch) {
            return res.status(401).json({ error: 'Current password is incorrect' });
        }

        user.password = newPassword;
        await user.save();

        res.json({ message: 'Password changed successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;
