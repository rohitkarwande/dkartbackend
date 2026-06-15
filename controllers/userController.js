const db = require('../config/db');

const getProfile = async (req, res) => {
    try {
        const result = await db.query(
            'SELECT id, email, phone, is_verified, created_at FROM users WHERE id = $1',
            [req.user.id]
        );
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching profile' });
    }
};

const getDashboard = async (req, res) => {
    try {
        res.json({ message: 'Welcome to Dashboard', stats: { totalActivity: 0 } });
    } catch (error) {
        res.status(500).json({ error: 'Error fetching dashboard' });
    }
};

module.exports = { getProfile, getDashboard };
