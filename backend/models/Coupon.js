const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true,
        uppercase: true
    },
    bonus: {
        type: Number,
        required: true
    },
    message: String,
    maxUses: {
        type: Number,
        default: -1 // -1 means unlimited
    },
    currentUses: {
        type: Number,
        default: 0
    },
    expiresAt: Date,
    isActive: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Coupon', couponSchema);
