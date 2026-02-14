const express = require('express');
const Transaction = require('../models/Transaction');
const auth = require('../middleware/auth');

const router = express.Router();

// Record game transaction
router.post('/record', auth, async (req, res) => {
    try {
        const { game, type, amount, bet, winAmount, multiplier, result } = req.body;

        const transaction = new Transaction({
            user: req.user.id,
            username: req.user.username,
            type,
            game,
            amount,
            details: {
                bet,
                winAmount,
                multiplier,
                result
            }
        });

        await transaction.save();
        res.status(201).json(transaction);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get user transactions
router.get('/history', auth, async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50;
        const transactions = await Transaction.find({ user: req.user.id })
            .sort({ createdAt: -1 })
            .limit(limit);
        
        res.json(transactions);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get transaction stats
router.get('/stats', auth, async (req, res) => {
    try {
        const stats = await Transaction.aggregate([
            { $match: { user: mongoose.Types.ObjectId(req.user.id) } },
            {
                $group: {
                    _id: '$game',
                    totalBets: { $sum: { $cond: [{ $eq: ['$type', 'bet'] }, 1, 0] } },
                    totalWins: { $sum: { $cond: [{ $eq: ['$type', 'win'] }, 1, 0] } },
                    totalAmount: { $sum: '$amount' }
                }
            }
        ]);

        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
