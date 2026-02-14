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

module.exports = router;
