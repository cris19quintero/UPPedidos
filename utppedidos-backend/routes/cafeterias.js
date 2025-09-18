// ===== routes/cafeterias.js - MIGRADO A FIREBASE =====
const express = require('express');
const router = express.Router();
const cafeteriaController = require('../controllers/cafeteriaController');
const { optionalAuth, auth, adminAuth } = require('../middleware/authMiddleware');
const { generalLimiter } = require('../middleware/rateLimiter');

// Aplicar rate limiting
router.use(generalLimiter);

// @route   GET /api/cafeterias
// @desc    Obtener todas las cafeterías
// @access  Public
router.get('/', optionalAuth, cafeteriaController.getAllCafeterias);

// @route   GET /api/cafeterias/:id
// @desc    Obtener cafetería por ID
// @access  Public
router.get('/:id', optionalAuth, cafeteriaController.getCafeteriaById);

// @route   GET /api/cafeterias/:id/stats
// @desc    Obtener estadísticas de cafetería (Admin)
// @access  Private/Admin
router.get('/:id/stats', [auth, adminAuth], cafeteriaController.getCafeteriaStats);

// @route   GET /api/cafeterias/:id/horarios
// @desc    Obtener horarios de cafetería
// @access  Public
router.get('/:id/horarios', optionalAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { getDB } = require('../config/database');
        const db = getDB();

        const cafeteriaDoc = await db.collection('cafeterias').doc(id).get();

        if (!cafeteriaDoc.exists || !cafeteriaDoc.data().activa) {
            return res.status(404).json({
                success: false,
                error: 'Cafetería no encontrada',
                message: 'No se encontró la cafetería especificada'
            });
        }

        const data = cafeteriaDoc.data();
        const horarios = {
            desayuno: {
                inicio: data.horario_desayuno_inicio,
                fin: data.horario_desayuno_fin
            },
            almuerzo: {
                inicio: data.horario_almuerzo_inicio,
                fin: data.horario_almuerzo_fin
            },
            cena: {
                inicio: data.horario_cena_inicio,
                fin: data.horario_cena_fin
            }
        };

        res.json({
            success: true,
            data: {
                horarios,
                cafeteria: {
                    id_cafeteria: id,
                    nombre: data.nombre,
                    edificio: data.edificio
                }
            }
        });

    } catch (error) {
        console.error('Error obteniendo horarios:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor',
            message: 'Error obteniendo los horarios'
        });
    }
});

// @route   GET /api/cafeterias/:id/ubicacion
// @desc    Obtener ubicación de cafetería
// @access  Public
router.get('/:id/ubicacion', optionalAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { getDB } = require('../config/database');
        const db = getDB();

        const cafeteriaDoc = await db.collection('cafeterias').doc(id).get();

        if (!cafeteriaDoc.exists || !cafeteriaDoc.data().activa) {
            return res.status(404).json({
                success: false,
                error: 'Cafetería no encontrada',
                message: 'No se encontró la cafetería especificada'
            });
        }

        const data = cafeteriaDoc.data();

        res.json({
            success: true,
            data: {
                ubicacion: {
                    lat: data.latitud || null,
                    lng: data.longitud || null
                },
                direccion: data.direccion,
                cafeteria: {
                    id_cafeteria: id,
                    nombre: data.nombre,
                    edificio: data.edificio
                }
            }
        });

    } catch (error) {
        console.error('Error obteniendo ubicación:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor',
            message: 'Error obteniendo la ubicación'
        });
    }
});

module.exports = router;