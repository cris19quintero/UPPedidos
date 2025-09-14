// ===== controllers/userController.js - MIGRADO A FIREBASE =====
const bcrypt = require('bcryptjs');
const { getDB, serverTimestamp } = require('../config/database');

// Obtener perfil del usuario
const getUserProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const db = getDB();
        
        const userDoc = await db.collection('usuarios').doc(userId).get();
        
        if (!userDoc.exists) {
            return res.status(404).json({
                success: false,
                error: 'Usuario no encontrado',
                message: 'El usuario no existe'
            });
        }
        
        const userData = userDoc.data();
        delete userData.contrasena; // No enviar contraseña
        
        // Obtener estadísticas del usuario
        const pedidosSnapshot = await db.collection('pedidos')
            .where('id_usuario', '==', userId)
            .get();
        
        let totalPedidos = 0;
        let pedidosCompletados = 0;
        let pedidosPendientes = 0;
        let totalGastado = 0;
        const cafeteriaVisitas = new Map();
        
        pedidosSnapshot.docs.forEach(doc => {
            const pedido = doc.data();
            totalPedidos++;
            
            if (['Retirado', 'Finalizado'].includes(pedido.estado)) {
                pedidosCompletados++;
                totalGastado += pedido.total || 0;
            } else if (['Pendiente', 'Por Retirar'].includes(pedido.estado)) {
                pedidosPendientes++;
            }
            
            // Contar visitas por cafetería
            if (pedido.cafeteria_nombre) {
                const current = cafeteriaVisitas.get(pedido.cafeteria_nombre) || 0;
                cafeteriaVisitas.set(pedido.cafeteria_nombre, current + 1);
            }
        });
        
        // Encontrar cafetería favorita
        let cafeteriaFavorita = null;
        if (cafeteriaVisitas.size > 0) {
            const [nombre, visitas] = [...cafeteriaVisitas.entries()]
                .sort((a, b) => b[1] - a[1])[0];
            cafeteriaFavorita = { nombre };
        }
        
        const userProfile = {
            ...userData,
            estadisticas: {
                total_pedidos: totalPedidos,
                pedidos_completados: pedidosCompletados,
                pedidos_pendientes: pedidosPendientes,
                total_gastado: totalGastado,
                cafeteria_favorita: cafeteriaFavorita
            }
        };
        
        res.json({
            success: true,
            data: userProfile
        });
        
    } catch (error) {
        console.error('Error obteniendo perfil de usuario:', error);
        res.status(500).json({
            success: false,
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
        const db = getDB();
        
        // Validaciones
        if (!nombre || !apellido) {
            return res.status(400).json({
                success: false,
                error: 'Datos requeridos',
                message: 'Nombre y apellido son obligatorios'
            });
        }
        
        if (nombre.length < 2 || apellido.length < 2) {
            return res.status(400).json({
                success: false,
                error: 'Datos inválidos',
                message: 'Nombre y apellido deben tener al menos 2 caracteres'
            });
        }
        
        // Preparar datos para actualizar
        const updateData = {
            nombre: nombre.trim(),
            apellido: apellido.trim(),
            telefono: telefono || null,
            facultad: facultad || null,
            edificio_habitual: edificio_habitual || null,
            carrera: carrera || null,
            semestre: semestre ? parseInt(semestre) : null,
            cedula: cedula || null,
            ultima_actividad: serverTimestamp()
        };
        
        // Actualizar usuario en Firebase
        await db.collection('usuarios').doc(userId).update(updateData);
        
        // Obtener usuario actualizado
        const updatedUserDoc = await db.collection('usuarios').doc(userId).get();
        const updatedUser = updatedUserDoc.data();
        delete updatedUser.contrasena;
        
        res.json({
            success: true,
            message: 'Perfil actualizado correctamente',
            data: updatedUser
        });
        
    } catch (error) {
        console.error('Error actualizando perfil de usuario:', error);
        res.status(500).json({
            success: false,
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
        const db = getDB();
        
        let pedidosQuery = db.collection('pedidos')
            .where('id_usuario', '==', userId)
            .orderBy('fecha_pedido', 'desc');
        
        if (status) {
            pedidosQuery = pedidosQuery.where('estado', '==', status);
        }
        
        // Aplicar paginación (simplificada)
        const limitNum = parseInt(limit);
        pedidosQuery = pedidosQuery.limit(limitNum);
        
        const pedidosSnapshot = await pedidosQuery.get();
        
        const ordersWithDetails = [];
        for (const pedidoDoc of pedidosSnapshot.docs) {
            const pedido = { id: pedidoDoc.id, ...pedidoDoc.data() };
            
            // Obtener items del pedido
            const itemsSnapshot = await pedidoDoc.ref.collection('items').get();
            pedido.items = itemsSnapshot.docs.map(doc => doc.data());
            
            // Convertir timestamps
            if (pedido.fecha_pedido && pedido.fecha_pedido.toDate) {
                pedido.fecha_pedido = pedido.fecha_pedido.toDate();
            }
            
            // Obtener información de cafetería si no está incluida
            if (pedido.id_cafeteria && !pedido.cafeteria_nombre) {
                const cafeteriaDoc = await db.collection('cafeterias').doc(pedido.id_cafeteria).get();
                if (cafeteriaDoc.exists) {
                    const cafeteria = cafeteriaDoc.data();
                    pedido.cafeteria_info = {
                        id: pedido.id_cafeteria,
                        nombre: cafeteria.nombre,
                        edificio: cafeteria.edificio
                    };
                }
            } else if (pedido.cafeteria_nombre) {
                pedido.cafeteria_info = {
                    id: pedido.id_cafeteria,
                    nombre: pedido.cafeteria_nombre,
                    edificio: pedido.cafeteria_edificio
                };
            }
            
            ordersWithDetails.push(pedido);
        }
        
        res.json({
            success: true,
            data: ordersWithDetails,
            pagination: {
                page: parseInt(page),
                limit: limitNum,
                total: ordersWithDetails.length
            }
        });
        
    } catch (error) {
        console.error('Error obteniendo pedidos del usuario:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor',
            message: 'Error obteniendo los pedidos'
        });
    }
};

// Obtener estadísticas del usuario
const getUserStats = async (req, res) => {
    try {
        const userId = req.user.id;
        const db = getDB();
        
        // Obtener todos los pedidos del usuario
        const pedidosSnapshot = await db.collection('pedidos')
            .where('id_usuario', '==', userId)
            .get();
        
        let totalPedidos = 0;
        let pedidosCompletados = 0;
        let pedidosPendientes = 0;
        let totalGastado = 0;
        const productosMap = new Map();
        const cafeteriasMap = new Map();
        const gastosPorMes = new Map();
        
        for (const pedidoDoc of pedidosSnapshot.docs) {
            const pedido = pedidoDoc.data();
            totalPedidos++;
            
            const esCompletado = ['Retirado', 'Finalizado'].includes(pedido.estado);
            const esPendiente = ['Pendiente', 'Por Retirar'].includes(pedido.estado);
            
            if (esCompletado) {
                pedidosCompletados++;
                totalGastado += pedido.total || 0;
                
                // Gastos por mes
                if (pedido.fecha_pedido && pedido.fecha_pedido.toDate) {
                    const fecha = pedido.fecha_pedido.toDate();
                    const mesKey = fecha.getFullYear() + '-' + String(fecha.getMonth() + 1).padStart(2, '0');
                    const current = gastosPorMes.get(mesKey) || { total: 0, pedidos: 0 };
                    gastosPorMes.set(mesKey, {
                        total: current.total + (pedido.total || 0),
                        pedidos: current.pedidos + 1
                    });
                }
                
                // Cafeterías favoritas
                if (pedido.cafeteria_nombre) {
                    const current = cafeteriasMap.get(pedido.cafeteria_nombre) || { visitas: 0, gastado: 0 };
                    cafeteriasMap.set(pedido.cafeteria_nombre, {
                        visitas: current.visitas + 1,
                        gastado: current.gastado + (pedido.total || 0)
                    });
                }
                
                // Obtener items del pedido para productos favoritos
                const itemsSnapshot = await pedidoDoc.ref.collection('items').get();
                itemsSnapshot.docs.forEach(itemDoc => {
                    const item = itemDoc.data();
                    const current = productosMap.get(item.nombre) || { cantidad: 0, precio: 0 };
                    productosMap.set(item.nombre, {
                        cantidad: current.cantidad + item.cantidad,
                        precio: item.precio_unitario
                    });
                });
            } else if (esPendiente) {
                pedidosPendientes++;
            }
        }
        
        const ticketPromedio = pedidosCompletados > 0 ? totalGastado / pedidosCompletados : 0;
        
        // Top 5 productos favoritos
        const productosOrdenados = [...productosMap.entries()]
            .sort((a, b) => b[1].cantidad - a[1].cantidad)
            .slice(0, 5)
            .map(([nombre, data]) => ({
                nombre,
                total_pedido: data.cantidad,
                precio_promedio: data.precio
            }));
        
        // Top 3 cafeterías favoritas
        const cafeteriasOrdenadas = [...cafeteriasMap.entries()]
            .sort((a, b) => b[1].visitas - a[1].visitas)
            .slice(0, 3)
            .map(([nombre, data]) => ({
                nombre,
                visitas: data.visitas,
                total_gastado: data.gastado
            }));
        
        // Gastos mensuales (últimos 6 meses)
        const gastosMensualesArray = [...gastosPorMes.entries()]
            .sort((a, b) => b[0].localeCompare(a[0]))
            .slice(0, 6)
            .map(([mes, data]) => ({
                mes,
                total: data.total,
                pedidos: data.pedidos
            }));
        
        res.json({
            success: true,
            data: {
                general: {
                    total_pedidos: totalPedidos,
                    pedidos_completados: pedidosCompletados,
                    pedidos_pendientes: pedidosPendientes,
                    total_gastado: totalGastado,
                    ticket_promedio: ticketPromedio
                },
                productos_favoritos: productosOrdenados,
                gastos_mensuales: gastosMensualesArray,
                cafeterias_favoritas: cafeteriasOrdenadas
            }
        });
        
    } catch (error) {
        console.error('Error obteniendo estadísticas del usuario:', error);
        res.status(500).json({
            success: false,
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
        const db = getDB();
        
        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                error: 'Datos requeridos',
                message: 'Contraseña actual y nueva son requeridas'
            });
        }
        
        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                error: 'Contraseña débil',
                message: 'La nueva contraseña debe tener al menos 6 caracteres'
            });
        }
        
        // Obtener usuario
        const userDoc = await db.collection('usuarios').doc(userId).get();
        
        if (!userDoc.exists) {
            return res.status(404).json({
                success: false,
                error: 'Usuario no encontrado'
            });
        }
        
        const userData = userDoc.data();
        
        // Verificar contraseña actual
        const isValidPassword = await bcrypt.compare(currentPassword, userData.contrasena);
        
        if (!isValidPassword) {
            return res.status(400).json({
                success: false,
                error: 'Contraseña incorrecta',
                message: 'La contraseña actual no es correcta'
            });
        }
        
        // Encriptar nueva contraseña
        const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
        const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
        
        // Actualizar contraseña
        await userDoc.ref.update({
            contrasena: hashedPassword,
            ultima_actividad: serverTimestamp()
        });
        
        res.json({
            success: true,
            message: 'Contraseña actualizada correctamente'
        });
        
    } catch (error) {
        console.error('Error cambiando contraseña:', error);
        res.status(500).json({
            success: false,
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
        const db = getDB();
        
        if (!password) {
            return res.status(400).json({
                success: false,
                error: 'Contraseña requerida',
                message: 'Debes confirmar tu contraseña para desactivar la cuenta'
            });
        }
        
        // Obtener usuario
        const userDoc = await db.collection('usuarios').doc(userId).get();
        
        if (!userDoc.exists) {
            return res.status(404).json({
                success: false,
                error: 'Usuario no encontrado'
            });
        }
        
        const userData = userDoc.data();
        
        // Verificar contraseña
        const isValidPassword = await bcrypt.compare(password, userData.contrasena);
        
        if (!isValidPassword) {
            return res.status(400).json({
                success: false,
                error: 'Contraseña incorrecta'
            });
        }
        
        // Desactivar usuario
        await userDoc.ref.update({
            activo: false,
            fecha_desactivacion: serverTimestamp(),
            motivo_desactivacion: reason || 'No especificado'
        });
        
        // Log de desactivación
        console.log(`Usuario ${userId} desactivado. Razón: ${reason || 'No especificada'}`);
        
        res.json({
            success: true,
            message: 'Cuenta desactivada correctamente'
        });
        
    } catch (error) {
        console.error('Error desactivando cuenta:', error);
        res.status(500).json({
            success: false,
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
