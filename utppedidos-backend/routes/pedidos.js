// ===== routes/pedidos.js - CÓDIGO COMPLETO CORREGIDO =====
const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { auth, adminAuth } = require('../middleware/authMiddleware');
const { generalLimiter } = require('../middleware/rateLimiter');

// Aplicar rate limiting
router.use(generalLimiter);

// MIDDLEWARE DE AUTENTICACIÓN OPCIONAL (para permitir invitados)
const optionalAuth = (req, res, next) => {
    const token = req.header('x-auth-token') || 
                  req.header('Authorization')?.replace('Bearer ', '');
    
    if (token) {
        // Si hay token, usar middleware de autenticación normal
        auth(req, res, (err) => {
            if (err) {
                // Si hay error en auth, continuar como invitado
                req.user = null;
                next();
            } else {
                next();
            }
        });
    } else {
        // Si no hay token, continuar como invitado
        req.user = null;
        next();
    }
};

// ========== RUTAS DE PEDIDOS DE USUARIO ==========

// @route   POST /api/pedidos
// @desc    Crear pedido directo (PERMITE INVITADOS) - PARA CARTMODAL
// @access  Public/Private (opcional)
router.post('/', optionalAuth, orderController.createDirectOrder);

// @route   POST /api/pedidos/from-cart
// @desc    Crear pedido desde carrito (REQUIERE AUTH)
// @access  Private
router.post('/from-cart', auth, orderController.createOrderFromCart);

// @route   GET /api/pedidos
// @desc    Obtener pedidos del usuario
// @access  Private
router.get('/', auth, orderController.getUserOrders);

// @route   GET /api/pedidos/:id
// @desc    Obtener pedido por ID
// @access  Private
router.get('/:id', auth, orderController.getOrderById);

// @route   DELETE /api/pedidos/:id
// @desc    Cancelar pedido
// @access  Private
router.delete('/:id', auth, orderController.cancelOrder);

// ========== RUTAS DE ADMINISTRACIÓN (ADMIN ONLY) ==========

// @route   GET /api/pedidos/admin/all
// @desc    Obtener todos los pedidos (Admin)
// @access  Private/Admin
router.get('/admin/all', [auth, adminAuth], async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 20, 
            estado, 
            cafeteria, 
            fecha_desde, 
            fecha_hasta,
            search 
        } = req.query;
        const { getDB } = require('../config/database');
        const db = getDB();

        // Query base sin orderBy para evitar índice
        let pedidosQuery = db.collection('pedidos');

        // Aplicar filtros
        if (estado && estado !== 'todos') {
            pedidosQuery = pedidosQuery.where('estado', '==', estado);
        }

        if (cafeteria && cafeteria !== 'todas') {
            pedidosQuery = pedidosQuery.where('id_cafeteria', '==', cafeteria);
        }

        // Ejecutar query
        const pedidosSnapshot = await pedidosQuery
            .limit(parseInt(limit))
            .get();

        let pedidos = [];
        for (const pedidoDoc of pedidosSnapshot.docs) {
            const pedido = { id: pedidoDoc.id, ...pedidoDoc.data() };
            
            // Obtener items del pedido
            const itemsSnapshot = await pedidoDoc.ref.collection('items').get();
            pedido.items = itemsSnapshot.docs.map(doc => doc.data());
            
            // Filtrar por fecha si se especifica
            if (fecha_desde || fecha_hasta) {
                const fechaPedido = pedido.fecha_pedido?.toDate();
                if (fechaPedido) {
                    if (fecha_desde && fechaPedido < new Date(fecha_desde)) continue;
                    if (fecha_hasta && fechaPedido > new Date(fecha_hasta)) continue;
                }
            }
            
            // Filtrar por búsqueda de texto
            if (search) {
                const searchLower = search.toLowerCase();
                const matchesSearch = 
                    pedido.id.toLowerCase().includes(searchLower) ||
                    pedido.cafeteria_nombre?.toLowerCase().includes(searchLower) ||
                    pedido.usuario_nombre?.toLowerCase().includes(searchLower) ||
                    pedido.usuario_email?.toLowerCase().includes(searchLower);
                
                if (!matchesSearch) continue;
            }
            
            // Obtener información del usuario (solo si no es invitado)
            if (pedido.id_usuario && pedido.id_usuario !== 'guest') {
                try {
                    const usuarioDoc = await db.collection('usuarios').doc(pedido.id_usuario).get();
                    if (usuarioDoc.exists) {
                        const usuario = usuarioDoc.data();
                        pedido.usuario_info = {
                            nombre: usuario.nombre,
                            apellido: usuario.apellido,
                            correo: usuario.correo
                        };
                    }
                } catch (userError) {
                    console.error('Error obteniendo usuario:', userError);
                }
            } else if (pedido.id_usuario === 'guest') {
                // Para usuarios invitados, usar el nombre del pedido
                pedido.usuario_info = {
                    nombre: pedido.usuario_nombre || 'Invitado',
                    apellido: '',
                    correo: 'Pedido de invitado'
                };
            }
            
            // Convertir timestamps
            if (pedido.fecha_pedido?.toDate) {
                pedido.fecha_pedido = pedido.fecha_pedido.toDate();
            }
            if (pedido.fecha_estimada) {
                pedido.fecha_estimada = new Date(pedido.fecha_estimada);
            }
            
            pedidos.push(pedido);
        }

        // Ordenar en memoria por fecha (más recientes primero)
        pedidos.sort((a, b) => {
            const fechaA = a.fecha_pedido || new Date(0);
            const fechaB = b.fecha_pedido || new Date(0);
            return fechaB.getTime() - fechaA.getTime();
        });

        // Obtener total para paginación
        const totalSnapshot = await db.collection('pedidos').get();
        const total = totalSnapshot.size;

        res.json({
            success: true,
            data: pedidos,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            },
            filtros: {
                estado: estado || 'todos',
                cafeteria: cafeteria || 'todas',
                fecha_desde,
                fecha_hasta,
                search: search || ''
            }
        });

    } catch (error) {
        console.error('Error obteniendo pedidos (admin):', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor',
            message: 'Error obteniendo los pedidos'
        });
    }
});

// @route   PUT /api/pedidos/admin/:id/status
// @desc    Actualizar estado de pedido (Admin)
// @access  Private/Admin
router.put('/admin/:id/status', [auth, adminAuth], async (req, res) => {
    try {
        const { id } = req.params;
        const { estado, observaciones } = req.body;
        const { getDB, serverTimestamp } = require('../config/database');
        const db = getDB();

        const estadosValidos = ['Pendiente', 'Confirmado', 'En Preparación', 'Por Retirar', 'Finalizado', 'Cancelado'];
        
        if (!estado || !estadosValidos.includes(estado)) {
            return res.status(400).json({
                success: false,
                error: 'Estado inválido',
                message: 'El estado debe ser uno de: ' + estadosValidos.join(', ')
            });
        }

        const pedidoDoc = await db.collection('pedidos').doc(id).get();
        
        if (!pedidoDoc.exists) {
            return res.status(404).json({
                success: false,
                error: 'Pedido no encontrado',
                message: 'No existe un pedido con ese ID'
            });
        }

        const updateData = {
            estado,
            fecha_actualizacion: serverTimestamp(),
            actualizado_por: req.user.id
        };

        if (observaciones) {
            updateData.observaciones_admin = observaciones;
        }

        if (estado === 'Finalizado') {
            updateData.fecha_entrega = serverTimestamp();
        }

        await pedidoDoc.ref.update(updateData);

        // Obtener pedido actualizado
        const updatedPedidoDoc = await db.collection('pedidos').doc(id).get();
        const updatedPedido = { id: updatedPedidoDoc.id, ...updatedPedidoDoc.data() };

        res.json({
            success: true,
            message: `Pedido actualizado a: ${estado}`,
            data: updatedPedido
        });

    } catch (error) {
        console.error('Error actualizando estado de pedido:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor',
            message: 'Error actualizando el estado del pedido'
        });
    }
});

// @route   GET /api/pedidos/admin/stats
// @desc    Estadísticas de pedidos (Admin)
// @access  Private/Admin
router.get('/admin/stats', [auth, adminAuth], async (req, res) => {
    try {
        const { periodo = '30d' } = req.query;
        const { getDB } = require('../config/database');
        const db = getDB();

        // Calcular fecha de inicio según período
        let fechaInicio = new Date();
        switch (periodo) {
            case '7d':
                fechaInicio.setDate(fechaInicio.getDate() - 7);
                break;
            case '30d':
                fechaInicio.setDate(fechaInicio.getDate() - 30);
                break;
            case '90d':
                fechaInicio.setDate(fechaInicio.getDate() - 90);
                break;
            default:
                fechaInicio.setDate(fechaInicio.getDate() - 30);
        }

        // Obtener pedidos del período (sin filtro de fecha para evitar índice)
        const pedidosSnapshot = await db.collection('pedidos').get();

        let totalPedidos = 0;
        let pedidosPendientes = 0;
        let pedidosFinalizados = 0;
        let pedidosCancelados = 0;
        let ingresosTotales = 0;
        const pedidosPorDia = new Map();
        const pedidosPorCafeteria = new Map();

        pedidosSnapshot.docs.forEach(doc => {
            const pedido = doc.data();
            
            // Filtrar por fecha en memoria
            if (pedido.fecha_pedido) {
                const fechaPedido = pedido.fecha_pedido.toDate();
                if (fechaPedido < fechaInicio) return;
            }
            
            totalPedidos++;

            switch (pedido.estado) {
                case 'Pendiente':
                case 'Confirmado':
                case 'En Preparación':
                case 'Por Retirar':
                    pedidosPendientes++;
                    break;
                case 'Finalizado':
                    pedidosFinalizados++;
                    ingresosTotales += pedido.total || 0;
                    break;
                case 'Cancelado':
                    pedidosCancelados++;
                    break;
            }

            // Agrupar por día
            if (pedido.fecha_pedido) {
                const fecha = pedido.fecha_pedido.toDate();
                const fechaKey = fecha.toISOString().split('T')[0];
                pedidosPorDia.set(fechaKey, (pedidosPorDia.get(fechaKey) || 0) + 1);
            }

            // Agrupar por cafetería
            if (pedido.cafeteria_nombre) {
                const current = pedidosPorCafeteria.get(pedido.cafeteria_nombre) || { pedidos: 0, ingresos: 0 };
                pedidosPorCafeteria.set(pedido.cafeteria_nombre, {
                    pedidos: current.pedidos + 1,
                    ingresos: current.ingresos + (pedido.estado === 'Finalizado' ? (pedido.total || 0) : 0)
                });
            }
        });

        const stats = {
            resumen: {
                total_pedidos: totalPedidos,
                pedidos_pendientes: pedidosPendientes,
                pedidos_finalizados: pedidosFinalizados,
                pedidos_cancelados: pedidosCancelados,
                ingresos_totales: ingresosTotales,
                ticket_promedio: pedidosFinalizados > 0 ? ingresosTotales / pedidosFinalizados : 0
            },
            pedidos_por_dia: Array.from(pedidosPorDia.entries())
                .map(([fecha, pedidos]) => ({ fecha, pedidos }))
                .sort((a, b) => a.fecha.localeCompare(b.fecha)),
            pedidos_por_cafeteria: Array.from(pedidosPorCafeteria.entries())
                .map(([cafeteria, data]) => ({ cafeteria, ...data }))
                .sort((a, b) => b.pedidos - a.pedidos),
            periodo_analizado: periodo
        };

        res.json({
            success: true,
            data: stats
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