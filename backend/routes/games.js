const express = require('express');
const { body } = require('express-validator');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

// Game endpoints would be used for recording outcomes
// The actual game logic remains on frontend for performance

router.post(
    '/play',
    auth,
    [
        body('game').isString().isIn(['slots', 'blackjack', 'roulette', 'dice', 'poker', 'keno']),
        body('bet').isFloat({ min: 0 })
    ],
    validate,
    async (req, res) => {
    try {
        const { game, bet, outcome } = req.body;

        // Game outcome would be recorded and validated here
        res.json({ success: true, outcome });
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;
