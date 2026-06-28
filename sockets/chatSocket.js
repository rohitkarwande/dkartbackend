const jwt = require('jsonwebtoken');
const db = require('../config/db');

module.exports = (io) => {
    // ── Socket Authentication Middleware ─────────────────────────────────────
    io.use((socket, next) => {
        const token = socket.handshake.auth.token;
        if (!token) {
            return next(new Error('Authentication error: No token provided'));
        }
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            socket.user = decoded;
            next();
        } catch (err) {
            next(new Error('Authentication error: Invalid token'));
        }
    });

    io.on('connection', (socket) => {
        console.log(`User connected: ${socket.user.id} (Socket ID: ${socket.id})`);

        // ── Per-User Room (for real-time role/notification updates) ──────────
        // Every user automatically joins their own private room on connect.
        // Admin controllers call: io.to(`user_${userId}`).emit('role_updated', ...)
        socket.join(`user_${socket.user.id}`);

        // Fetch latest role from DB to avoid stale JWT issues
        db.query("SELECT role FROM users WHERE id = $1", [socket.user.id])
            .then(result => {
                if (result.rows.length > 0 && result.rows[0].role === 'admin') {
                    socket.join('admin_room');
                    console.log(`Admin ${socket.user.id} joined admin_room`);
                }
            })
            .catch(err => console.error("Error fetching user role for socket:", err));

        // ── Chat: Join a chat room ───────────────────────────────────────────
        socket.on('join_room', (roomId) => {
            // Check if user is part of this room (for security)
            db.query(
                `SELECT * FROM chat_rooms cr
                 JOIN inquiries i ON cr.inquiry_id = i.id
                 WHERE cr.id = $1 AND (i.buyer_id = $2 OR i.seller_id = $2)`,
                [roomId, socket.user.id]
            ).then(result => {
                if (result.rows.length > 0) {
                    socket.join(`room_${roomId}`);
                    console.log(`User ${socket.user.id} joined room_${roomId}`);
                }
            }).catch(err => console.error("Error joining room:", err));
        });

        // ── Chat: Leave a chat room ──────────────────────────────────────────
        socket.on('leave_room', (roomId) => {
            socket.leave(`room_${roomId}`);
            console.log(`User ${socket.user.id} left room_${roomId}`);
        });

        // ── Chat: Send a message ─────────────────────────────────────────────
        socket.on('send_message', async (data) => {
            try {
                const { roomId, message } = data;

                // Save to database
                const result = await db.query(
                    `INSERT INTO messages (room_id, sender_id, message)
                     VALUES ($1, $2, $3)
                     RETURNING *`,
                    [roomId, socket.user.id, message]
                );

                const savedMessage = result.rows[0];

                // Broadcast to all users in the room
                io.to(`room_${roomId}`).emit('receive_message', savedMessage);
            } catch (error) {
                console.error("Error sending message via socket:", error);
                socket.emit('error', 'Could not send message');
            }
        });

        socket.on('disconnect', () => {
            console.log(`User disconnected: ${socket.user.id}`);
        });
    });
};
