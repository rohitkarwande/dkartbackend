const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth');
const dealController = require('../controllers/dealController');

router.get('/history', authMiddleware, dealController.getDealHistory);
router.get('/metrics', authMiddleware, dealController.getMetrics);

module.exports = router;
