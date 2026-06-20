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
module.exports = {
    createRoom,
     getMessages,
    sendMessage
};