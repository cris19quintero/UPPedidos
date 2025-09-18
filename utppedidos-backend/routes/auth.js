// ===== routes/auth.js - CORREGIDO =====
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { auth } = require('../middleware/authMiddleware');
const { loginLimiter, registerLimiter } = require('../middleware/rateLimiter');

// Rutas de autenticación
router.post('/register', registerLimiter, authController.register);
router.post('/login', loginLimiter, authController.login);
router.post('/refresh', authController.refreshToken);
// router.get('/verify', auth, authController.verifyToken); // Cambié /me por /verify
router.post('/logout', auth, authController.logout);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

// AGREGAR ESTE CÓDIGO AQUÍ:
// @route   GET /api/auth/check-email
// @desc    Verificar disponibilidad de email
// @access  Public
router.get('/check-email', async (req, res) => {
    try {
        const { email } = req.query;
        
        if (!email) {
            return res.status(400).json({
                success: false,
                error: 'Email requerido',
                message: 'Debes proporcionar un email para verificar'
            });
        }

        const { getDB } = require('../config/database');
        const db = getDB();
        
        const existingUserQuery = await db.collection('usuarios')
            .where('correo', '==', email.toLowerCase().trim())
            .get();

        res.json({
            success: true,
            available: existingUserQuery.empty,
            message: existingUserQuery.empty ? 'Email disponible' : 'Email ya registrado'
        });

    } catch (error) {
        console.error('Error verificando email:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor',
            message: 'Error verificando disponibilidad del email'
        });
    }
});
// Verificar disponibilidad de email
// router.get('/check-email', authController.checkEmailAvailability);

module.exports = router;