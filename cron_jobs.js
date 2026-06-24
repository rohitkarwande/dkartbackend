const cron = require('node-cron');
const db = require('./config/db');
const { sendNotification } = require('./services/notificationService');

// Expiry Alerts: Check every day at midnight for active listings older than 25 days
cron.schedule('0 0 * * *', async () => {
    console.log('Running daily expiry check cron job...');
    try {
        const result = await db.query(`
            SELECT id, seller_id, title 
            FROM equipment_posts 
            WHERE status = 'Active' 
            AND created_at <= NOW() - INTERVAL '25 days'
            AND created_at > NOW() - INTERVAL '26 days'
        `);
        
        for (const post of result.rows) {
            await sendNotification(
                post.seller_id, 
                'Listing Expiry Alert', 
                `Your listing "${post.title}" is expiring soon. Please renew it to keep it active.`, 
                post.id
            );
        }
    } catch (error) {
        console.error('Error in expiry cron job:', error);
    }
});

module.exports = cron;
