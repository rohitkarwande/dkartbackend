const db = require('../config/db');
const { sendTransactionalEmail } = require('../config/email');

const sendNotification = async (userId, type, message, referenceId = null) => {
    try {
        await db.query(
            "INSERT INTO notifications (user_id, type, message, reference_id) VALUES ($1, $2, $3, $4)",
            [userId, type, message, referenceId]
        );
        
        // Retrieve user email to send transactional email
        const userResult = await db.query("SELECT email FROM users WHERE id = $1", [userId]);
        if (userResult.rows.length > 0 && userResult.rows[0].email) {
            if (sendTransactionalEmail) {
                await sendTransactionalEmail(userResult.rows[0].email, type, message);
            }
        }
    } catch (error) {
        console.error('Error sending notification:', error);
    }
};

module.exports = { sendNotification };
