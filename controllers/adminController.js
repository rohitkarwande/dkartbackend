const db = require('../config/db');

// 1. Dashboard Statistics
const getDashboardStats = async (req, res) => {
    try {
        const usersCount = await db.query("SELECT COUNT(*) FROM users WHERE role = 'user'");
        const sellersCount = await db.query("SELECT COUNT(*) FROM users WHERE role = 'seller'");
        const listingsCount = await db.query("SELECT COUNT(*) FROM equipment_posts");
        const inquiriesCount = await db.query("SELECT COUNT(*) FROM inquiries WHERE status != 'Resolved' AND status != 'Closed'");
        
        res.json({
            totalUsers: parseInt(usersCount.rows[0].count, 10),
            totalSellers: parseInt(sellersCount.rows[0].count, 10),
            totalListings: parseInt(listingsCount.rows[0].count, 10),
            activeInquiries: parseInt(inquiriesCount.rows[0].count, 10)
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error fetching stats' });
    }
};

// 2. User Management
const getAllUsers = async (req, res) => {
    try {
        const result = await db.query("SELECT id, email, phone, is_verified, role, status, created_at FROM users ORDER BY created_at DESC");
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
        
        const result = await db.query("UPDATE users SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, email, status", [status, id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
        
        res.json({ message: `User status updated to ${status}`, user: result.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error updating user status' });
    }
};

// 3. Listing Moderation
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
        
        const result = await db.query("UPDATE equipment_posts SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *", [status, id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Listing not found' });
        res.json({ message: `Listing status updated to ${status}`, post: result.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error updating listing status' });
    }
};

// 4. Category Management
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
        const result = await db.query("INSERT INTO categories (name, description) VALUES ($1, $2) RETURNING *", [name, description]);
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

// 5. Inquiry Monitoring
const getAllInquiries = async (req, res) => {
    try {
        const result = await db.query("SELECT * FROM inquiries ORDER BY created_at DESC");
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error fetching inquiries' });
    }
};

module.exports = {
    getDashboardStats,
    getAllUsers,
    updateUserStatus,
    getAllListings,
    updateListingStatus,
    getCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    getAllInquiries
};
