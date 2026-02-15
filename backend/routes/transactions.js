const express = require('express');
const mongoose = require('mongoose');
const { body, query } = require('express-validator');
const Transaction = require('../models/Transaction');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

// Record game transaction
router.post(
    '/record',
    auth,
    [
        body('game').isString().isIn(['slots', 'blackjack', 'roulette', 'dice', 'poker', 'keno']),
        body('type').isString().isIn(['bet', 'win', 'deposit', 'coupon']),
        body('amount').isFloat({ min: 0 }),
        body('bet').optional().isFloat({ min: 0 }),
        body('winAmount').optional().isFloat({ min: 0 }),
        body('multiplier').optional().isFloat({ min: 0 })
    ],
    validate,
    async (req, res) => {
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
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Get user transactions
router.get(
    '/history',
    auth,
    [query('limit').optional().isInt({ min: 1, max: 200 })],
    validate,
    async (req, res) => {
    try {
        const limit = parseInt(req.query.limit, 10) || 50;
        const transactions = await Transaction.find({ user: req.user.id })
            .sort({ createdAt: -1 })
            .limit(limit);
        
        res.json(transactions);
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
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
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;
