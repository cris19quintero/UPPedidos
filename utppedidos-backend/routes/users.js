// ===== routes/users.js - MIGRADO A FIREBASE =====
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { auth, adminAuth } = require('../middleware/auth');
const { generalLimiter } = require('../middleware/rateLimiter');
const { getDB } = require('../config/database');

// Aplicar rate limiting general
router.use(generalLimiter);

// ========== RUTAS DE USUARIO NORMAL ==========

// @route   GET /api/users/profile
// @desc    Obtener perfil del usuario
// @access  Private
router.get('/profile', auth, userController.getUserProfile);

// @route   PUT /api/users/profile
// @desc    Actualizar perfil del usuario
// @access  Private
router.put('/profile', auth, userController.updateUserProfile);

// @route   GET /api/users/orders
// @desc    Obtener pedidos del usuario
// @access  Private
router.get('/orders', auth, userController.getUserOrders);

// @route   GET /api/users/stats
// @desc    Obtener estadísticas del usuario
// @access  Private
router.get('/stats', auth, userController.getUserStats);

// @route   POST /api/users/change-password
// @desc    Cambiar contraseña
// @access  Private
router.post('/change-password', auth, userController.changePassword);

// @route   POST /api/users/deactivate
// @desc    Desactivar cuenta
// @access  Private
router.post('/deactivate', auth, userController.deactivateAccount);

// ========== RUTAS DE ADMINISTRADOR - MIGRADAS A FIREBASE ==========

// @route   GET /api/users/admin/all
// @desc    Obtener todos los usuarios (Admin)
// @access  Private/Admin
router.get('/admin/all', [auth, adminAuth], async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '', activo } = req.query;
        const db = getDB();

        // Query base
        let usuariosQuery = db.collection('usuarios');

        // Aplicar filtros
        if (activo !== undefined) {
            usuariosQuery = usuariosQuery.where('activo', '==', activo === 'true');
        }

        // Ejecutar query (Firebase tiene limitaciones para búsqueda de texto)
        const usuariosSnapshot = await usuariosQuery
            .orderBy('fecha_registro', 'desc')
            .limit(parseInt(limit))
            .get();

        let usuarios = usuariosSnapshot.docs.map(doc => {
            const data = doc.data();
            delete data.contrasena; // No enviar contraseñas
            return {
                id: doc.id,
                ...data
            };
        });

        // Filtrar por búsqueda en memoria (para texto)
        if (search) {
            const searchLower = search.toLowerCase();
            usuarios = usuarios.filter(user => 
                user.nombre?.toLowerCase().includes(searchLower) ||
                user.apellido?.toLowerCase().includes(searchLower) ||
                user.correo?.toLowerCase().includes(searchLower)
            );
        }

        // Paginación simple
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + parseInt(limit);
        const paginatedUsers = usuarios.slice(startIndex, endIndex);

        res.json({
            success: true,
            data: paginatedUsers,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: usuarios.length,
                pages: Math.ceil(usuarios.length / limit)
            }
        });

    } catch (error) {
        console.error('Error obteniendo todos los usuarios:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor',
            message: 'Error obteniendo los usuarios'
        });
    }
});

// @route   GET /api/users/admin/:id
// @desc    Obtener usuario por ID (Admin)
// @access  Private/Admin
router.get('/admin/:id', [auth, adminAuth], async (req, res) => {
    try {
        const userId = req.params.id;
        const db = getDB();

        const userDoc = await db.collection('usuarios').doc(userId).get();

        if (!userDoc.exists) {
            return res.status(404).json({
                success: false,
                error: 'Usuario no encontrado',
                message: 'No existe un usuario con ese ID'
            });
        }

        const userData = userDoc.data();
        delete userData.contrasena; // No enviar contraseña

        // Obtener estadísticas adicionales del usuario
        const pedidosSnapshot = await db.collection('pedidos')
            .where('id_usuario', '==', userId)
            .get();

        let totalPedidos = 0;
        let pedidosCompletados = 0;
        let totalGastado = 0;

        pedidosSnapshot.docs.forEach(doc => {
            const pedido = doc.data();
            totalPedidos++;
            
            if (pedido.estado === 'Finalizado') {
                pedidosCompletados++;
                totalGastado += pedido.total || 0;
            }
        });

        res.json({
            success: true,
            data: {
                id: userDoc.id,
                ...userData,
                estadisticas: {
                    total_pedidos: totalPedidos,
                    pedidos_completados: pedidosCompletados,
                    total_gastado: totalGastado
                }
            }
        });

    } catch (error) {
        console.error('Error obteniendo usuario por ID:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor',
            message: 'Error obteniendo el usuario'
        });
    }
});

// @route   PUT /api/users/admin/:id
// @desc    Actualizar usuario por ID (Admin)
// @access  Private/Admin
router.put('/admin/:id', [auth, adminAuth], async (req, res) => {
    try {
        const userId = req.params.id;
        const {
            nombre, apellido, correo, facultad, telefono, edificio_habitual,
            carrera, semestre, cedula, activo, rol
        } = req.body;
        const db = getDB();

        // Verificar que el usuario existe
        const userDoc = await db.collection('usuarios').doc(userId).get();

        if (!userDoc.exists) {
            return res.status(404).json({
                success: false,
                error: 'Usuario no encontrado',
                message: 'No existe un usuario con ese ID'
            });
        }

        // Verificar email único si se está cambiando
        if (correo) {
            const emailQuery = await db.collection('usuarios')
                .where('correo', '==', correo)
                .get();

            const emailExists = emailQuery.docs.find(doc => doc.id !== userId);
            if (emailExists) {
                return res.status(400).json({
                    success: false,
                    error: 'Email ya existe',
                    message: 'El correo electrónico ya está en uso'
                });
            }
        }

        // Preparar datos para actualizar
        const updateData = {};
        if (nombre !== undefined) updateData.nombre = nombre;
        if (apellido !== undefined) updateData.apellido = apellido;
        if (correo !== undefined) updateData.correo = correo;
        if (facultad !== undefined) updateData.facultad = facultad;
        if (telefono !== undefined) updateData.telefono = telefono;
        if (edificio_habitual !== undefined) updateData.edificio_habitual = edificio_habitual;
        if (carrera !== undefined) updateData.carrera = carrera;
        if (semestre !== undefined) updateData.semestre = semestre;
        if (cedula !== undefined) updateData.cedula = cedula;
        if (activo !== undefined) updateData.activo = activo;
        if (rol !== undefined) updateData.rol = rol;

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Datos requeridos',
                message: 'Debe proporcionar al menos un campo para actualizar'
            });
        }

        // Actualizar usuario
        await userDoc.ref.update(updateData);

        // Obtener usuario actualizado
        const updatedUserDoc = await db.collection('usuarios').doc(userId).get();
        const updatedUser = updatedUserDoc.data();
        delete updatedUser.contrasena;

        res.json({
            success: true,
            message: 'Usuario actualizado correctamente',
            data: {
                id: userId,
                ...updatedUser
            }
        });

    } catch (error) {
        console.error('Error actualizando usuario:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor',
            message: 'Error actualizando el usuario'
        });
    }
});

// @route   DELETE /api/users/admin/:id
// @desc    Eliminar usuario por ID (Admin)
// @access  Private/Admin
router.delete('/admin/:id', [auth, adminAuth], async (req, res) => {
    try {
        const userId = req.params.id;
        const db = getDB();

        // No permitir eliminar la propia cuenta
        if (userId === req.user.id) {
            return res.status(400).json({
                success: false,
                error: 'Operación no permitida',
                message: 'No puedes eliminar tu propia cuenta'
            });
        }

        // Verificar que el usuario existe
        const userDoc = await db.collection('usuarios').doc(userId).get();

        if (!userDoc.exists) {
            return res.status(404).json({
                success: false,
                error: 'Usuario no encontrado',
                message: 'No existe un usuario con ese ID'
            });
        }

        const userData = userDoc.data();

        // En lugar de eliminar, desactivar la cuenta
        await userDoc.ref.update({
            activo: false,
            fecha_desactivacion: new Date(),
            desactivado_por: req.user.id
        });

        res.json({
            success: true,
            message: 'Usuario desactivado correctamente',
            data: {
                id_usuario: userId,
                nombre: userData.nombre,
                correo: userData.correo,
                activo: false
            }
        });

    } catch (error) {
        console.error('Error eliminando usuario:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor',
            message: 'Error eliminando el usuario'
        });
    }
});

// @route   GET /api/users/admin/stats/overview
// @desc    Estadísticas generales de usuarios (Admin)
// @access  Private/Admin
router.get('/admin/stats/overview', [auth, adminAuth], async (req, res) => {
    try {
        const db = getDB();

        // Obtener todos los usuarios
        const usuariosSnapshot = await db.collection('usuarios').get();
        
        let totalUsuarios = 0;
        let usuariosActivos = 0;
        let usuariosInactivos = 0;
        let administradores = 0;
        let nuevosEstesMes = 0;
        const facultadCount = new Map();
        const registrosPorMes = new Map();

        const fechaLimite = new Date();
        fechaLimite.setDate(fechaLimite.getDate() - 30);

        usuariosSnapshot.docs.forEach(doc => {
            const usuario = doc.data();
            totalUsuarios++;

            if (usuario.activo) usuariosActivos++;
            else usuariosInactivos++;

            if (usuario.rol === 'admin') administradores++;

            // Usuarios nuevos este mes
            if (usuario.fecha_registro && usuario.fecha_registro.toDate() > fechaLimite) {
                nuevosEstesMes++;
            }

            // Por facultad
            const facultad = usuario.facultad || 'Sin especificar';
            facultadCount.set(facultad, (facultadCount.get(facultad) || 0) + 1);

            // Registros por mes
            if (usuario.fecha_registro) {
                const fecha = usuario.fecha_registro.toDate();
                const mesKey = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
                registrosPorMes.set(mesKey, (registrosPorMes.get(mesKey) || 0) + 1);
            }
        });

        // Convertir Maps a arrays ordenados
        const porFacultad = Array.from(facultadCount.entries())
            .map(([facultad, total]) => ({ facultad, total }))
            .sort((a, b) => b.total - a.total);

        const registrosMensuales = Array.from(registrosPorMes.entries())
            .map(([mes, registros]) => ({ mes, registros }))
            .sort((a, b) => b.mes.localeCompare(a.mes))
            .slice(0, 6);

        res.json({
            success: true,
            data: {
                resumen: {
                    total_usuarios: totalUsuarios,
                    usuarios_activos: usuariosActivos,
                    usuarios_inactivos: usuariosInactivos,
                    administradores: administradores,
                    nuevos_mes: nuevosEstesMes
                },
                registros_mensuales: registrosMensuales,
                por_facultad: porFacultad
            }
        });

    } catch (error) {
        console.error('Error obteniendo estadísticas:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor',
            message: 'Error obteniendo estadísticas'
        });
    }
});

module.exports = router;

