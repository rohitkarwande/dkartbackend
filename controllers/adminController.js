const db = require('../config/db');

// ─────────────────────────────────────────────────────────────
// 1. Dashboard Statistics (enhanced)
// ─────────────────────────────────────────────────────────────
const getDashboardStats = async (req, res) => {
    try {
        const [usersCount, sellersCount, listingsCount, inquiriesCount, pendingKycCount, totalRevenueRows, professionRows] =
            await Promise.all([
                db.query("SELECT COUNT(*) FROM users WHERE role = 'user' OR role = 'buyer'"),
                db.query("SELECT COUNT(*) FROM users WHERE role = 'seller'"),
                db.query("SELECT COUNT(*) FROM equipment_posts"),
                db.query("SELECT COUNT(*) FROM inquiries WHERE status != 'Resolved' AND status != 'Closed'"),
                db.query("SELECT COUNT(*) FROM kyc_documents WHERE status = 'Pending'"),
                db.query("SELECT COUNT(*) FROM kyc_documents WHERE status = 'Approved'"),
                db.query("SELECT profession, COUNT(*) FROM user_profiles WHERE profession IS NOT NULL GROUP BY profession"),
            ]);
        
        const professions = professionRows.rows.reduce((acc, row) => {
            acc[row.profession] = parseInt(row.count, 10);
            return acc;
        }, {});

        res.json({
            totalUsers: parseInt(usersCount.rows[0].count, 10),
            totalSellers: parseInt(sellersCount.rows[0].count, 10),
            totalListings: parseInt(listingsCount.rows[0].count, 10),
            activeInquiries: parseInt(inquiriesCount.rows[0].count, 10),
            pendingKyc: parseInt(pendingKycCount.rows[0].count, 10),
            approvedKyc: parseInt(totalRevenueRows.rows[0].count, 10),
            professions,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error fetching stats' });
    }
};

// ─────────────────────────────────────────────────────────────
// 2. User Management
// ─────────────────────────────────────────────────────────────
const getAllUsers = async (req, res) => {
    try {
        const { search, role, status } = req.query;
        let query = `
            SELECT u.id, u.email, u.phone, u.is_verified, u.role, u.status, u.created_at,
                   p.first_name, p.last_name, p.company_name,
                   k.status AS kyc_status, k.document_type
            FROM users u
            LEFT JOIN user_profiles p ON u.id = p.user_id
            LEFT JOIN kyc_documents k ON u.id = k.user_id
            WHERE 1=1
        `;
        const params = [];

        if (search) {
            params.push(`%${search}%`);
            query += ` AND (u.email ILIKE $${params.length} OR u.phone ILIKE $${params.length} OR p.first_name ILIKE $${params.length} OR p.company_name ILIKE $${params.length})`;
        }
        if (role) {
            params.push(role);
            query += ` AND u.role = $${params.length}`;
        }
        if (status) {
            params.push(status);
            query += ` AND u.status = $${params.length}`;
        }
        query += ' ORDER BY u.created_at DESC';

        const result = await db.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error fetching users' });
    }
};

const updateUserStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        if (!['Active', 'Blocked', 'Suspended'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }
        const result = await db.query(
            "UPDATE users SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, email, status",
            [status, id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
        res.json({ message: `User status updated to ${status}`, user: result.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error updating user status' });
    }
};

const suspendUser = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await db.query(
            "UPDATE users SET status = 'Suspended', updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING id, email, status",
            [id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
        res.json({ message: 'User suspended successfully', user: result.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error suspending user' });
    }
};

const reactivateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await db.query(
            "UPDATE users SET status = 'Active', updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING id, email, status",
            [id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
        res.json({ message: 'User reactivated successfully', user: result.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error reactivating user' });
    }
};

// ─────────────────────────────────────────────────────────────
// 3. Listing Moderation
// ─────────────────────────────────────────────────────────────
const getAllListings = async (req, res) => {
    try {
        const result = await db.query("SELECT * FROM equipment_posts ORDER BY created_at DESC");
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error fetching listings' });
    }
};

const updateListingStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const result = await db.query(
            "UPDATE equipment_posts SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *",
            [status, id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Listing not found' });
        res.json({ message: `Listing status updated to ${status}`, post: result.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error updating listing status' });
    }
};

// ─────────────────────────────────────────────────────────────
// 4. Category Management
// ─────────────────────────────────────────────────────────────
const getCategories = async (req, res) => {
    try {
        const result = await db.query("SELECT * FROM categories ORDER BY name ASC");
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error fetching categories' });
    }
};

const createCategory = async (req, res) => {
    try {
        const { name, description } = req.body;
        if (!name) return res.status(400).json({ error: 'Category name required' });
        const result = await db.query(
            "INSERT INTO categories (name, description) VALUES ($1, $2) RETURNING *",
            [name, description]
        );
        res.status(201).json({ message: 'Category created', category: result.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error creating category' });
    }
};

const updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, is_active } = req.body;
        const result = await db.query(
            "UPDATE categories SET name = COALESCE($1, name), description = COALESCE($2, description), is_active = COALESCE($3, is_active) WHERE id = $4 RETURNING *",
            [name, description, is_active, id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Category not found' });
        res.json({ message: 'Category updated', category: result.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error updating category' });
    }
};

const deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await db.query("DELETE FROM categories WHERE id = $1 RETURNING *", [id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Category not found' });
        res.json({ message: 'Category deleted' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error deleting category' });
    }
};

// ─────────────────────────────────────────────────────────────
// 5. Inquiry Monitoring
// ─────────────────────────────────────────────────────────────
const getAllInquiries = async (req, res) => {
    try {
        const result = await db.query("SELECT * FROM inquiries ORDER BY created_at DESC");
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error fetching inquiries' });
    }
};

// ─────────────────────────────────────────────────────────────
// 6. KYC Management
// ─────────────────────────────────────────────────────────────
const getPendingKycApplications = async (req, res) => {
    try {
        const { status = 'all', search } = req.query;
        let query = `
            SELECT 
                k.id AS kyc_id,
                k.user_id,
                k.document_type,
                k.document_url,
                k.document_file_url,
                k.status AS kyc_status,
                k.rejection_reason,
                k.submitted_at,
                k.reviewed_at,
                k.reviewed_by,
                u.email,
                u.phone,
                u.role,
                u.status AS user_status,
                u.created_at AS user_created_at,
                p.first_name,
                p.last_name,
                p.company_name
            FROM kyc_documents k
            JOIN users u ON k.user_id = u.id
            LEFT JOIN user_profiles p ON u.id = p.user_id
            WHERE 1=1
        `;
        const params = [];

        if (status !== 'all') {
            params.push(status);
            query += ` AND k.status = $${params.length}`;
        }
        if (search) {
            params.push(`%${search}%`);
            query += ` AND (u.email ILIKE $${params.length} OR u.phone ILIKE $${params.length} OR p.first_name ILIKE $${params.length} OR p.company_name ILIKE $${params.length} OR k.document_type ILIKE $${params.length})`;
        }

        query += ' ORDER BY k.submitted_at DESC';

        const result = await db.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error fetching KYC applications' });
    }
};

const getKycDetails = async (req, res) => {
    try {
        const { userId } = req.params;
        const result = await db.query(
            `SELECT 
                k.*,
                u.email,
                u.phone,
                u.role,
                u.status AS user_status,
                u.created_at AS user_created_at,
                p.first_name,
                p.last_name,
                p.company_name,
                p.bio
            FROM kyc_documents k
            JOIN users u ON k.user_id = u.id
            LEFT JOIN user_profiles p ON u.id = p.user_id
            WHERE k.user_id = $1`,
            [userId]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'KYC application not found' });
        res.json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error fetching KYC details' });
    }
};

const approveKyc = async (req, res) => {
    const client = await db.pool.connect();
    try {
        const { userId } = req.params;
        const adminId = req.user.id;

        await client.query('BEGIN');

        // 1. Update KYC status
        const kycResult = await client.query(
            `UPDATE kyc_documents 
             SET status = 'Approved', reviewed_at = CURRENT_TIMESTAMP, reviewed_by = $1, rejection_reason = NULL
             WHERE user_id = $2 
             RETURNING *`,
            [adminId, userId]
        );
        if (kycResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'KYC application not found' });
        }

        // 2. Promote user role to seller
        await client.query(
            "UPDATE users SET role = 'seller', updated_at = CURRENT_TIMESTAMP WHERE id = $1",
            [userId]
        );

        // 3. Create a notification for the user
        await client.query(
            `INSERT INTO notifications (user_id, type, message, reference_id)
             VALUES ($1, 'KYC_APPROVED', 'Congratulations! Your Seller account has been approved. You can now list equipment on DKart.', $2)`,
            [userId, kycResult.rows[0].id]
        );

        await client.query('COMMIT');

        // 4. Emit real-time socket event to the user's room
        if (req.io) {
            req.io.to(`user_${userId}`).emit('role_updated', {
                role: 'seller',
                message: '🎉 Congratulations! Your Seller account has been approved. You can now list equipment on DKart.',
            });
        }

        res.json({ message: `User ${userId} approved as seller`, kyc: kycResult.rows[0] });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error(error);
        res.status(500).json({ error: 'Server error approving KYC' });
    } finally {
        client.release();
    }
};

const rejectKyc = async (req, res) => {
    const client = await db.pool.connect();
    try {
        const { userId } = req.params;
        const { reason } = req.body;
        const adminId = req.user.id;

        if (!reason || !reason.trim()) {
            return res.status(400).json({ error: 'Rejection reason is required' });
        }

        await client.query('BEGIN');

        // 1. Update KYC status with reason
        const kycResult = await client.query(
            `UPDATE kyc_documents 
             SET status = 'Rejected', reviewed_at = CURRENT_TIMESTAMP, reviewed_by = $1, rejection_reason = $2
             WHERE user_id = $3 
             RETURNING *`,
            [adminId, reason.trim(), userId]
        );
        if (kycResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'KYC application not found' });
        }

        // 2. Keep user role as 'user'/'buyer' — no role change

        // 3. Create a notification for the user
        await client.query(
            `INSERT INTO notifications (user_id, type, message, reference_id)
             VALUES ($1, 'KYC_REJECTED', $2, $3)`,
            [userId, `Your seller application was not approved. Reason: ${reason.trim()}. You may reapply after making corrections.`, kycResult.rows[0].id]
        );

        await client.query('COMMIT');

        // 4. Emit real-time socket event to the user's room
        if (req.io) {
            req.io.to(`user_${userId}`).emit('role_updated', {
                role: null,
                kycStatus: 'Rejected',
                message: `Your seller application was not approved. Reason: ${reason.trim()}`,
            });
        }

        res.json({ message: `KYC application for user ${userId} rejected`, kyc: kycResult.rows[0] });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error(error);
        res.status(500).json({ error: 'Server error rejecting KYC' });
    } finally {
        client.release();
    }
};

// ─────────────────────────────────────────────────────────────
// Reports Export
// ─────────────────────────────────────────────────────────────
const generateCSV = (data) => {
    if (!data || data.length === 0) return '';
    const headers = Object.keys(data[0]);
    const escapeCsv = (str) => {
        if (str === null || str === undefined) return '';
        const s = String(str);
        if (s.includes('"') || s.includes(',') || s.includes('\n')) {
            return `"${s.replace(/"/g, '""')}"`;
        }
        return s;
    };
    const csvRows = [headers.join(',')];
    for (const row of data) {
        csvRows.push(headers.map(header => escapeCsv(row[header])).join(','));
    }
    return csvRows.join('\n');
};

const getReportCsv = async (req, res) => {
    try {
        const { type } = req.query;
        let query = '';
        let filename = 'report.csv';
        let data = [];

        if (type === 'summary') {
            const [usersCount, sellersCount, listingsCount, inquiriesCount, pendingKycCount, approvedKycCount] =
                await Promise.all([
                    db.query("SELECT COUNT(*) FROM users WHERE role = 'user' OR role = 'buyer'"),
                    db.query("SELECT COUNT(*) FROM users WHERE role = 'seller'"),
                    db.query("SELECT COUNT(*) FROM equipment_posts"),
                    db.query("SELECT COUNT(*) FROM inquiries WHERE status != 'Resolved' AND status != 'Closed'"),
                    db.query("SELECT COUNT(*) FROM kyc_documents WHERE status = 'Pending'"),
                    db.query("SELECT COUNT(*) FROM kyc_documents WHERE status = 'Approved'"),
                ]);
            data = [{
                total_buyers: usersCount.rows[0].count,
                total_sellers: sellersCount.rows[0].count,
                total_listings: listingsCount.rows[0].count,
                active_inquiries: inquiriesCount.rows[0].count,
                pending_kyc: pendingKycCount.rows[0].count,
                approved_kyc: approvedKycCount.rows[0].count,
                exported_at: new Date().toISOString()
            }];
            filename = 'dashboard_summary.csv';
        } else if (type === 'buyers') {
            const result = await db.query(`
                SELECT u.id, u.email, u.phone, u.status, u.created_at, p.first_name, p.last_name 
                FROM users u 
                LEFT JOIN user_profiles p ON u.id = p.user_id 
                WHERE u.role IN ('user', 'buyer')
                ORDER BY u.created_at DESC
            `);
            data = result.rows;
            filename = 'buyers_list.csv';
        } else if (type === 'sellers') {
            const result = await db.query(`
                SELECT u.id, u.email, u.phone, u.status, u.created_at, p.first_name, p.last_name, p.company_name 
                FROM users u 
                LEFT JOIN user_profiles p ON u.id = p.user_id 
                WHERE u.role = 'seller'
                ORDER BY u.created_at DESC
            `);
            data = result.rows;
            filename = 'sellers_list.csv';
        } else if (type === 'kyc') {
            const result = await db.query(`
                SELECT k.id, k.user_id, u.email, k.document_type, k.status, k.submitted_at, k.reviewed_at 
                FROM kyc_documents k 
                JOIN users u ON k.user_id = u.id 
                ORDER BY k.submitted_at DESC
            `);
            data = result.rows;
            filename = 'kyc_applications.csv';
        } else {
            return res.status(400).json({ error: 'Invalid report type' });
        }

        const csvString = generateCSV(data);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(csvString);
    } catch (error) {
        console.error('Error generating CSV report:', error);
        res.status(500).json({ error: 'Server error generating report' });
    }
};

module.exports = {
    getDashboardStats,
    getAllUsers,
    updateUserStatus,
    suspendUser,
    reactivateUser,
    getAllListings,
    updateListingStatus,
    getCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    getAllInquiries,
    getPendingKycApplications,
    getKycDetails,
    approveKyc,
    rejectKyc,
    getReportCsv,
};

// ─────────────────────────────────────────────────────────────
// 7. Admin Notifications
// ─────────────────────────────────────────────────────────────
const getAdminNotifications = async (req, res) => {
    try {
        const adminId = req.user.id;
        const result = await db.query(
            "SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50",
            [adminId]
        );
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error fetching notifications' });
    }
};

const markNotificationRead = async (req, res) => {
    try {
        const adminId = req.user.id;
        const { id } = req.params;
        const result = await db.query(
            "UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2 RETURNING *",
            [id, adminId]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Notification not found' });
        res.json({ message: 'Notification marked as read', notification: result.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error marking notification as read' });
    }
};

module.exports.getAdminNotifications = getAdminNotifications;
module.exports.markNotificationRead = markNotificationRead;

// ─────────────────────────────────────────────────────────────
// 8. Security & IP Tracking
// ─────────────────────────────────────────────────────────────
const getLoginHistory = async (req, res) => {
    try {
        const { search } = req.query;
        let query = `
            SELECT lh.*, u.email, u.phone, u.role
            FROM login_history lh
            JOIN users u ON lh.user_id = u.id
        `;
        const params = [];
        if (search) {
            params.push(`%${search}%`);
            query += ` WHERE u.email ILIKE $1 OR u.phone ILIKE $1 OR lh.ip_address ILIKE $1`;
        }
        query += ` ORDER BY lh.created_at DESC LIMIT 100`;

        const result = await db.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error fetching login history' });
    }
};

const getIpBlacklist = async (req, res) => {
    try {
        const result = await db.query("SELECT * FROM ip_blacklist ORDER BY created_at DESC");
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error fetching IP blacklist' });
    }
};

const addIpToBlacklist = async (req, res) => {
    try {
        const { ip_address, reason } = req.body;
        if (!ip_address) return res.status(400).json({ error: 'IP address is required' });
        
        const result = await db.query(
            "INSERT INTO ip_blacklist (ip_address, reason) VALUES ($1, $2) ON CONFLICT (ip_address) DO UPDATE SET reason = $2 RETURNING *",
            [ip_address, reason || 'Manually blacklisted by admin']
        );
        res.status(201).json({ message: 'IP added to blacklist', record: result.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error adding IP to blacklist' });
    }
};

const removeIpFromBlacklist = async (req, res) => {
    try {
        const { ip } = req.params;
        const result = await db.query("DELETE FROM ip_blacklist WHERE ip_address = $1 RETURNING *", [ip]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'IP not found in blacklist' });
        res.json({ message: 'IP removed from blacklist', record: result.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error removing IP from blacklist' });
    }
};

module.exports.getLoginHistory = getLoginHistory;
module.exports.getIpBlacklist = getIpBlacklist;
module.exports.addIpToBlacklist = addIpToBlacklist;
module.exports.removeIpFromBlacklist = removeIpFromBlacklist;
