const express = require('express');
const router = express.Router();
const serviceRequestController = require('../controllers/serviceRequestController');
const authMiddleware = require('../middlewares/auth');
const isAdmin = require('../middlewares/role');

// User routes
router.post('/', authMiddleware, serviceRequestController.createServiceRequest);
router.get('/my-requests', authMiddleware, serviceRequestController.getMyServiceRequests);

// Admin routes
router.get('/admin/all', authMiddleware, isAdmin, serviceRequestController.getAllServiceRequests);
router.patch('/admin/:id/status', authMiddleware, isAdmin, serviceRequestController.updateServiceRequestStatus);

module.exports = router;
