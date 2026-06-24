const express = require('express');
const router = express.Router();
const bookmarkController = require('../controllers/bookmarkController');
const authMiddleware = require('../middlewares/auth');

router.use(authMiddleware);

router.post('/listings/:equipmentId', bookmarkController.addBookmark);
router.delete('/listings/:equipmentId', bookmarkController.removeBookmark);
router.get('/listings', bookmarkController.getBookmarks);

router.post('/searches', bookmarkController.saveSearch);
router.delete('/searches/:searchId', bookmarkController.removeSavedSearch);
router.get('/searches', bookmarkController.getSavedSearches);

module.exports = router;
