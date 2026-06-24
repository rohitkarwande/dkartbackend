const db = require('../config/db');

const createRoom = async (req, res) => {
    try {
        const { inquiry_id } = req.body;

        const room = await db.query(
            `INSERT INTO chat_rooms (inquiry_id)
             VALUES ($1)
             RETURNING *`,
            [inquiry_id]
        );

        res.status(201).json({
            message: 'Chat room created',
            room: room.rows[0]
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: 'Server Error'
        });
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

        res.status(201).json({
            message: 'Message sent',
            data: result.rows[0]
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
            `SELECT cr.*, i.equipment_post_id, i.buyer_id, i.seller_id
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