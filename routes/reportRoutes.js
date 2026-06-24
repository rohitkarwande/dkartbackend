const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const authMiddleware = require('../middlewares/auth');

router.use(authMiddleware);

router.post('/fraud', reportController.reportFraud);

module.exports = router;
