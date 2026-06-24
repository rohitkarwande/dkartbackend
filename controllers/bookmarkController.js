const db = require('../config/db');

const addBookmark = async (req, res) => {
    try {
        const { equipmentId } = req.params;
        const result = await db.query(
            `INSERT INTO bookmarks (user_id, equipment_post_id)
             VALUES ($1, $2)
             ON CONFLICT DO NOTHING
             RETURNING *`,
            [req.user.id, equipmentId]
        );

        if (result.rows.length > 0) {
            await db.query(
                `INSERT INTO engagement_metrics (equipment_post_id, save_count)
                 VALUES ($1, 1)
                 ON CONFLICT (equipment_post_id)
                 DO UPDATE SET save_count = engagement_metrics.save_count + 1, updated_at = CURRENT_TIMESTAMP`,
                [equipmentId]
            );
        }

        res.status(201).json({ message: 'Bookmark added', bookmark: result.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error adding bookmark' });
    }
};

const removeBookmark = async (req, res) => {
    try {
        const { equipmentId } = req.params;
        await db.query(
            `DELETE FROM bookmarks WHERE user_id = $1 AND equipment_post_id = $2`,
            [req.user.id, equipmentId]
        );
        res.json({ message: 'Bookmark removed' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error removing bookmark' });
    }
};

const getBookmarks = async (req, res) => {
    try {
        const result = await db.query(
            `SELECT b.id as bookmark_id, e.* 
             FROM bookmarks b
             JOIN equipment_posts e ON b.equipment_post_id = e.id
             WHERE b.user_id = $1
             ORDER BY b.created_at DESC`,
            [req.user.id]
        );
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error fetching bookmarks' });
    }
};

const saveSearch = async (req, res) => {
    try {
        const filters = req.body;
        const result = await db.query(
            `INSERT INTO saved_searches (user_id, filters)
             VALUES ($1, $2)
             RETURNING *`,
            [req.user.id, JSON.stringify(filters)]
        );
        res.status(201).json({ message: 'Search saved', search: result.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error saving search' });
    }
};

const removeSavedSearch = async (req, res) => {
    try {
        const { searchId } = req.params;
        await db.query(
            `DELETE FROM saved_searches WHERE id = $1 AND user_id = $2`,
            [searchId, req.user.id]
        );
        res.json({ message: 'Saved search removed' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error removing saved search' });
    }
};

const getSavedSearches = async (req, res) => {
    try {
        const result = await db.query(
            `SELECT * FROM saved_searches WHERE user_id = $1 ORDER BY created_at DESC`,
            [req.user.id]
        );
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error fetching saved searches' });
    }
};

module.exports = {
    addBookmark,
    removeBookmark,
    getBookmarks,
    saveSearch,
    removeSavedSearch,
    getSavedSearches
};
