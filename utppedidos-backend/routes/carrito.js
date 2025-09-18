// ===== routes/carrito.js - MIGRADO A FIREBASE =====
const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { auth } = require('../middleware/authMiddleware');
const { generalLimiter } = require('../middleware/rateLimiter');

// Aplicar rate limiting
router.use(generalLimiter);

// @route   GET /api/carrito
// @desc    Obtener carrito del usuario
// @access  Private
router.get('/', auth, cartController.getCart);

// @route   POST /api/carrito
// @desc    Agregar item al carrito
// @access  Private
router.post('/', auth, cartController.addToCart);

// @route   PUT /api/carrito/:id_producto
// @desc    Actualizar cantidad de item en carrito
// @access  Private
router.put('/:id_producto', auth, cartController.updateCartItem);

// @route   DELETE /api/carrito/:id_producto
// @desc    Remover item del carrito
// @access  Private
router.delete('/:id_producto', auth, cartController.removeFromCart);

// @route   DELETE /api/carrito
// @desc    Vaciar carrito completamente
// @access  Private
router.delete('/', auth, cartController.clearCart);

// @route   GET /api/carrito/count
// @desc    Obtener cantidad de items en carrito
// @access  Private
router.get('/count', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        const { getDB } = require('../config/database');
        const db = getDB();

        const carritoQuery = await db.collection('carritos')
            .where('id_usuario', '==', userId)
            .where('activo', '==', true)
            .limit(1)
            .get();

        if (carritoQuery.empty) {
            return res.json({
                success: true,
                count: 0,
                total: 0
            });
        }

        const carritoDoc = carritoQuery.docs[0];
        const itemsSnapshot = await carritoDoc.ref.collection('items').get();
        
        let count = 0;
        let total = 0;

        for (const itemDoc of itemsSnapshot.docs) {
            const item = itemDoc.data();
            count += item.cantidad;
            total += item.subtotal;
        }

        res.json({
            success: true,
            count,
            total: parseFloat(total.toFixed(2))
        });

    } catch (error) {
        console.error('Error obteniendo count del carrito:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor',
            message: 'Error obteniendo el contador del carrito'
        });
    }
});

module.exports = router;