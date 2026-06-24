const db = require('../config/db');

const reportFraud = async (req, res) => {
    try {
        const { reported_user_id, equipment_post_id, reason, description } = req.body;
        
        if (!reason) {
            return res.status(400).json({ error: 'Reason is required' });
        }

        const result = await db.query(
            `INSERT INTO fraud_reports (reporter_id, reported_user_id, equipment_post_id, reason, description)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
            [req.user.id, reported_user_id, equipment_post_id, reason, description]
        );
        res.status(201).json({ message: 'Report submitted successfully', report: result.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error submitting report' });
    }
};

module.exports = {
    reportFraud
};
