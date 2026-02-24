const express = require('express');
const router = express.Router();
const searchController = require('../controllers/search.controller');

// Public search routes
router.get('/global', searchController.globalSearch);
router.get('/store/:storeId', searchController.storeSearch);

module.exports = router;
