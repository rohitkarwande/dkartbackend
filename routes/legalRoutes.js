const express = require('express');
const router = express.Router();
const legalController = require('../controllers/legalController');
const authMiddleware = require('../middlewares/auth');
const isAdmin = require('../middlewares/role');

// User routes
router.post('/', authMiddleware, legalController.submitLegalQuery);
router.get('/my-queries', authMiddleware, legalController.getMyLegalQueries);

// Admin routes
router.get('/admin/all', authMiddleware, isAdmin, legalController.getAllLegalQueries);
router.patch('/admin/:id/status', authMiddleware, isAdmin, legalController.updateLegalQueryStatus);

module.exports = router;
