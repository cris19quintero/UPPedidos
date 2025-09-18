// ===== routes/products.js - MIGRADO A FIREBASE =====
const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { optionalAuth } = require('../middleware/authMiddleware');
const { generalLimiter } = require('../middleware/rateLimiter');

// Aplicar rate limiting
router.use(generalLimiter);

// @route   GET /api/products/cafeteria/:id
// @desc    Obtener productos por cafetería
// @access  Public
router.get('/cafeteria/:id', optionalAuth, productController.getProductsByCafeteria);

// @route   GET /api/products/search
// @desc    Buscar productos
// @access  Public
router.get('/search', optionalAuth, productController.searchProducts);

// @route   GET /api/products/categories/all
// @desc    Obtener todas las categorías
// @access  Public
router.get('/categories/all', optionalAuth, productController.getCategories);

// @route   GET /api/products/horario/:horario
// @desc    Obtener productos por horario
// @access  Public
router.get('/horario/:horario', optionalAuth, productController.getProductsBySchedule);

// @route   GET /api/products/:id
// @desc    Obtener producto por ID (debe ir al final)
// @access  Public
router.get('/:id', optionalAuth, productController.getProductById);

module.exports = router;