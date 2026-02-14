const express = require('express');
const User = require('../models/User');
const auth = require('../middleware/auth');

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
        res.status(500).json({ error: error.message });
    }
});

// Get user balance
router.get('/balance', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        res.json({ balance: user.balance });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update balance after game
router.post('/update-balance', auth, async (req, res) => {
    try {
        const { game, bet, win } = req.body;

        const user = await User.findById(req.user.id);
        
        // Deduct bet
        user.balance -= bet;
        user.totalBets++;

        // Add win
        if (win > 0) {
            user.balance += win;
            user.totalWins++;
            if (win > user.biggestWin) {
                user.biggestWin = win;
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
        res.status(500).json({ error: error.message });
    }
});

// Reset balance (admin only)
router.post('/reset-balance', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        user.balance = 10000;
        user.totalBets = 0;
        user.totalWins = 0;
        user.biggestWin = 0;
        await user.save();
        
        res.json({ message: 'Balance reset', balance: user.balance });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get global statistics (all users combined)
router.get('/global-stats', async (req, res) => {
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
        res.status(500).json({ error: error.message });
    }
});

// Change password
router.post('/change-password', auth, async (req, res) => {
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
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
