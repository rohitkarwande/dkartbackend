const db = require('../config/db');

const getDealHistory = async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Deals are inquiries with status = 'Deal Closed'
        const result = await db.query(
            `SELECT i.*, ep.title as equipment_title, ep.price
             FROM inquiries i
             JOIN equipment_posts ep ON i.equipment_post_id = ep.id
             WHERE i.status = 'Deal Closed' 
             AND (i.buyer_id = $1 OR i.seller_id = $1)
             ORDER BY i.created_at DESC`,
            [userId]
        );
        
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server Error' });
    }
};

const getMetrics = async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Metrics for a seller: total inquiries received vs deals closed
        const totalInquiries = await db.query(
            `SELECT COUNT(*) FROM inquiries WHERE seller_id = $1`,
            [userId]
        );
        const closedDeals = await db.query(
            `SELECT COUNT(*) FROM inquiries WHERE seller_id = $1 AND status = 'Deal Closed'`,
            [userId]
        );
        
        const total = parseInt(totalInquiries.rows[0].count) || 0;
        const closed = parseInt(closedDeals.rows[0].count) || 0;
        const conversionRatio = total > 0 ? ((closed / total) * 100).toFixed(2) + '%' : '0%';

        res.json({
            total_inquiries: total,
            closed_deals: closed,
            conversion_ratio: conversionRatio
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server Error' });
    }
};

module.exports = {
    getDealHistory,
    getMetrics
};
