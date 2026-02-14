const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    username: String,
    type: {
        type: String,
        enum: ['bet', 'win', 'deposit', 'coupon'],
        required: true
    },
    game: {
        type: String,
        enum: ['slots', 'blackjack', 'roulette', 'dice', 'poker', 'keno'],
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    balanceBefore: Number,
    balanceAfter: Number,
    details: {
        bet: Number,
        winAmount: Number,
        multiplier: Number,
        result: String
    },
    createdAt: {
        type: Date,
        default: Date.now,
        index: true
    }
});

module.exports = mongoose.model('Transaction', transactionSchema);
