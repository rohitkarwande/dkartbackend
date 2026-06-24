const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middlewares/auth');
const isAdmin = require('../middlewares/role');

// All admin routes must be protected
router.use(authMiddleware, isAdmin);

// 1. Dashboard Statistics
router.get('/dashboard', adminController.getDashboardStats);

// 2. User Management
router.get('/users', adminController.getAllUsers);
router.patch('/users/:id/status', adminController.updateUserStatus);

// 3. Listing Moderation
router.get('/listings', adminController.getAllListings);
router.patch('/listings/:id/status', adminController.updateListingStatus);

// 4. Category Management
router.get('/categories', adminController.getCategories);
router.post('/categories', adminController.createCategory);
router.put('/categories/:id', adminController.updateCategory);
router.delete('/categories/:id', adminController.deleteCategory);

// 5. Inquiry Monitoring
router.get('/inquiries', adminController.getAllInquiries);

module.exports = router;
