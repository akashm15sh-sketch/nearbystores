const express = require('express');
const router = express.Router();
const storeController = require('../controllers/store.controller');
const { protect, adminOnly } = require('../middleware/auth.middleware');

// Public routes
router.get('/', storeController.getAllStores);

// Protected routes (authenticated users)
router.post('/location', protect, storeController.updateLocation);

// Store owner routes (authenticated users)
router.post('/register', protect, storeController.registerStore);
router.get('/my-stores/list', protect, storeController.getMyStores);
router.put('/my-stores/:id', protect, storeController.updateMyStore);

// Admin routes
router.get('/admin/all', protect, adminOnly, storeController.getAllStoresAdmin);
router.get('/admin/pending', protect, adminOnly, storeController.getPendingStores);
router.patch('/admin/:id/approve', protect, adminOnly, storeController.approveStore);
router.patch('/admin/:id/reject', protect, adminOnly, storeController.rejectStore);
router.post('/', protect, adminOnly, storeController.createStore);
router.put('/:id', protect, adminOnly, storeController.updateStore);
router.delete('/:id', protect, adminOnly, storeController.deleteStore);
router.patch('/:id/status', protect, adminOnly, storeController.updateStoreStatus);

// Public single-store lookup — MUST be last (/:id catches everything)
router.get('/:id', storeController.getStore);

module.exports = router;
