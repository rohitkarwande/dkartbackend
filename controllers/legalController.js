const db = require('../config/db');
const { sendNotification } = require('../services/notificationService');

// 1. Submit Legal Query
const submitLegalQuery = async (req, res) => {
    try {
        const userId = req.user.id;
        const { subject, description, contact_phone } = req.body;

        if (!subject || !description) {
            return res.status(400).json({ error: 'Subject and description are required' });
        }

        const result = await db.query(
            "INSERT INTO legal_consultations (user_id, subject, description, contact_phone) VALUES ($1, $2, $3, $4) RETURNING *",
            [userId, subject, description, contact_phone]
        );

        res.status(201).json({ message: 'Legal query submitted', query: result.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server Error submitting legal query' });
    }
};

// User Tracking (Get my queries)
const getMyLegalQueries = async (req, res) => {
    try {
        const userId = req.user.id;
        const result = await db.query("SELECT * FROM legal_consultations WHERE user_id = $1 ORDER BY created_at DESC", [userId]);
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server Error fetching legal queries' });
    }
};

// 2. Admin Panel
const getAllLegalQueries = async (req, res) => {
    try {
        const result = await db.query("SELECT * FROM legal_consultations ORDER BY created_at DESC");
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server Error fetching all legal queries' });
    }
};

const updateLegalQueryStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['New', 'Reviewing', 'Resolved'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        const result = await db.query(
            "UPDATE legal_consultations SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *",
            [status, id]
        );

        if (result.rows.length === 0) return res.status(404).json({ error: 'Legal query not found' });

        const query = result.rows[0];

        // 3. Notification Support
        await sendNotification(
            query.user_id,
            'Legal Query Update',
            `The status of your legal query "${query.subject}" has been updated to ${status}.`,
            query.id.toString()
        );

        res.json({ message: 'Legal query updated', query });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server Error updating legal query' });
    }
};

module.exports = {
    submitLegalQuery,
    getMyLegalQueries,
    getAllLegalQueries,
    updateLegalQueryStatus
};
