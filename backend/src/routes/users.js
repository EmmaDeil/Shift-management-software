const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/', (req, res) => {
  res.status(501).json({ status: 'error', message: 'Not implemented yet' });
});

router.get('/:id', (req, res) => {
  res.status(501).json({ status: 'error', message: 'Not implemented yet' });
});

router.put('/:id', (req, res) => {
  res.status(501).json({ status: 'error', message: 'Not implemented yet' });
});

router.delete('/:id', authorize('admin'), (req, res) => {
  res.status(501).json({ status: 'error', message: 'Not implemented yet' });
});

module.exports = router;
