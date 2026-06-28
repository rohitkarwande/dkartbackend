const db = require('../config/db');

/**
 * Inquiry Status Pipeline:
 *   Pending       → Buyer clicked "Contact Seller" (inquiry created)
 *   In Progress   → Chat room opened (conversation started)
 *   Deal Locked   → Seller marked the deal as locked in chat
 *   Closed        → Deal finalised (equipment marked Sold OR manual close)
 *   Closed_Lost   → Seller rejected inquiry
 */

const VALID_STATUSES = ['Pending', 'In Progress', 'Deal Locked', 'Closed', 'Closed_Lost', 'Contacted', 'Closed_Won', 'Deal Closed'];

const createInquiry = async (req, res) => {
    try {
        const buyerId = req.user.id;
        const { equipment_post_id } = req.body;

        if (!equipment_post_id) {
            return res.status(400).json({ error: 'equipment_post_id is required' });
        }

        const equipment = await db.query(`SELECT * FROM equipment_posts WHERE id = $1`, [equipment_post_id]);
        if (equipment.rows.length === 0) {
            return res.status(404).json({ error: 'Equipment not found' });
        }

        const sellerId = equipment.rows[0].seller_id;

        const inquiry = await db.query(
            `INSERT INTO inquiries (buyer_id, seller_id, equipment_post_id, status)
             VALUES ($1, $2, $3, 'Pending')
             RETURNING *`,
            [buyerId, sellerId, equipment_post_id]
        );

        // Update engagement metrics
        await db.query(
            `INSERT INTO engagement_metrics (equipment_post_id, inquiry_count)
             VALUES ($1, 1)
             ON CONFLICT (equipment_post_id)
             DO UPDATE SET inquiry_count = engagement_metrics.inquiry_count + 1, updated_at = CURRENT_TIMESTAMP`,
            [equipment_post_id]
        );

        // Track analytics event
        await db.query(
            `INSERT INTO analytics_events (user_id, event_type, equipment_post_id) VALUES ($1, 'inquiry', $2)`,
            [buyerId, equipment_post_id]
        );

        // Email seller and admin about new inquiry
        const { emailNewInquiry } = require('../services/emailService');
        emailNewInquiry(sellerId, req.user?.email || req.user?.phone, equipment.rows[0].title);

        res.status(201).json({ message: 'Inquiry created successfully', inquiry: inquiry.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server Error' });
    }
};

const getSellerInquiries = async (req, res) => {
    try {
        const sellerId = req.user.id;
        const result = await db.query(
            `SELECT i.*, 
                    ep.title as equipment_name,
                    u.email as buyer_email,
                    u.phone as buyer_phone,
                    p.first_name as buyer_first_name,
                    p.last_name as buyer_last_name
             FROM inquiries i
             LEFT JOIN equipment_posts ep ON i.equipment_post_id = ep.id
             LEFT JOIN users u ON i.buyer_id = u.id
             LEFT JOIN user_profiles p ON u.id = p.user_id
             WHERE i.seller_id = $1
             ORDER BY i.created_at DESC`,
            [sellerId]
        );
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server Error' });
    }
};

const getBuyerInquiries = async (req, res) => {
    try {
        const buyerId = req.user.id;
        const result = await db.query(
            `SELECT i.*,
                    ep.title as equipment_name,
                    ep.price,
                    u.email as seller_email,
                    u.phone as seller_phone
             FROM inquiries i
             LEFT JOIN equipment_posts ep ON i.equipment_post_id = ep.id
             LEFT JOIN users u ON i.seller_id = u.id
             WHERE i.buyer_id = $1
             ORDER BY i.created_at DESC`,
            [buyerId]
        );
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server Error' });
    }
};

const updateInquiryStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const userId = req.user.id;

        if (!VALID_STATUSES.includes(status)) {
            return res.status(400).json({ error: `Invalid status. Valid statuses: ${VALID_STATUSES.join(', ')}` });
        }

        // Only seller can lock deal or close
        const inquiry = await db.query(
            `SELECT * FROM inquiries WHERE id = $1 AND (buyer_id = $2 OR seller_id = $2)`,
            [id, userId]
        );
        if (inquiry.rows.length === 0) {
            return res.status(404).json({ error: 'Inquiry not found or access denied' });
        }

        const isSeller = inquiry.rows[0].seller_id === userId;
        if ((status === 'Deal Locked' || status === 'Closed') && !isSeller) {
            return res.status(403).json({ error: 'Only the seller can lock or close a deal' });
        }

        let extraFields = '';
        const params = [status, id];

        if (status === 'Deal Locked') {
            extraFields = ', locked_at = CURRENT_TIMESTAMP';
        } else if (status === 'Closed' || status === 'Deal Closed') {
            extraFields = ', closed_at = CURRENT_TIMESTAMP';
        }

        const result = await db.query(
            `UPDATE inquiries
             SET status = $1${extraFields}
             WHERE id = $2
             RETURNING *`,
            params
        );

        // Analytics event for deal close
        if (['Closed', 'Deal Closed', 'Deal Locked'].includes(status)) {
            await db.query(
                `INSERT INTO analytics_events (user_id, event_type, equipment_post_id) VALUES ($1, 'deal', $2)`,
                [userId, result.rows[0].equipment_post_id]
            );
        }

        // If seller locks the deal, mark the equipment as sold
        if (status === 'Deal Locked' || status === 'Closed') {
            await db.query(
                `UPDATE equipment_posts SET status = 'Sold', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
                [result.rows[0].equipment_post_id]
            );

            // Notify Admins
            const { notifyAdmins } = require('../services/adminNotificationService');
            notifyAdmins(req.io, 'DEAL_LOCKED', `A deal has been locked/closed for Equipment #${result.rows[0].equipment_post_id}`, result.rows[0].equipment_post_id);

            // Email seller, buyer, and admins about deal
            const equipmentTitleRes = await db.query('SELECT title FROM equipment_posts WHERE id = $1', [result.rows[0].equipment_post_id]);
            const equipmentTitle = equipmentTitleRes.rows[0]?.title || 'Equipment';
            const { emailDealLocked } = require('../services/emailService');
            emailDealLocked(result.rows[0].seller_id, result.rows[0].buyer_id, equipmentTitle, result.rows[0].equipment_post_id);
        }

        // Real-time notification to buyer when deal is locked
        if (status === 'Deal Locked' && req.io) {
            req.io.to(`user_${result.rows[0].buyer_id}`).emit('deal_locked', {
                inquiry_id: id,
                message: '🔒 The seller has locked the deal on this equipment. Congratulations!',
            });
        }

        res.json({ message: 'Status updated successfully', inquiry: result.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server Error' });
    }
};

const getInquiryById = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const result = await db.query(
            `SELECT i.*, ep.title as equipment_name, ep.price
             FROM inquiries i
             LEFT JOIN equipment_posts ep ON i.equipment_post_id = ep.id
             WHERE i.id = $1 AND (i.buyer_id = $2 OR i.seller_id = $2)`,
            [id, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Inquiry not found' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server Error' });
    }
};

/**
 * Admin: Platform-wide inquiry → deal funnel stats
 */
const getAdminFunnelStats = async (req, res) => {
    try {
        const { period = '30' } = req.query; // days
        const days = parseInt(period, 10) || 30;

        const [funnelRows, timelineRows, topEquipmentRows] = await Promise.all([
            // Funnel counts by status
            db.query(`
                SELECT 
                    COUNT(*) FILTER (WHERE status = 'Pending')                               AS pending,
                    COUNT(*) FILTER (WHERE status = 'In Progress')                           AS in_progress,
                    COUNT(*) FILTER (WHERE status IN ('Deal Locked', 'Closed_Won', 'Deal Closed')) AS deal_locked,
                    COUNT(*) FILTER (WHERE status IN ('Closed', 'Closed_Won', 'Deal Closed', 'Deal Locked')) AS closed,
                    COUNT(*) FILTER (WHERE status IN ('Closed_Lost'))                        AS lost,
                    COUNT(*)                                                                   AS total,
                    COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '1 day' * $1)       AS recent_total
                FROM inquiries`,
                [days]
            ),
            // Daily inquiry + deal trend for chart (last N days)
            db.query(`
                SELECT 
                    DATE_TRUNC('day', created_at) AS day,
                    COUNT(*) AS total_inquiries,
                    COUNT(*) FILTER (WHERE status IN ('Deal Locked', 'Closed', 'Closed_Won', 'Deal Closed')) AS deals
                FROM inquiries
                WHERE created_at >= NOW() - INTERVAL '1 day' * $1
                GROUP BY 1
                ORDER BY 1 ASC`,
                [days]
            ),
            // Top 5 equipment by inquiry count
            db.query(`
                SELECT 
                    ep.title,
                    ep.id,
                    COUNT(i.id) AS inquiry_count,
                    COUNT(i.id) FILTER (WHERE i.status IN ('Deal Locked', 'Closed', 'Closed_Won', 'Deal Closed')) AS deal_count
                FROM inquiries i
                JOIN equipment_posts ep ON i.equipment_post_id = ep.id
                GROUP BY ep.id, ep.title
                ORDER BY inquiry_count DESC
                LIMIT 5`
            ),
        ]);

        const f = funnelRows.rows[0];
        const total = parseInt(f.total, 10) || 0;
        const dealsClosed = parseInt(f.deal_locked, 10) || 0;
        const conversionRate = total > 0 ? ((dealsClosed / total) * 100).toFixed(1) : '0.0';

        res.json({
            funnel: {
                pending: parseInt(f.pending, 10),
                in_progress: parseInt(f.in_progress, 10),
                deal_locked: parseInt(f.deal_locked, 10),
                closed: parseInt(f.closed, 10),
                lost: parseInt(f.lost, 10),
                total,
                recent_total: parseInt(f.recent_total, 10),
                conversion_rate: conversionRate,
            },
            timeline: timelineRows.rows.map(r => ({
                day: r.day,
                total_inquiries: parseInt(r.total_inquiries, 10),
                deals: parseInt(r.deals, 10),
            })),
            top_equipment: topEquipmentRows.rows.map(r => ({
                id: r.id,
                title: r.title,
                inquiry_count: parseInt(r.inquiry_count, 10),
                deal_count: parseInt(r.deal_count, 10),
                conversion: r.inquiry_count > 0
                    ? ((r.deal_count / r.inquiry_count) * 100).toFixed(0) + '%'
                    : '0%',
            })),
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error fetching funnel stats' });
    }
};

module.exports = {
    createInquiry,
    getSellerInquiries,
    updateInquiryStatus,
    getBuyerInquiries,
    getInquiryById,
    getAdminFunnelStats,
};