const db = require('../config/db');

const getNotifications = async (req, res) => {
    try {
        const result = await db.query(
            `SELECT * FROM notifications 
             WHERE user_id = $1 
             ORDER BY created_at DESC`,
            [req.user.id]
        );
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error fetching notifications' });
    }
};

const markNotificationRead = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await db.query(
            `UPDATE notifications 
             SET is_read = TRUE 
             WHERE id = $1 AND user_id = $2
             RETURNING *`,
            [id, req.user.id]
        );
        res.json({ message: 'Notification marked as read', notification: result.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error updating notification' });
    }
};

const getRecentlyViewed = async (req, res) => {
    try {
        const result = await db.query(
            `SELECT r.id as view_id, e.* 
             FROM recently_viewed r
             JOIN equipment_posts e ON r.equipment_post_id = e.id
             WHERE r.user_id = $1
             ORDER BY r.viewed_at DESC
             LIMIT 10`,
            [req.user.id]
        );
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error fetching recently viewed' });
    }
};

const getSuggestions = async (req, res) => {
    try {
        // Mock simple suggestion logic: latest active posts not viewed recently
        const result = await db.query(
            `SELECT * FROM equipment_posts 
             WHERE status = 'Active' 
             AND id NOT IN (
                 SELECT equipment_post_id FROM recently_viewed WHERE user_id = $1
             )
             ORDER BY created_at DESC 
             LIMIT 5`,
            [req.user.id]
        );
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error fetching suggestions' });
    }
};

module.exports = {
    getNotifications,
    markNotificationRead,
    getRecentlyViewed,
    getSuggestions
};
