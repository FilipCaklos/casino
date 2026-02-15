const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        minlength: 3,
        maxlength: 30
    },
    email: {
        type: String,
        lowercase: true,
        sparse: true
    },
    password: {
        type: String,
        required: true,
        minlength: 3
    },
    isAdmin: {
        type: Boolean,
        default: false
    },
    balance: {
        type: Number,
        default: 10000,
        min: 0
    },
    totalBets: {
        type: Number,
        default: 0
    },
    totalWins: {
        type: Number,
        default: 0
    },
    biggestWin: {
        type: Number,
        default: 0
    },
    couponsUsed: {
        type: [String],
        default: []
    },
    stats: {
        slotsPlayed: { type: Number, default: 0 },
        blackjackPlayed: { type: Number, default: 0 },
        roulettePlayed: { type: Number, default: 0 },
        dicePlayed: { type: Number, default: 0 },
        pokerPlayed: { type: Number, default: 0 },
        kenoPlayed: { type: Number, default: 0 }
    },
    lastLogin: Date,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Compare password method
userSchema.methods.comparePassword = async function(password) {
    return await bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('User', userSchema);
