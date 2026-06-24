const db = require('../config/db');

const checkHealth = async (req, res) => {
    try {
        const dbStatus = await db.query('SELECT 1');
        res.json({
            status: 'OK',
            timestamp: new Date().toISOString(),
            database: dbStatus.rows.length === 1 ? 'Connected' : 'Error',
            message: 'Service is healthy'
        });
    } catch (error) {
        console.error('Health Check Error:', error);
        res.status(500).json({ status: 'ERROR', database: 'Disconnected' });
    }
};

module.exports = { checkHealth };
