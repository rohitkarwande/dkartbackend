const db = require('../config/db');

const createInquiry = async (req, res) => {
    try {
        const buyerId = req.user.id;
        console.log("createInquiry req.body:", req.body);
        const { equipment_post_id } = req.body;

        if (!equipment_post_id) {
            return res.status(400).json({
                error: 'equipment_post_id is required'
            });
        }

        const equipment = await db.query(
            `SELECT * FROM equipment_posts WHERE id = $1`,
            [equipment_post_id]
        );

        if (equipment.rows.length === 0) {
            return res.status(404).json({
                error: 'Equipment not found'
            });
        }

        const sellerId = equipment.rows[0].seller_id;

        const inquiry = await db.query(
            `INSERT INTO inquiries
            (buyer_id, seller_id, equipment_post_id)
            VALUES ($1,$2,$3)
            RETURNING *`,
            [buyerId, sellerId, equipment_post_id]
        );

        await db.query(
            `INSERT INTO engagement_metrics (equipment_post_id, inquiry_count)
             VALUES ($1, 1)
             ON CONFLICT (equipment_post_id)
             DO UPDATE SET inquiry_count = engagement_metrics.inquiry_count + 1, updated_at = CURRENT_TIMESTAMP`,
            [equipment_post_id]
        );

        // Track inquiry analytics
        await db.query(`INSERT INTO analytics_events (user_id, event_type, equipment_post_id) VALUES ($1, 'inquiry', $2)`, [buyerId, equipment_post_id]);

        res.status(201).json({
            message: 'Inquiry created successfully',
            inquiry: inquiry.rows[0]
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: 'Server Error'
        });
    }
};
 
const getSellerInquiries = async (req, res) => {
    try {
        const sellerId = req.user.id;

        const result = await db.query(
            `SELECT *
             FROM inquiries
             WHERE seller_id = $1
             ORDER BY created_at DESC`,
            [sellerId]
        );

        res.json(result.rows);

    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: 'Server Error'
        });
    }
}; 

const updateInquiryStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const result = await db.query(
            `UPDATE inquiries
             SET status = $1
             WHERE id = $2
             RETURNING *`,
            [status, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: 'Inquiry not found'
            });
        }

        if (status === 'Deal Closed') {
            const inquiry = result.rows[0];
            await db.query(`INSERT INTO analytics_events (user_id, event_type, equipment_post_id) VALUES ($1, 'deal', $2)`, [inquiry.buyer_id, inquiry.equipment_post_id]);
        }

        res.json({
            message: 'Status updated successfully',
            inquiry: result.rows[0]
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: 'Server Error'
        });
    }
};

const getBuyerInquiries = async (req, res) => {
    try {
        const buyerId = req.user.id;

        const result = await db.query(
            `SELECT *
             FROM inquiries
             WHERE buyer_id = $1
             ORDER BY created_at DESC`,
            [buyerId]
        );

        res.json(result.rows);

    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: 'Server Error'
        });
    }
};

const getInquiryById = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const result = await db.query(
            `SELECT * FROM inquiries 
             WHERE id = $1 AND (buyer_id = $2 OR seller_id = $2)`,
            [id, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: 'Inquiry not found'
            });
        }

        res.json(result.rows[0]);

    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: 'Server Error'
        });
    }
};
module.exports = {
    createInquiry,
    getSellerInquiries,
    updateInquiryStatus,
    getBuyerInquiries,
    getInquiryById
};