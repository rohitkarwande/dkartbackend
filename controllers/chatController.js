const db = require('../config/db');

const createRoom = async (req, res) => {
    try {
        const { inquiry_id } = req.body;

        // Check if room already exists
        const existingRoom = await db.query(
            `SELECT * FROM chat_rooms WHERE inquiry_id = $1`,
            [inquiry_id]
        );

        if (existingRoom.rows.length > 0) {
            return res.status(200).json({
                message: 'Chat room already exists',
                room: existingRoom.rows[0]
            });
        }

        const room = await db.query(
            `INSERT INTO chat_rooms (inquiry_id) VALUES ($1) RETURNING *`,
            [inquiry_id]
        );

        // Auto-advance inquiry status to 'In Progress' when chat room opens
        await db.query(
            `UPDATE inquiries SET status = 'In Progress' WHERE id = $1 AND status = 'Pending'`,
            [inquiry_id]
        );

        // Notify Admins
        const { notifyAdmins } = require('../services/adminNotificationService');
        notifyAdmins(req.io, 'NEW_CHAT_ROOM', `A new chat room was created for Inquiry #${inquiry_id}`, inquiry_id);

        res.status(201).json({ message: 'Chat room created', room: room.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server Error' });
    }
};
 const getMessages = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await db.query(
            `SELECT *
             FROM messages
             WHERE room_id = $1
             ORDER BY created_at ASC`,
            [id]
        );

        res.json(result.rows);

    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: 'Server Error'
        });
    }
};

const sendMessage = async (req, res) => {
    try {
        const { id } = req.params;
        const { message } = req.body;

        const result = await db.query(
            `INSERT INTO messages
             (room_id, sender_id, message)
             VALUES ($1, $2, $3)
             RETURNING *`,
            [id, req.user.id, message]
        );

        const savedMessage = result.rows[0];

        // Broadcast to socket room
        if (req.io) {
            req.io.to(`room_${id}`).emit('receive_message', savedMessage);
        }

        // Email the OTHER participant in this chat room (not the sender)
        try {
            const roomInfo = await db.query(
                `SELECT i.buyer_id, i.seller_id, ep.title as equipment_title,
                        sender.email as sender_email,
                        COALESCE(sp.first_name, sender.email, sender.phone) as sender_name
                 FROM chat_rooms cr
                 JOIN inquiries i ON cr.inquiry_id = i.id
                 JOIN equipment_posts ep ON i.equipment_post_id = ep.id
                 JOIN users sender ON sender.id = $2
                 LEFT JOIN user_profiles sp ON sp.user_id = $2
                 WHERE cr.id = $1`,
                [id, req.user.id]
            );
            if (roomInfo.rows.length > 0) {
                const { buyer_id, seller_id, equipment_title, sender_name } = roomInfo.rows[0];
                const recipientId = req.user.id === buyer_id ? seller_id : buyer_id;
                const { emailNewMessage } = require('../services/emailService');
                emailNewMessage(recipientId, sender_name || 'A DKart user', message, equipment_title);
            }
        } catch (emailErr) {
            console.error('Failed to send message notification email:', emailErr);
        }

        res.status(201).json({
            message: 'Message sent',
            data: savedMessage
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: 'Server Error'
        });
    }
};

const getRooms = async (req, res) => {
    try {
        const userId = req.user.id;
        
        const result = await db.query(
            `SELECT cr.*, i.equipment_post_id, i.buyer_id, i.seller_id, i.status as inquiry_status
             FROM chat_rooms cr
             JOIN inquiries i ON cr.inquiry_id = i.id
             WHERE i.buyer_id = $1 OR i.seller_id = $1
             ORDER BY cr.created_at DESC`,
            [userId]
        );
        
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server Error' });
    }
};

const markMessageAsRead = async (req, res) => {
    try {
        const { messageId } = req.params;

        const result = await db.query(
            `UPDATE messages
             SET is_read = true
             WHERE id = $1 AND sender_id != $2
             RETURNING *`,
            [messageId, req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Message not found or not authorized to mark as read' });
        }

        res.json({ message: 'Message marked as read', data: result.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server Error' });
    }
};
module.exports = {
    createRoom,
    getMessages,
    sendMessage,
    getRooms,
    markMessageAsRead
};