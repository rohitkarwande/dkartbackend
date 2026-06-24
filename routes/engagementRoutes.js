const express = require('express');
const router = express.Router();
const engagementController = require('../controllers/engagementController');
const authMiddleware = require('../middlewares/auth');

router.use(authMiddleware);

router.get('/notifications', engagementController.getNotifications);
router.put('/notifications/:id/read', engagementController.markNotificationRead);
router.get('/recently-viewed', engagementController.getRecentlyViewed);
router.get('/suggestions', engagementController.getSuggestions);

module.exports = router;
