const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/send-otp', authController.sendOtp);
router.post('/verify-otp', authController.verifyOtp);
router.post('/logout', authController.logout);
router.post('/register', authController.sendOtp); // Register calls sendOtp but client should pass action: 'register'

module.exports = router;
