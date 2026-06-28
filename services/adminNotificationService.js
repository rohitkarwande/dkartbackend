const db = require('../config/db');

/**
 * Sends a notification to all admin users and emits a real-time socket event.
 * @param {Object} io - Socket.io instance
 * @param {string} type - Type of notification (e.g., 'NEW_USER', 'DEAL_LOCKED')
 * @param {string} message - Notification text
 * @param {string|number} referenceId - Optional reference ID (e.g., user ID, inquiry ID)
 */
const notifyAdmins = async (io, type, message, referenceId = null) => {
    try {
        // Find all admin IDs
        const adminsResult = await db.query("SELECT id FROM users WHERE role = 'admin'");
        const adminIds = adminsResult.rows.map(row => row.id);

        if (adminIds.length === 0) return;

        // Insert notifications for each admin
        const values = [];
        const params = [];
        let paramIndex = 1;

        adminIds.forEach(adminId => {
            values.push(`($${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++})`);
            params.push(adminId, type, message, referenceId);
        });

        if (values.length > 0) {
            const query = `
                INSERT INTO notifications (user_id, type, message, reference_id)
                VALUES ${values.join(', ')}
                RETURNING *
            `;
            const inserted = await db.query(query, params);

            // Emit real-time event to the 'admin_room'
            if (io) {
                // Get the first inserted notification as they all have the same content
                const notif = inserted.rows[0];
                io.to('admin_room').emit('admin_notification', {
                    id: notif.id,
                    type: notif.type,
                    message: notif.message,
                    reference_id: notif.reference_id,
                    is_read: false,
                    created_at: notif.created_at
                });
            }
        }
    } catch (error) {
        console.error('Error in notifyAdmins service:', error);
    }
};

module.exports = {
    notifyAdmins
};
