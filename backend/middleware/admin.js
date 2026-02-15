const User = require('../models/User');

const admin = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id).select('isAdmin');
        if (!user || !user.isAdmin) {
            return res.status(403).json({ error: 'Forbidden' });
        }
        next();
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

module.exports = admin;
