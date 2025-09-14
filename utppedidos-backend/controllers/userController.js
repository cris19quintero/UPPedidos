// controllers/userController.js - Controlador para gestión de usuarios
const bcrypt = require('bcryptjs');
const { executeQuery, executeTransaction } = require('../config/database');
const { generateTokens } = require('../middleware/auth');

// Obtener perfil del usuario
const getUserProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        
        const user = await executeQuery(
            `SELECT id_usuario, nombre, apellido, correo, facultad, telefono, 
                    edificio_habitual, activo, fecha_registro, carrera, semestre, cedula
             FROM Usuarios WHERE id_usuario = ?`,
            [userId]
        );
        
        if (user.length === 0) {
            return res.status(404).json({
                error: 'Usuario no encontrado',
                message: 'El usuario no existe'
            });
        }
        
        // Obtener estadísticas del usuario
        const [totalPedidos] = await executeQuery(
            'SELECT COUNT(*) as count FROM Pedidos WHERE id_usuario = ?',
            [userId]
        );
        
        const [pedidosCompletados] = await executeQuery(
            'SELECT COUNT(*) as count FROM Pedidos WHERE id_usuario = ? AND estado IN ("Retirado", "Finalizado")',
            [userId]
        );
        
        const [totalGastado] = await executeQuery(
            'SELECT COALESCE(SUM(total), 0) as total FROM Pedidos WHERE id_usuario = ? AND estado IN ("Retirado", "Finalizado")',
            [userId]
        );
        
        const [cafeteriaFavorita] = await executeQuery(
            `SELECT c.nombre, COUNT(*) as visits
             FROM Pedidos p
             JOIN Cafeterias c ON p.id_cafeteria = c.id_cafeteria
             WHERE p.id_usuario = ?
             GROUP BY p.id_cafeteria, c.nombre
             ORDER BY visits DESC
             LIMIT 1`,
            [userId]
        );
        
        const userData = {
            ...user[0],
            estadisticas: {
                total_pedidos: totalPedidos[0].count,
                pedidos_completados: pedidosCompletados[0].count,
                pedidos_pendientes: totalPedidos[0].count - pedidosCompletados[0].count,
                total_gastado: parseFloat(totalGastado[0].total),
                cafeteria_favorita: cafeteriaFavorita.length > 0 ? {
                    nombre: cafeteriaFavorita[0].nombre
                } : null
            }
        };
        
        res.json({
            success: true,
            data: userData
        });
        
    } catch (error) {
        console.error('Error obteniendo perfil de usuario:', error);
        res.status(500).json({
            error: 'Error interno del servidor',
            message: 'Error obteniendo el perfil del usuario'
        });
    }
};

// Actualizar perfil del usuario
const updateUserProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const {
            nombre,
            apellido,
            telefono,
            facultad,
            edificio_habitual,
            carrera,
            semestre,
            cedula
        } = req.body;
        
        // Validaciones
        if (!nombre || !apellido) {
            return res.status(400).json({
                error: 'Datos requeridos',
                message: 'Nombre y apellido son obligatorios'
            });
        }
        
        if (nombre.length < 2 || apellido.length < 2) {
            return res.status(400).json({
                error: 'Datos inválidos',
                message: 'Nombre y apellido deben tener al menos 2 caracteres'
            });
        }
        
        // Actualizar usuario
        await executeQuery(
            `UPDATE Usuarios 
             SET nombre = ?, apellido = ?, telefono = ?, facultad = ?, 
                 edificio_habitual = ?, carrera = ?, semestre = ?, cedula = ?
             WHERE id_usuario = ?`,
            [nombre, apellido, telefono, facultad, edificio_habitual, 
             carrera, semestre, cedula, userId]
        );
        
        // Obtener usuario actualizado
        const updatedUser = await executeQuery(
            `SELECT id_usuario, nombre, apellido, correo, facultad, telefono, 
                    edificio_habitual, carrera, semestre, cedula, activo, fecha_registro
             FROM Usuarios WHERE id_usuario = ?`,
            [userId]
        );
        
        res.json({
            success: true,
            message: 'Perfil actualizado correctamente',
            data: updatedUser[0]
        });
        
    } catch (error) {
        console.error('Error actualizando perfil de usuario:', error);
        res.status(500).json({
            error: 'Error interno del servidor',
            message: 'Error actualizando el perfil'
        });
    }
};

// Obtener pedidos del usuario
const getUserOrders = async (req, res) => {
    try {
        const userId = req.user.id;
        const { page = 1, limit = 10, status } = req.query;
        
        const offset = (page - 1) * limit;
        
        let whereClause = 'WHERE p.id_usuario = ?';
        let queryParams = [userId];
        
        if (status) {
            whereClause += ' AND p.estado = ?';
            queryParams.push(status);
        }
        
        // Obtener pedidos con detalles
        const orders = await executeQuery(
            `SELECT 
                p.id_pedido, p.estado, p.total, p.fecha_pedido, p.notas,
                p.metodo_pago, p.tipo_pedido, p.observaciones,
                c.id_cafeteria, c.nombre as cafeteria_nombre, c.edificio,
                COUNT(dp.id_detalle) as total_items
             FROM Pedidos p
             LEFT JOIN Cafeterias c ON p.id_cafeteria = c.id_cafeteria
             LEFT JOIN DetallePedidos dp ON p.id_pedido = dp.id_pedido
             ${whereClause}
             GROUP BY p.id_pedido
             ORDER BY p.fecha_pedido DESC
             LIMIT ? OFFSET ?`,
            [...queryParams, parseInt(limit), offset]
        );
        
        // Obtener detalles de items para cada pedido
        const ordersWithDetails = await Promise.all(
            orders.map(async (order) => {
                const items = await executeQuery(
                    `SELECT 
                        dp.cantidad, dp.precio_unitario, dp.subtotal,
                        pr.nombre, pr.descripcion, pr.categoria
                     FROM DetallePedidos dp
                     JOIN Productos pr ON dp.id_producto = pr.id_producto
                     WHERE dp.id_pedido = ?`,
                    [order.id_pedido]
                );
                
                return {
                    ...order,
                    cafeteria_info: {
                        id: order.id_cafeteria,
                        nombre: order.cafeteria_nombre,
                        edificio: order.edificio
                    },
                    items: items
                };
            })
        );
        
        // Contar total de pedidos para paginación
        const [totalCount] = await executeQuery(
            `SELECT COUNT(*) as count FROM Pedidos ${whereClause}`,
            queryParams.slice(0, -2) // Remover limit y offset
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
        console.error('Error obteniendo pedidos del usuario:', error);
        res.status(500).json({
            error: 'Error interno del servidor',
            message: 'Error obteniendo los pedidos'
        });
    }
};

// Obtener estadísticas del usuario
const getUserStats = async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Estadísticas generales
        const [generalStats] = await executeQuery(
            `SELECT 
                COUNT(*) as total_pedidos,
                COUNT(CASE WHEN estado IN ('Retirado', 'Finalizado') THEN 1 END) as pedidos_completados,
                COUNT(CASE WHEN estado IN ('Pendiente', 'Por Retirar') THEN 1 END) as pedidos_pendientes,
                COALESCE(SUM(CASE WHEN estado IN ('Retirado', 'Finalizado') THEN total ELSE 0 END), 0) as total_gastado,
                COALESCE(AVG(CASE WHEN estado IN ('Retirado', 'Finalizado') THEN total END), 0) as ticket_promedio
             FROM Pedidos 
             WHERE id_usuario = ?`,
            [userId]
        );
        
        // Productos más pedidos
        const favoriteProducts = await executeQuery(
            `SELECT 
                pr.nombre, 
                SUM(dp.cantidad) as total_pedido,
                AVG(dp.precio_unitario) as precio_promedio
             FROM DetallePedidos dp
             JOIN Productos pr ON dp.id_producto = pr.id_producto
             JOIN Pedidos p ON dp.id_pedido = p.id_pedido
             WHERE p.id_usuario = ? AND p.estado IN ('Retirado', 'Finalizado')
             GROUP BY dp.id_producto, pr.nombre
             ORDER BY total_pedido DESC
             LIMIT 5`,
            [userId]
        );
        
        // Gastos por mes (últimos 6 meses)
        const monthlySpending = await executeQuery(
            `SELECT 
                DATE_FORMAT(fecha_pedido, '%Y-%m') as mes,
                SUM(total) as total_mes,
                COUNT(*) as pedidos_mes
             FROM Pedidos
             WHERE id_usuario = ? 
                AND estado IN ('Retirado', 'Finalizado')
                AND fecha_pedido >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
             GROUP BY DATE_FORMAT(fecha_pedido, '%Y-%m')
             ORDER BY mes DESC`,
            [userId]
        );
        
        // Cafeterías más visitadas
        const favoriteCafeterias = await executeQuery(
            `SELECT 
                c.nombre, 
                COUNT(*) as visitas,
                SUM(p.total) as total_gastado
             FROM Pedidos p
             JOIN Cafeterias c ON p.id_cafeteria = c.id_cafeteria
             WHERE p.id_usuario = ? AND p.estado IN ('Retirado', 'Finalizado')
             GROUP BY p.id_cafeteria, c.nombre
             ORDER BY visitas DESC
             LIMIT 3`,
            [userId]
        );
        
        res.json({
            success: true,
            data: {
                general: {
                    total_pedidos: generalStats[0].total_pedidos,
                    pedidos_completados: generalStats[0].pedidos_completados,
                    pedidos_pendientes: generalStats[0].pedidos_pendientes,
                    total_gastado: parseFloat(generalStats[0].total_gastado),
                    ticket_promedio: parseFloat(generalStats[0].ticket_promedio)
                },
                productos_favoritos: favoriteProducts.map(product => ({
                    nombre: product.nombre,
                    total_pedido: product.total_pedido,
                    precio_promedio: parseFloat(product.precio_promedio)
                })),
                gastos_mensuales: monthlySpending.map(month => ({
                    mes: month.mes,
                    total: parseFloat(month.total_mes),
                    pedidos: month.pedidos_mes
                })),
                cafeterias_favoritas: favoriteCafeterias.map(cafeteria => ({
                    nombre: cafeteria.nombre,
                    visitas: cafeteria.visitas,
                    total_gastado: parseFloat(cafeteria.total_gastado)
                }))
            }
        });
        
    } catch (error) {
        console.error('Error obteniendo estadísticas del usuario:', error);
        res.status(500).json({
            error: 'Error interno del servidor',
            message: 'Error obteniendo las estadísticas'
        });
    }
};

// Cambiar contraseña
const changePassword = async (req, res) => {
    try {
        const userId = req.user.id;
        const { currentPassword, newPassword } = req.body;
        
        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                error: 'Datos requeridos',
                message: 'Contraseña actual y nueva son requeridas'
            });
        }
        
        if (newPassword.length < 6) {
            return res.status(400).json({
                error: 'Contraseña débil',
                message: 'La nueva contraseña debe tener al menos 6 caracteres'
            });
        }
        
        // Obtener contraseña actual
        const user = await executeQuery(
            'SELECT contrasena FROM Usuarios WHERE id_usuario = ?',
            [userId]
        );
        
        if (user.length === 0) {
            return res.status(404).json({
                error: 'Usuario no encontrado'
            });
        }
        
        // Verificar contraseña actual
        const isValidPassword = await bcrypt.compare(currentPassword, user[0].contrasena);
        
        if (!isValidPassword) {
            return res.status(400).json({
                error: 'Contraseña incorrecta',
                message: 'La contraseña actual no es correcta'
            });
        }
        
        // Encriptar nueva contraseña
        const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
        const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
        
        // Actualizar contraseña
        await executeQuery(
            'UPDATE Usuarios SET contrasena = ? WHERE id_usuario = ?',
            [hashedPassword, userId]
        );
        
        res.json({
            success: true,
            message: 'Contraseña actualizada correctamente'
        });
        
    } catch (error) {
        console.error('Error cambiando contraseña:', error);
        res.status(500).json({
            error: 'Error interno del servidor',
            message: 'Error actualizando la contraseña'
        });
    }
};

// Eliminar cuenta (desactivar)
const deactivateAccount = async (req, res) => {
    try {
        const userId = req.user.id;
        const { password, reason } = req.body;
        
        if (!password) {
            return res.status(400).json({
                error: 'Contraseña requerida',
                message: 'Debes confirmar tu contraseña para desactivar la cuenta'
            });
        }
        
        // Verificar contraseña
        const user = await executeQuery(
            'SELECT contrasena FROM Usuarios WHERE id_usuario = ?',
            [userId]
        );
        
        const isValidPassword = await bcrypt.compare(password, user[0].contrasena);
        
        if (!isValidPassword) {
            return res.status(400).json({
                error: 'Contraseña incorrecta'
            });
        }
        
        // Desactivar usuario
        await executeQuery(
            'UPDATE Usuarios SET activo = FALSE WHERE id_usuario = ?',
            [userId]
        );
        
        // Log de desactivación (opcional)
        console.log(`Usuario ${userId} desactivado. Razón: ${reason || 'No especificada'}`);
        
        res.json({
            success: true,
            message: 'Cuenta desactivada correctamente'
        });
        
    } catch (error) {
        console.error('Error desactivando cuenta:', error);
        res.status(500).json({
            error: 'Error interno del servidor',
            message: 'Error desactivando la cuenta'
        });
    }
};

module.exports = {
    getUserProfile,
    updateUserProfile,
    getUserOrders,
    getUserStats,
    changePassword,
    deactivateAccount
};