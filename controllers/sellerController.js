const db = require('../config/db');

const addReview = async (req, res) => {
    try {
        const { sellerId } = req.params;
        const { rating, review_text } = req.body;
        
        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ error: 'Valid rating (1-5) is required' });
        }

        const result = await db.query(
            `INSERT INTO seller_reviews (seller_id, reviewer_id, rating, review_text)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (seller_id, reviewer_id) DO UPDATE
             SET rating = EXCLUDED.rating,
                 review_text = EXCLUDED.review_text,
                 created_at = CURRENT_TIMESTAMP
             RETURNING *`,
            [sellerId, req.user.id, rating, review_text]
        );
        res.status(201).json({ message: 'Review added', review: result.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error adding review' });
    }
};

const getReviews = async (req, res) => {
    try {
        const { sellerId } = req.params;
        const result = await db.query(
            `SELECT r.*, u.email as reviewer_email 
             FROM seller_reviews r
             JOIN users u ON r.reviewer_id = u.id
             WHERE r.seller_id = $1
             ORDER BY r.created_at DESC`,
            [sellerId]
        );
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error fetching reviews' });
    }
};

const getTrustProfile = async (req, res) => {
    try {
        const { sellerId } = req.params;
        
        // Fetch average rating
        const ratingRes = await db.query(
            `SELECT AVG(rating) as average_rating, COUNT(id) as total_reviews
             FROM seller_reviews WHERE seller_id = $1`,
            [sellerId]
        );
        
        // Fetch KYC status
        const kycRes = await db.query(
            `SELECT status FROM kyc_documents WHERE user_id = $1 ORDER BY submitted_at DESC LIMIT 1`,
            [sellerId]
        );
        
        const isVerified = kycRes.rows.length > 0 && kycRes.rows[0].status === 'Approved';
        const ratingData = ratingRes.rows[0];

        res.json({
            seller_id: sellerId,
            average_rating: ratingData.average_rating ? parseFloat(ratingData.average_rating).toFixed(1) : 0,
            total_reviews: parseInt(ratingData.total_reviews, 10),
            verified_badge: isVerified
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error fetching trust profile' });
    }
};

module.exports = {
    addReview,
    getReviews,
    getTrustProfile
};
