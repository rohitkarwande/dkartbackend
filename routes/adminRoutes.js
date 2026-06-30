const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middlewares/auth');
const { isAdmin } = require('../middlewares/role');
const auditLog = require('../middlewares/auditLog');

// All admin routes must be protected
router.use(authMiddleware, isAdmin);

// 1. Dashboard Statistics
router.get('/dashboard', adminController.getDashboardStats);

// 1.5 Reports
router.get('/reports/csv', auditLog('EXPORT_CSV', 'report'), adminController.getReportCsv);

// 2. User Management
router.get('/users', adminController.getAllUsers);
router.patch('/users/:id/status', auditLog('UPDATE_USER_STATUS', 'user'), adminController.updateUserStatus);
router.patch('/users/:id/suspend', auditLog('SUSPEND_USER', 'user'), adminController.suspendUser);
router.patch('/users/:id/reactivate', auditLog('REACTIVATE_USER', 'user'), adminController.reactivateUser);

// 3. Listing Moderation
router.get('/listings', adminController.getAllListings);
router.patch('/listings/:id/status', auditLog('UPDATE_LISTING_STATUS', 'listing'), adminController.updateListingStatus);

// 4. Category Management
router.get('/categories', adminController.getCategories);
router.post('/categories', auditLog('CREATE_CATEGORY', 'category'), adminController.createCategory);
router.put('/categories/:id', auditLog('UPDATE_CATEGORY', 'category'), adminController.updateCategory);
router.delete('/categories/:id', auditLog('DELETE_CATEGORY', 'category'), adminController.deleteCategory);

// 5. Inquiry Monitoring
router.get('/inquiries', adminController.getAllInquiries);

// 6. KYC Management
router.get('/kyc', adminController.getPendingKycApplications);
router.get('/kyc/:userId', adminController.getKycDetails);
router.post('/kyc/:userId/approve', auditLog('APPROVE_KYC', 'kyc_document'), adminController.approveKyc);
router.post('/kyc/:userId/reject', auditLog('REJECT_KYC', 'kyc_document'), adminController.rejectKyc);

// 7. Admin Notifications
router.get('/notifications', adminController.getAdminNotifications);
router.put('/notifications/:id/read', adminController.markNotificationRead);

// 8. Security & IPs
router.get('/login-history', adminController.getLoginHistory);
router.get('/ip-blacklist', adminController.getIpBlacklist);
router.post('/ip-blacklist', auditLog('BLACKLIST_IP', 'security'), adminController.addIpToBlacklist);
router.delete('/ip-blacklist/:ip', auditLog('UNBLACKLIST_IP', 'security'), adminController.removeIpFromBlacklist);

module.exports = router;

