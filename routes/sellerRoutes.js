const express = require('express');
const router = express.Router();
const sellerController = require('../controllers/sellerController');
const authMiddleware = require('../middlewares/auth');

router.get('/:sellerId/trust-profile', sellerController.getTrustProfile);
router.get('/:sellerId/reviews', sellerController.getReviews);

router.post('/:sellerId/reviews', authMiddleware, sellerController.addReview);

module.exports = router;
