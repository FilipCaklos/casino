// Initialize default coupons
db.coupons.insertMany([
    {
        code: 'BOOST50',
        bonus: 5000,
        message: '🎉 +$5,000 Bonus!',
        maxUses: -1,
        currentUses: 0,
        isActive: true,
        createdAt: new Date()
    },
    {
        code: 'CASINO100',
        bonus: 10000,
        message: '💰 +$10,000 Bonus!',
        maxUses: -1,
        currentUses: 0,
        isActive: true,
        createdAt: new Date()
    },
    {
        code: 'LUCKY777',
        bonus: 7777,
        message: '🍀 +$7,777 Lucky Bonus!',
        maxUses: -1,
        currentUses: 0,
        isActive: true,
        createdAt: new Date()
    },
    {
        code: 'SPIN50',
        bonus: 5000,
        message: '🎡 +$5,000 Spin Bonus!',
        maxUses: -1,
        currentUses: 0,
        isActive: true,
        createdAt: new Date()
    },
    {
        code: 'WELCOME',
        bonus: 2000,
        message: '👋 +$2,000 Welcome Bonus!',
        maxUses: -1,
        currentUses: 0,
        isActive: true,
        createdAt: new Date()
    }
]);
