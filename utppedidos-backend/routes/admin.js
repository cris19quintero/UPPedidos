const express = require('express');
const router = express.Router();
const { auth, adminAuth } = require('../middleware/authMiddleware');

// Placeholder admin routes
router.get('/dashboard', [auth, adminAuth], (req, res) => {
  res.json({
    success: true,
    message: 'Admin dashboard - En desarrollo',
    data: {
      stats: {
        usuarios: 0,
        pedidos: 0,
        cafeterias: 0
      }
    }
  });
});

module.exports = router;