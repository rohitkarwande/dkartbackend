const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const authMiddleware = require('../middlewares/auth');
const isAdmin = require('../middlewares/role');

// Advanced Analytics - Admin only
router.use(authMiddleware, isAdmin);

router.get('/demand', analyticsController.getDemandReports);
router.get('/geographic', analyticsController.getGeographicAnalytics);
router.get('/trending', analyticsController.getTrendingEquipment);
router.get('/funnel', analyticsController.getConversionFunnel);

module.exports = router;
