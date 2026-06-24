const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middlewares/auth');

router.use(authMiddleware);

router.get('/profile', userController.getProfile);
router.put('/profile', userController.updateProfile);
router.post('/kyc', userController.submitKyc);
router.post('/become-seller', userController.becomeSeller);
router.get('/dashboard', userController.getDashboard);

module.exports = router;
