const express = require('express');
const router = express.Router();

// Redirect to carrito for compatibility
router.use('*', (req, res) => {
  res.redirect(`/api/carrito${req.originalUrl.replace('/api/cart', '')}`);
});

module.exports = router;