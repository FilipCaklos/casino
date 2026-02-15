const express = require('express');
const { body } = require('express-validator');
const Coupon = require('../models/Coupon');
const User = require('../models/User');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const validate = require('../middleware/validate');

const router = express.Router();

// Redeem coupon
router.post(
    '/redeem',
    auth,
    [body('code').trim().isLength({ min: 3, max: 20 })],
    validate,
    async (req, res) => {
    try {
        const { code } = req.body;

        if (!code) {
            return res.status(400).json({ error: 'Coupon code required' });
        }

        const coupon = await Coupon.findOne({ code: code.toUpperCase() });
        
        if (!coupon) {
            return res.status(400).json({ error: 'Invalid coupon code' });
        }

        if (!coupon.isActive) {
            return res.status(400).json({ error: 'Coupon is no longer active' });
        }

        if (coupon.expiresAt && new Date() > coupon.expiresAt) {
            return res.status(400).json({ error: 'Coupon has expired' });
        }

        if (coupon.maxUses > 0 && coupon.currentUses >= coupon.maxUses) {
            return res.status(400).json({ error: 'Coupon limit reached' });
        }

        const user = await User.findById(req.user.id);
        
        if (user.couponsUsed.includes(code.toUpperCase())) {
            return res.status(400).json({ error: 'This coupon has already been used' });
        }

        // Apply bonus
        user.balance += coupon.bonus;
        user.couponsUsed.push(code.toUpperCase());
        await user.save();

        // Update coupon usage
        coupon.currentUses++;
        await coupon.save();

        res.json({
            message: coupon.message || 'Coupon redeemed successfully',
            bonus: coupon.bonus,
            balance: user.balance
        });
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Get all active coupons (admin)
router.get('/all', auth, admin, async (req, res) => {
    try {
        const coupons = await Coupon.find({ isActive: true });
        res.json(coupons);
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;
