const express = require('express');
const router = express.Router();
const vendorController = require('../controllers/vendorController');
const authMiddleware = require('../middlewares/auth');
const uploadCsv = require('../middlewares/uploadCsv'); 

router.use(authMiddleware);

// 1. Dashboard Metrics
router.get('/dashboard', vendorController.getDashboardMetrics);

// 2. Inventory Tracking
router.patch('/inventory/:id', vendorController.updateInventory);

// 3. Multi Location Support
router.get('/locations', vendorController.getLocations);
router.post('/locations', vendorController.addLocation);
router.put('/locations/:id', vendorController.updateLocation);
router.delete('/locations/:id', vendorController.deleteLocation);

// 4. Bulk CSV Upload
// uploadCsv.single('file') will parse the multipart form data and save to req.file
router.post('/bulk-upload', uploadCsv.single('file'), vendorController.bulkUploadListings);

module.exports = router;
