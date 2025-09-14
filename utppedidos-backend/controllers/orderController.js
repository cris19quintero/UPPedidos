// controllers/orderController.js - Controlador de pedidos
const { executeQuery, executeTransaction } = require('../config/database');

// Crear un nuevo pedido
const createOrder = async (req, res) => {
    try {
        const userId = req.user.id;
        const {
            id_cafeteria,
            items,
            metodo_pago = 'efectivo',
            tipo_pedido = 'normal',
            observaciones = '',
            notas = ''
        } = req.body;
        
        // Validaciones básicas
        if (!id_cafeteria || !items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                error: 'Datos inválidos',
                message: 'ID de cafetería e items son requeridos'
            });
        }
        
        // Verificar que la cafetería existe y está activa
        const cafeteria = await executeQuery(
            'SELECT id_cafeteria, nombre, activa FROM Cafeterias WHERE id_cafeteria = ?',
            [id_cafeteria]
        );
        
        if (cafeteria.length === 0) {
            return res.status(404).json({
                error: 'Cafetería no encontrada',
                message: 'La cafetería especificada no existe'
            });
        }
        
        if (!cafeteria[0].activa) {
            return res.status(400).json({
                error: 'Cafetería cerrada',
                message: 'La cafetería no está disponible en este momento'
            });
        }
        
        // Validar y obtener información de productos
        const productIds = items.map(item => item.id_producto);
        const products = await executeQuery(
            `SELECT id_producto, nombre, precio, activo 
             FROM Productos 
             WHERE id_producto IN (${productIds.map(() => '?').join(',')}) 
               AND id_cafeteria = ? AND activo = TRUE`,
            [...productIds, id_cafeteria]
        );
        
        if (products.length !== items.length) {
            return res.status(400).json({
                error: 'Productos inválidos',
                message: 'Algunos productos no están disponibles o no pertenecen a esta cafetería'
            });
        }
        
        // Crear mapa de productos para fácil acceso
        const productMap = {};
        products.forEach(product => {
            productMap[product.id_producto] = product;
        });
        
        // Calcular total y preparar detalles del pedido
        let total = 0;
        const orderDetails = [];
        
        for (const item of items) {
            const product = productMap[item.id_producto];
            const cantidad = parseInt(item.cantidad) || 1;
            
            if (cantidad <= 0 || cantidad > 50) {
                return res.status(400).json({
                    error: 'Cantidad inválida',
                    message: 'La cantidad debe ser entre 1 y 50'
                });
            }
            
            const precio_unitario = parseFloat(product.precio);
            const subtotal = precio_unitario * cantidad;
            
            total += subtotal;
            
            orderDetails.push({
                id_producto: item.id_producto,
                cantidad: cantidad,
                precio_unitario: precio_unitario,
                subtotal: subtotal
            });
        }
        
        // Agregar cargo extra si es tipo express
        if (tipo_pedido === 'express') {
            total += 1.00; // Cargo de $1 por pedido express
        }
        
        // Crear transacción para insertar pedido y detalles
        const transactionOperations = [
            {
                query: `INSERT INTO Pedidos (
                    id_usuario, id_cafeteria, fecha_pedido, estado, total, notas,
                    metodo_pago, tipo_pedido, observaciones
                ) VALUES (?, ?, NOW(), 'Pendiente', ?, ?, ?, ?, ?)`,
                params: [userId, id_cafeteria, total, notas, metodo_pago, tipo_pedido, observaciones]
            }
        ];
        
        // Ejecutar transacción
        const [orderResult] = await executeTransaction(transactionOperations);
        const orderId = orderResult.insertId;
        
        // Insertar detalles del pedido
        const detailOperations = orderDetails.map(detail => ({
            query: `INSERT INTO DetallePedidos (
                id_pedido, id_producto, cantidad, precio_unitario, subtotal
            ) VALUES (?, ?, ?, ?, ?)`,
            params: [orderId, detail.id_producto, detail.cantidad, detail.precio_unitario, detail.subtotal]
        }));
        
        await executeTransaction(detailOperations);
        
        // Obtener el pedido completo creado
        const newOrder = await getFullOrderById(orderId);
        
        res.status(201).json({
            success: true,
            message: 'Pedido creado exitosamente',
            data: newOrder
        });
        
    } catch (error) {
        console.error('Error creando pedido:', error);
        res.status(500).json({
            error: 'Error interno del servidor',
            message: 'Error creando el pedido'
        });
    }
};

// Obtener pedidos del usuario
const getUserOrders = async (req, res) => {
    try {
        const userId = req.user.id;
        const { estado, page = 1, limit = 10 } = req.query;
        
        const offset = (page - 1) * limit;
        
        let whereClause = 'WHERE p.id_usuario = ?';
        let queryParams = [userId];
        
        if (estado) {
            whereClause += ' AND p.estado = ?';
            queryParams.push(estado);
        }
        
        const orders = await executeQuery(
            `SELECT 
                p.id_pedido, p.estado, p.total, p.fecha_pedido, p.notas,
                p.metodo_pago, p.tipo_pedido, p.observaciones,
                c.id_cafeteria, c.nombre as cafeteria_nombre, c.edificio
             FROM Pedidos p
             JOIN Cafeterias c ON p.id_cafeteria = c.id_cafeteria
             ${whereClause}
             ORDER BY p.fecha_pedido DESC
             LIMIT ? OFFSET ?`,
            [...queryParams, parseInt(limit), offset]
        );
        
        // Obtener detalles para cada pedido
        const ordersWithDetails = await Promise.all(
            orders.map(async (order) => {
                const items = await executeQuery(
                    `SELECT 
                        dp.cantidad, dp.precio_unitario, dp.subtotal,
                        pr.id_producto, pr.nombre, pr.descripcion, pr.categoria, pr.imagen
                     FROM DetallePedidos dp
                     JOIN Productos pr ON dp.id_producto = pr.id_producto
                     WHERE dp.id_pedido = ?`,
                    [order.id_pedido]
                );
                
                return {
                    id_pedido: order.id_pedido,
                    estado: order.estado,
                    total: parseFloat(order.total),
                    fecha_pedido: order.fecha_pedido,
                    metodo_pago: order.metodo_pago,
                    tipo_pedido: order.tipo_pedido,
                    observaciones: order.observaciones,
                    notas: order.notas,
                    cafeteria_info: {
                        id_cafeteria: order.id_cafeteria,
                        nombre: order.cafeteria_nombre,
                        edificio: order.edificio
                    },
                    items: items.map(item => ({
                        id_producto: item.id_producto,
                        nombre: item.nombre,
                        descripcion: item.descripcion,
                        categoria: item.categoria,
                        imagen: item.imagen,
                        cantidad: item.cantidad,
                        precio_unitario: parseFloat(item.precio_unitario),
                        subtotal: parseFloat(item.subtotal)
                    }))
                };
            })
        );
        
        // Contar total para paginación
        const [totalCount] = await executeQuery(
            `SELECT COUNT(*) as count FROM Pedidos p ${whereClause}`,
            queryParams.slice(0, -2)
        );
        
        res.json({
            success: true,
            data: ordersWithDetails,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: totalCount[0].count,
                pages: Math.ceil(totalCount[0].count / limit)
            }
        });
        
    } catch (error) {
        console.error('Error obteniendo pedidos:', error);
        res.status(500).json({
            error: 'Error interno del servidor',
            message: 'Error obteniendo los pedidos'
        });
    }
};

// Obtener un pedido específico
const getOrderById = async (req, res) => {
    try {
        const userId = req.user.id;
        const orderId = req.params.id;
        
        const order = await getFullOrderById(orderId, userId);
        
        if (!order) {
            return res.status(404).json({
                error: 'Pedido no encontrado',
                message: 'El pedido no existe o no tienes permiso para verlo'
            });
        }
        
        res.json({
            success: true,
            data: order
        });
        
    } catch (error) {
        console.error('Error obteniendo pedido:', error);
        res.status(500).json({
            error: 'Error interno del servidor',
            message: 'Error obteniendo el pedido'
        });
    }
};

// Actualizar estado de pedido
const updateOrderStatus = async (req, res) => {
    try {
        const userId = req.user.id;
        const orderId = req.params.id;
        const { estado } = req.body;
        
        // Estados válidos
        const validStates = ['Pendiente', 'Por Retirar', 'Retirado', 'Finalizado', 'Cancelado', 'Expirado'];
        
        if (!estado || !validStates.includes(estado)) {
            return res.status(400).json({
                error: 'Estado inválido',
                message: `Estados válidos: ${validStates.join(', ')}`
            });
        }
        
        // Verificar que el pedido existe y pertenece al usuario
        const existingOrder = await executeQuery(
            'SELECT id_pedido, estado FROM Pedidos WHERE id_pedido = ? AND id_usuario = ?',
            [orderId, userId]
        );
        
        if (existingOrder.length === 0) {
            return res.status(404).json({
                error: 'Pedido no encontrado',
                message: 'El pedido no existe o no tienes permiso para modificarlo'
            });
        }
        
        const currentState = existingOrder[0].estado;
        
        // Validaciones de transición de estado
        const allowedTransitions = {
            'Pendiente': ['Por Retirar', 'Cancelado', 'Expirado'],
            'Por Retirar': ['Retirado', 'Expirado'],
            'Retirado': ['Finalizado'],
            'Finalizado': [], // Estado final
            'Cancelado': [], // Estado final
            'Expirado': [] // Estado final
        };
        
        if (!allowedTransitions[currentState].includes(estado)) {
            return res.status(400).json({
                error: 'Transición de estado inválida',
                message: `No se puede cambiar de "${currentState}" a "${estado}"`
            });
        }
        
        // Actualizar estado
        await executeQuery(
            'UPDATE Pedidos SET estado = ? WHERE id_pedido = ?',
            [estado, orderId]
        );
        
        // Obtener pedido actualizado
        const updatedOrder = await getFullOrderById(orderId);
        
        res.json({
            success: true,
            message: 'Estado del pedido actualizado correctamente',
            data: updatedOrder
        });
        
    } catch (error) {
        console.error('Error actualizando estado del pedido:', error);
        res.status(500).json({
            error: 'Error interno del servidor',
            message: 'Error actualizando el estado del pedido'
        });
    }
};

// Cancelar pedido
const cancelOrder = async (req, res) => {
    try {
        const userId = req.user.id;
        const orderId = req.params.id;
        const { razon = 'Cancelado por el usuario' } = req.body;
        
        // Verificar que el pedido existe y se puede cancelar
        const order = await executeQuery(
            'SELECT id_pedido, estado FROM Pedidos WHERE id_pedido = ? AND id_usuario = ?',
            [orderId, userId]
        );
        
        if (order.length === 0) {
            return res.status(404).json({
                error: 'Pedido no encontrado',
                message: 'El pedido no existe o no tienes permiso para cancelarlo'
            });
        }
        
        const currentState = order[0].estado;
        
        // Solo se pueden cancelar pedidos pendientes
        if (currentState !== 'Pendiente') {
            return res.status(400).json({
                error: 'No se puede cancelar',
                message: 'Solo se pueden cancelar pedidos en estado Pendiente'
            });
        }
        
        // Actualizar a cancelado
        await executeQuery(
            'UPDATE Pedidos SET estado = ?, notas = CONCAT(COALESCE(notas, ""), "\nCancelado: ", ?) WHERE id_pedido = ?',
            ['Cancelado', razon, orderId]
        );
        
        const updatedOrder = await getFullOrderById(orderId);
        
        res.json({
            success: true,
            message: 'Pedido cancelado correctamente',
            data: updatedOrder
        });
        
    } catch (error) {
        console.error('Error cancelando pedido:', error);
        res.status(500).json({
            error: 'Error interno del servidor',
            message: 'Error cancelando el pedido'
        });
    }
};

// Función auxiliar para obtener pedido completo
const getFullOrderById = async (orderId, userId = null) => {
    try {
        let whereClause = 'WHERE p.id_pedido = ?';
        let queryParams = [orderId];
        
        if (userId) {
            whereClause += ' AND p.id_usuario = ?';
            queryParams.push(userId);
        }
        
        const [order] = await executeQuery(
            `SELECT 
                p.id_pedido, p.id_usuario, p.estado, p.total, p.fecha_pedido, p.notas,
                p.metodo_pago, p.tipo_pedido, p.observaciones,
                c.id_cafeteria, c.nombre as cafeteria_nombre, c.edificio, c.telefono,
                u.nombre as usuario_nombre, u.apellido as usuario_apellido, u.correo
             FROM Pedidos p
             JOIN Cafeterias c ON p.id_cafeteria = c.id_cafeteria
             JOIN Usuarios u ON p.id_usuario = u.id_usuario
             ${whereClause}`,
            queryParams
        );
        
        if (!order) {
            return null;
        }
        
        const items = await executeQuery(
            `SELECT 
                dp.cantidad, dp.precio_unitario, dp.subtotal,
                pr.id_producto, pr.nombre, pr.descripcion, pr.categoria, pr.imagen
             FROM DetallePedidos dp
             JOIN Productos pr ON dp.id_producto = pr.id_producto
             WHERE dp.id_pedido = ?`,
            [orderId]
        );
        
        return {
            id_pedido: order.id_pedido,
            estado: order.estado,
            total: parseFloat(order.total),
            fecha_pedido: order.fecha_pedido,
            metodo_pago: order.metodo_pago,
            tipo_pedido: order.tipo_pedido,
            observaciones: order.observaciones,
            notas: order.notas,
            usuario: {
                id_usuario: order.id_usuario,
                nombre: order.usuario_nombre,
                apellido: order.usuario_apellido,
                correo: order.correo
            },
            cafeteria_info: {
                id_cafeteria: order.id_cafeteria,
                nombre: order.cafeteria_nombre,
                edificio: order.edificio,
                telefono: order.telefono
            },
            items: items.map(item => ({
                id_producto: item.id_producto,
                nombre: item.nombre,
                descripcion: item.descripcion,
                categoria: item.categoria,
                imagen: item.imagen,
                cantidad: item.cantidad,
                precio_unitario: parseFloat(item.precio_unitario),
                subtotal: parseFloat(item.subtotal)
            }))
        };
        
    } catch (error) {
        console.error('Error obteniendo pedido completo:', error);
        return null;
    }
};

module.exports = {
    createOrder,
    getUserOrders,
    getOrderById,
    updateOrderStatus,
    cancelOrder,
    getFullOrderById
};