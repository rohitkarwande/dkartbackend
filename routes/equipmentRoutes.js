const express = require('express');
const router = express.Router();
const equipmentController = require('../controllers/equipmentController');
const authMiddleware = require('../middlewares/auth');
const isAdmin = require('../middlewares/role');
const upload = require('../middlewares/upload');

// Public routes (or auth depending on requirements, let's keep GET public but MyPosts auth)
// Requirements state "Authenticated users only" for CREATE. I'll make LIST and GET public, rest protected.
router.get('/', equipmentController.listEquipment);
router.get('/popular-tags', equipmentController.getPopularTags);
router.get('/my-posts', authMiddleware, equipmentController.getMyEquipment); // Must be before /:id
router.get('/:id', equipmentController.getSingleEquipment);
router.get('/:id/similar', equipmentController.getSimilarListings);
router.get('/:id/engagement', equipmentController.getEngagementMetrics);

// Protected routes
router.post('/', authMiddleware, upload.array('images', 10), equipmentController.createEquipment);
router.put('/:id', authMiddleware, upload.array('newImages', 10), equipmentController.updateEquipment);
router.delete('/:id', authMiddleware, equipmentController.deleteEquipment);
router.patch('/:id/status', authMiddleware, equipmentController.updateStatus);

module.exports = router;
