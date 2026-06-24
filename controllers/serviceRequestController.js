const db = require('../config/db');

// 1. Create Service Request
const createServiceRequest = async (req, res) => {
    try {
        const userId = req.user.id;
        const { equipment_type, issue_description, contact_name, contact_phone, city } = req.body;

        if (!issue_description) {
            return res.status(400).json({ error: 'Issue description is required' });
        }

        const result = await db.query(
            "INSERT INTO service_requests (user_id, equipment_type, issue_description, contact_name, contact_phone, city) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
            [userId, equipment_type, issue_description, contact_name, contact_phone, city]
        );

        res.status(201).json({ message: 'Service request created', request: result.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server Error creating service request' });
    }
};

// 2. User Tracking (Get my requests)
const getMyServiceRequests = async (req, res) => {
    try {
        const userId = req.user.id;
        const result = await db.query("SELECT * FROM service_requests WHERE user_id = $1 ORDER BY created_at DESC", [userId]);
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server Error fetching service requests' });
    }
};

// 3. Admin Management
const getAllServiceRequests = async (req, res) => {
    try {
        const result = await db.query("SELECT * FROM service_requests ORDER BY created_at DESC");
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server Error fetching all service requests' });
    }
};

const updateServiceRequestStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, assigned_to } = req.body;

        if (!['Pending', 'In Progress', 'Completed', 'Rejected'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        const result = await db.query(
            "UPDATE service_requests SET status = $1, assigned_to = COALESCE($2, assigned_to), updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *",
            [status, assigned_to, id]
        );

        if (result.rows.length === 0) return res.status(404).json({ error: 'Service request not found' });

        res.json({ message: 'Service request updated', request: result.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server Error updating service request' });
    }
};

module.exports = {
    createServiceRequest,
    getMyServiceRequests,
    getAllServiceRequests,
    updateServiceRequestStatus
};
