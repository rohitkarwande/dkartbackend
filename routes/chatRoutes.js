const express = require('express');
const router = express.Router();

const authMiddleware = require('../middlewares/auth');
const chatController = require('../controllers/chatController');

router.post(
    '/rooms',
    authMiddleware,
    chatController.createRoom
);

router.get(
    '/rooms/:id/messages',
    authMiddleware,
    chatController.getMessages
);

router.post(
    '/rooms/:id/messages',
    authMiddleware,
    chatController.sendMessage
);

router.get(
    '/rooms',
    authMiddleware,
    chatController.getRooms
);

router.put(
    '/messages/:messageId/read',
    authMiddleware,
    chatController.markMessageAsRead
);

module.exports = router;