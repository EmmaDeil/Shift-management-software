const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getSwaps,
  getSwapById,
  createSwap,
  respondToSwap,
  reviewSwap,
  cancelSwap,
} = require('../controllers/swapController');

router.use(protect);

router.get('/', getSwaps);
router.post('/', createSwap);
router.get('/:id', getSwapById);
router.put('/:id/peer-response', respondToSwap);
router.put('/:id/manager-review', authorize('admin', 'manager'), reviewSwap);
router.delete('/:id', cancelSwap);

module.exports = router;
