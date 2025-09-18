// ===== controllers/userController.js - MEJORADO CON FIREBASE =====
const bcrypt = require('bcryptjs');
const { getDB, serverTimestamp } = require('../config/database');

// Cache en memoria para estadísticas (en producción usar Redis)
const statsCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

// Validaciones mejoradas
const validateUserData = (data) => {
    const errors = [];
    
    if (!data.nombre || data.nombre.trim().length < 2) {
        errors.push('El nombre debe tener al menos 2 caracteres');
    }
    
    if (!data.apellido || data.apellido.trim().length < 2) {
        errors.push('El apellido debe tener al menos 2 caracteres');
    }
    
    // Validar teléfono panameño
    if (data.telefono) {
        const phoneRegex = /^\+?507[-\s]?\d{4}[-\s]?\d{4}$/;
        if (!phoneRegex.test(data.telefono.replace(/\s/g, ''))) {
            errors.push('Formato de teléfono inválido para Panamá (ej: +507 1234-5678)');
        }
    }
    
    // Validar semestre
    if (data.semestre && (data.semestre < 1 || data.semestre > 12)) {
        errors.push('El semestre debe estar entre 1 y 12');
    }
    
    // Validar cédula panameña
    if (data.cedula) {
        const cedulaRegex = /^\d{1,2}-\d{1,4}-\d{1,6}$/;
        if (!cedulaRegex.test(data.cedula)) {
            errors.push('Formato de cédula inválido (ej: 8-123-456)');
        }
    }
    
    // Validar caracteres especiales en nombres
    const nameRegex = /^[a-zA-ZÀ-ÿ\u00f1\u00d1\s]+$/;
    if (data.nombre && !nameRegex.test(data.nombre)) {
        errors.push('El nombre solo puede contener letras y espacios');
    }
    
    if (data.apellido && !nameRegex.test(data.apellido)) {
        errors.push('El apellido solo puede contener letras y espacios');
    }
    
    return errors;
};

// Validar fortaleza de contraseña
const validatePasswordStrength = (password) => {
    const errors = [];
    
    if (password.length < 8) {
        errors.push('La contraseña debe tener al menos 8 caracteres');
    }
    
    if (!/[a-z]/.test(password)) {
        errors.push('La contraseña debe tener al menos una letra minúscula');
    }
    
    if (!/[A-Z]/.test(password)) {
        errors.push('La contraseña debe tener al menos una letra mayúscula');
    }
    
    if (!/\d/.test(password)) {
        errors.push('La contraseña debe tener al menos un número');
    }
    
    // Verificar contraseñas comunes
    const commonPasswords = ['123456', 'password', 'qwerty', 'abc123', '123456789', 'password123'];
    if (commonPasswords.includes(password.toLowerCase())) {
        errors.push('Esta contraseña es muy común, elige una más segura');
    }
    
    return errors;
};

// Obtener perfil del usuario mejorado
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
        
        // Verificar cache de estadísticas
        const cacheKey = `stats_${userId}`;
        const cached = statsCache.get(cacheKey);
        
        if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
            return res.json({
                success: true,
                data: {
                    ...userData,
                    estadisticas: cached.data
                }
            });
        }
        
        // Obtener estadísticas del usuario
        const pedidosSnapshot = await db.collection('pedidos')
            .where('id_usuario', '==', userId)
            .get();
        
        let totalPedidos = 0;
        let pedidosCompletados = 0;
        let pedidosPendientes = 0;
        let pedidosCancelados = 0;
        let totalGastado = 0;
        const cafeteriaVisitas = new Map();
        
        pedidosSnapshot.docs.forEach(doc => {
            const pedido = doc.data();
            totalPedidos++;
            
            switch (pedido.estado) {
                case 'Retirado':
                case 'Finalizado':
                    pedidosCompletados++;
                    totalGastado += pedido.total || 0;
                    break;
                case 'Pendiente':
                case 'Por Retirar':
                case 'En Preparación':
                    pedidosPendientes++;
                    break;
                case 'Cancelado':
                    pedidosCancelados++;
                    break;
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
            cafeteriaFavorita = { nombre, visitas };
        }
        
        const estadisticas = {
            total_pedidos: totalPedidos,
            pedidos_completados: pedidosCompletados,
            pedidos_pendientes: pedidosPendientes,
            pedidos_cancelados: pedidosCancelados,
            total_gastado: totalGastado,
            ticket_promedio: pedidosCompletados > 0 ? totalGastado / pedidosCompletados : 0,
            cafeteria_favorita: cafeteriaFavorita
        };
        
        // Guardar en cache
        statsCache.set(cacheKey, {
            data: estadisticas,
            timestamp: Date.now()
        });
        
        const userProfile = {
            ...userData,
            estadisticas
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

// Actualizar perfil del usuario mejorado
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
            cedula,
            configuracion
        } = req.body;
        const db = getDB();
        
        // Validaciones mejoradas
        const validationErrors = validateUserData(req.body);
        if (validationErrors.length > 0) {
            return res.status(400).json({
                success: false,
                error: 'Datos inválidos',
                message: validationErrors.join(', ')
            });
        }
        
        // Verificar si el usuario existe
        const userDoc = await db.collection('usuarios').doc(userId).get();
        if (!userDoc.exists) {
            return res.status(404).json({
                success: false,
                error: 'Usuario no encontrado'
            });
        }
        
        // Verificar cédula única si se cambió
        if (cedula && cedula !== userDoc.data().cedula) {
            const existingCedulaQuery = await db.collection('usuarios')
                .where('cedula', '==', cedula.trim())
                .get();
            
            if (!existingCedulaQuery.empty) {
                return res.status(409).json({
                    success: false,
                    error: 'Cédula ya registrada',
                    message: 'Ya existe un usuario registrado con esta cédula'
                });
            }
        }
        
        // Preparar datos para actualizar
        const updateData = {
            nombre: nombre.trim(),
            apellido: apellido.trim(),
            telefono: telefono ? telefono.replace(/\s/g, '') : null,
            facultad: facultad || null,
            edificio_habitual: edificio_habitual || null,
            carrera: carrera || null,
            semestre: semestre ? parseInt(semestre) : null,
            cedula: cedula ? cedula.trim() : null,
            ultima_actividad: serverTimestamp()
        };
        
        // Actualizar configuración si se proporciona
        if (configuracion) {
            updateData.configuracion = {
                ...userDoc.data().configuracion,
                ...configuracion
            };
        }
        
        // Actualizar usuario en Firebase
        await db.collection('usuarios').doc(userId).update(updateData);
        
        // Limpiar cache de estadísticas
        statsCache.delete(`stats_${userId}`);
        
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

// Obtener pedidos del usuario mejorado
const getUserOrders = async (req, res) => {
    try {
        const userId = req.user.id;
        const { 
            page = 1, 
            limit = 10, 
            status, 
            startDate, 
            endDate,
            cafeteriaId 
        } = req.query;
        const db = getDB();
        
        let pedidosQuery = db.collection('pedidos')
            .where('id_usuario', '==', userId);
        
        // Filtros adicionales
        if (status) {
            pedidosQuery = pedidosQuery.where('estado', '==', status);
        }
        
        if (cafeteriaId) {
            pedidosQuery = pedidosQuery.where('id_cafeteria', '==', cafeteriaId);
        }
        
        // Ordenar por fecha
        pedidosQuery = pedidosQuery.orderBy('fecha_pedido', 'desc');
        
        // Paginación mejorada
        const limitNum = Math.min(parseInt(limit), 50); // Máximo 50 por página
        const offset = (parseInt(page) - 1) * limitNum;
        
        if (offset > 0) {
            // En una implementación real, necesitarías usar startAfter con un cursor
            pedidosQuery = pedidosQuery.offset(offset);
        }
        
        pedidosQuery = pedidosQuery.limit(limitNum);
        
        const pedidosSnapshot = await pedidosQuery.get();
        
        const ordersWithDetails = [];
        for (const pedidoDoc of pedidosSnapshot.docs) {
            const pedido = { id: pedidoDoc.id, ...pedidoDoc.data() };
            
            // Filtro por fechas (si se especifica)
            if (startDate || endDate) {
                const fechaPedido = pedido.fecha_pedido?.toDate();
                if (fechaPedido) {
                    if (startDate && fechaPedido < new Date(startDate)) continue;
                    if (endDate && fechaPedido > new Date(endDate)) continue;
                }
            }
            
            // Obtener items del pedido
            const itemsSnapshot = await pedidoDoc.ref.collection('items').get();
            pedido.items = itemsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
            // Convertir timestamps
            if (pedido.fecha_pedido && pedido.fecha_pedido.toDate) {
                pedido.fecha_pedido = pedido.fecha_pedido.toDate().toISOString();
            }
            
            if (pedido.fecha_entrega && pedido.fecha_entrega.toDate) {
                pedido.fecha_entrega = pedido.fecha_entrega.toDate().toISOString();
            }
            
            // Obtener información de cafetería si no está incluida
            if (pedido.id_cafeteria && !pedido.cafeteria_nombre) {
                try {
                    const cafeteriaDoc = await db.collection('cafeterias').doc(pedido.id_cafeteria).get();
                    if (cafeteriaDoc.exists) {
                        const cafeteria = cafeteriaDoc.data();
                        pedido.cafeteria_info = {
                            id: pedido.id_cafeteria,
                            nombre: cafeteria.nombre,
                            edificio: cafeteria.edificio
                        };
                    }
                } catch (cafeteriaError) {
                    console.error('Error obteniendo info de cafetería:', cafeteriaError);
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
        
        // Obtener total de pedidos para paginación
        const totalQuery = await db.collection('pedidos')
            .where('id_usuario', '==', userId)
            .get();
        
        const totalItems = totalQuery.size;
        const totalPages = Math.ceil(totalItems / limitNum);
        
        res.json({
            success: true,
            data: ordersWithDetails,
            pagination: {
                page: parseInt(page),
                limit: limitNum,
                total: totalItems,
                totalPages,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
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

// Obtener estadísticas detalladas del usuario
const getUserStats = async (req, res) => {
    try {
        const userId = req.user.id;
        const { period = '6months' } = req.query; // 1month, 3months, 6months, 1year, all
        const db = getDB();
        
        // Verificar cache
        const cacheKey = `detailed_stats_${userId}_${period}`;
        const cached = statsCache.get(cacheKey);
        
        if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
            return res.json({
                success: true,
                data: cached.data
            });
        }
        
        // Calcular fecha de inicio según el período
        let startDate = null;
        switch (period) {
            case '1month':
                startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
                break;
            case '3months':
                startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
                break;
            case '6months':
                startDate = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);
                break;
            case '1year':
                startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
                break;
            // 'all' no tiene fecha de inicio
        }
        
        // Construir query
        let pedidosQuery = db.collection('pedidos')
            .where('id_usuario', '==', userId);
        
        if (startDate) {
            pedidosQuery = pedidosQuery.where('fecha_pedido', '>=', startDate);
        }
        
        const pedidosSnapshot = await pedidosQuery.get();
        
        let totalPedidos = 0;
        let pedidosCompletados = 0;
        let pedidosPendientes = 0;
        let pedidosCancelados = 0;
        let totalGastado = 0;
        const productosMap = new Map();
        const cafeteriasMap = new Map();
        const gastosPorMes = new Map();
        const gastosPorDia = new Map();
        const horariosMap = new Map();
        
        for (const pedidoDoc of pedidosSnapshot.docs) {
            const pedido = pedidoDoc.data();
            totalPedidos++;
            
            const fechaPedido = pedido.fecha_pedido?.toDate();
            const esCompletado = ['Retirado', 'Finalizado'].includes(pedido.estado);
            const esPendiente = ['Pendiente', 'Por Retirar', 'En Preparación'].includes(pedido.estado);
            const esCancelado = pedido.estado === 'Cancelado';
            
            if (esCompletado) {
                pedidosCompletados++;
                totalGastado += pedido.total || 0;
                
                // Análisis temporal
                if (fechaPedido) {
                    // Gastos por mes
                    const mesKey = fechaPedido.getFullYear() + '-' + String(fechaPedido.getMonth() + 1).padStart(2, '0');
                    const currentMes = gastosPorMes.get(mesKey) || { total: 0, pedidos: 0 };
                    gastosPorMes.set(mesKey, {
                        total: currentMes.total + (pedido.total || 0),
                        pedidos: currentMes.pedidos + 1
                    });
                    
                    // Gastos por día de la semana
                    const diaSemana = fechaPedido.getDay(); // 0 = domingo
                    const diasNombres = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
                    const nombreDia = diasNombres[diaSemana];
                    const currentDia = gastosPorDia.get(nombreDia) || { total: 0, pedidos: 0 };
                    gastosPorDia.set(nombreDia, {
                        total: currentDia.total + (pedido.total || 0),
                        pedidos: currentDia.pedidos + 1
                    });
                    
                    // Análisis de horarios
                    const hora = fechaPedido.getHours();
                    let franjaHoraria;
                    if (hora >= 6 && hora < 11) franjaHoraria = 'Mañana (6-11)';
                    else if (hora >= 11 && hora < 15) franjaHoraria = 'Almuerzo (11-15)';
                    else if (hora >= 15 && hora < 20) franjaHoraria = 'Tarde (15-20)';
                    else franjaHoraria = 'Noche (20-6)';
                    
                    const currentHorario = horariosMap.get(franjaHoraria) || { pedidos: 0, total: 0 };
                    horariosMap.set(franjaHoraria, {
                        pedidos: currentHorario.pedidos + 1,
                        total: currentHorario.total + (pedido.total || 0)
                    });
                }
                
                // Cafeterías favoritas
                if (pedido.cafeteria_nombre) {
                    const current = cafeteriasMap.get(pedido.cafeteria_nombre) || { 
                        visitas: 0, 
                        gastado: 0,
                        ultimo_pedido: null
                    };
                    cafeteriasMap.set(pedido.cafeteria_nombre, {
                        visitas: current.visitas + 1,
                        gastado: current.gastado + (pedido.total || 0),
                        ultimo_pedido: fechaPedido || current.ultimo_pedido
                    });
                }
                
                // Obtener items del pedido para productos favoritos
                try {
                    const itemsSnapshot = await pedidoDoc.ref.collection('items').get();
                    itemsSnapshot.docs.forEach(itemDoc => {
                        const item = itemDoc.data();
                        const current = productosMap.get(item.nombre) || { 
                            cantidad: 0, 
                            precio: 0,
                            total_gastado: 0,
                            veces_pedido: 0
                        };
                        productosMap.set(item.nombre, {
                            cantidad: current.cantidad + item.cantidad,
                            precio: item.precio_unitario,
                            total_gastado: current.total_gastado + (item.cantidad * item.precio_unitario),
                            veces_pedido: current.veces_pedido + 1
                        });
                    });
                } catch (itemsError) {
                    console.error('Error obteniendo items:', itemsError);
                }
            } else if (esPendiente) {
                pedidosPendientes++;
            } else if (esCancelado) {
                pedidosCancelados++;
            }
        }
        
        const ticketPromedio = pedidosCompletados > 0 ? totalGastado / pedidosCompletados : 0;
        
        // Top 10 productos favoritos
        const productosOrdenados = [...productosMap.entries()]
            .sort((a, b) => b[1].cantidad - a[1].cantidad)
            .slice(0, 10)
            .map(([nombre, data]) => ({
                nombre,
                total_cantidad: data.cantidad,
                precio_unitario: data.precio,
                total_gastado: data.total_gastado,
                veces_pedido: data.veces_pedido
            }));
        
        // Top 5 cafeterías favoritas
        const cafeteriasOrdenadas = [...cafeteriasMap.entries()]
            .sort((a, b) => b[1].visitas - a[1].visitas)
            .slice(0, 5)
            .map(([nombre, data]) => ({
                nombre,
                visitas: data.visitas,
                total_gastado: data.gastado,
                promedio_por_visita: data.gastado / data.visitas,
                ultimo_pedido: data.ultimo_pedido
            }));
        
        // Gastos mensuales ordenados
        const gastosMensualesArray = [...gastosPorMes.entries()]
            .sort((a, b) => b[0].localeCompare(a[0]))
            .slice(0, 12)
            .map(([mes, data]) => ({
                mes,
                total: data.total,
                pedidos: data.pedidos,
                promedio: data.total / data.pedidos
            }));
        
        // Análisis por día de la semana
        const gastosPorDiaArray = [...gastosPorDia.entries()]
            .map(([dia, data]) => ({
                dia,
                total: data.total,
                pedidos: data.pedidos,
                promedio: data.total / data.pedidos
            }));
        
        // Análisis por horarios
        const horariosArray = [...horariosMap.entries()]
            .sort((a, b) => b[1].pedidos - a[1].pedidos)
            .map(([franja, data]) => ({
                franja,
                pedidos: data.pedidos,
                total: data.total,
                promedio: data.total / data.pedidos
            }));
        
        const estadisticasDetalladas = {
            general: {
                total_pedidos: totalPedidos,
                pedidos_completados: pedidosCompletados,
                pedidos_pendientes: pedidosPendientes,
                pedidos_cancelados: pedidosCancelados,
                total_gastado: totalGastado,
                ticket_promedio: ticketPromedio,
                tasa_completado: totalPedidos > 0 ? (pedidosCompletados / totalPedidos * 100).toFixed(1) : 0
            },
            productos_favoritos: productosOrdenados,
            gastos_mensuales: gastosMensualesArray,
            cafeterias_favoritas: cafeteriasOrdenadas,
            analisis_temporal: {
                por_dia_semana: gastosPorDiaArray,
                por_horario: horariosArray
            },
            periodo_analizado: period
        };
        
        // Guardar en cache
        statsCache.set(cacheKey, {
            data: estadisticasDetalladas,
            timestamp: Date.now()
        });
        
        res.json({
            success: true,
            data: estadisticasDetalladas
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

// Cambiar contraseña mejorado
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
        
        // Validar fortaleza de la nueva contraseña
        const passwordErrors = validatePasswordStrength(newPassword);
        if (passwordErrors.length > 0) {
            return res.status(400).json({
                success: false,
                error: 'Contraseña débil',
                message: passwordErrors.join(', '),
                passwordRequirements: [
                    'Al menos 8 caracteres',
                    'Una letra minúscula',
                    'Una letra mayúscula',
                    'Al menos un número',
                    'No usar contraseñas comunes'
                ]
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
        
        // Verificar que la nueva contraseña sea diferente
        const isSamePassword = await bcrypt.compare(newPassword, userData.contrasena);
        if (isSamePassword) {
            return res.status(400).json({
                success: false,
                error: 'Contraseña igual',
                message: 'La nueva contraseña debe ser diferente a la actual'
            });
        }
        
        // Encriptar nueva contraseña
        const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
        const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
        
        // Actualizar contraseña
        await userDoc.ref.update({
            contrasena: hashedPassword,
            ultima_actividad: serverTimestamp(),
            password_changed_at: serverTimestamp()
        });
        
        // Log de cambio de contraseña
        console.log(`Contraseña cambiada para usuario: ${userData.correo} (ID: ${userId})`);
        
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

// Eliminar cuenta (desactivar) mejorado
const deactivateAccount = async (req, res) => {
    try {
        const userId = req.user.id;
        const { password, reason, feedback } = req.body;
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
        
        // Verificar pedidos pendientes
        const pedidosPendientesQuery = await db.collection('pedidos')
            .where('id_usuario', '==', userId)
            .where('estado', 'in', ['Pendiente', 'Por Retirar', 'En Preparación'])
            .get();
        
        if (!pedidosPendientesQuery.empty) {
            return res.status(400).json({
                success: false,
                error: 'Pedidos pendientes',
                message: 'No puedes desactivar tu cuenta mientras tengas pedidos pendientes',
                pendingOrders: pedidosPendientesQuery.size
            });
        }
        
        // Desactivar usuario
        await userDoc.ref.update({
            activo: false,
            fecha_desactivacion: serverTimestamp(),
            motivo_desactivacion: reason || 'No especificado',
            feedback_desactivacion: feedback || null,
            ultima_actividad: serverTimestamp()
        });
        
        // Limpiar cache
        statsCache.delete(`stats_${userId}`);
        
        // Log de desactivación
        console.log(`Usuario ${userId} (${userData.correo}) desactivado. Razón: ${reason || 'No especificada'}`);
        
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

// Actualizar configuración del usuario
const updateUserSettings = async (req, res) => {
    try {
        const userId = req.user.id;
        const { configuracion } = req.body;
        const db = getDB();
        
        if (!configuracion) {
            return res.status(400).json({
                success: false,
                error: 'Configuración requerida',
                message: 'Debes proporcionar la configuración a actualizar'
            });
        }
        
        // Validar configuración
        const allowedSettings = ['notificaciones', 'emails_promocionales', 'idioma', 'tema', 'notificaciones_push'];
        const invalidSettings = Object.keys(configuracion).filter(key => !allowedSettings.includes(key));
        
        if (invalidSettings.length > 0) {
            return res.status(400).json({
                success: false,
                error: 'Configuración inválida',
                message: `Configuraciones no permitidas: ${invalidSettings.join(', ')}`
            });
        }
        
        // Obtener usuario actual
        const userDoc = await db.collection('usuarios').doc(userId).get();
        
        if (!userDoc.exists) {
            return res.status(404).json({
                success: false,
                error: 'Usuario no encontrado'
            });
        }
        
        const userData = userDoc.data();
        const currentConfig = userData.configuracion || {};
        
        // Merge de configuraciones
        const newConfig = {
            ...currentConfig,
            ...configuracion
        };
        
        // Actualizar configuración
        await userDoc.ref.update({
            configuracion: newConfig,
            ultima_actividad: serverTimestamp()
        });
        
        res.json({
            success: true,
            message: 'Configuración actualizada correctamente',
            data: {
                configuracion: newConfig
            }
        });
        
    } catch (error) {
        console.error('Error actualizando configuración:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor',
            message: 'Error actualizando la configuración'
        });
    }
};

// Obtener historial de actividad del usuario
const getUserActivity = async (req, res) => {
    try {
        const userId = req.user.id;
        const { limit = 20, type } = req.query;
        const db = getDB();
        
        // En una implementación real, tendrías una colección de actividades
        // Por ahora, construimos actividad basada en pedidos
        let query = db.collection('pedidos')
            .where('id_usuario', '==', userId)
            .orderBy('fecha_pedido', 'desc')
            .limit(parseInt(limit));
        
        const pedidosSnapshot = await query.get();
        
        const activities = [];
        
        for (const pedidoDoc of pedidosSnapshot.docs) {
            const pedido = pedidoDoc.data();
            
            // Actividad de creación de pedido
            activities.push({
                id: `pedido_creado_${pedidoDoc.id}`,
                tipo: 'pedido_creado',
                descripcion: `Pedido realizado en ${pedido.cafeteria_nombre || 'cafetería'}`,
                fecha: pedido.fecha_pedido?.toDate(),
                metadata: {
                    pedido_id: pedidoDoc.id,
                    total: pedido.total,
                    cafeteria: pedido.cafeteria_nombre
                }
            });
            
            // Actividad de cambio de estado (si existe)
            if (pedido.fecha_entrega) {
                activities.push({
                    id: `pedido_entregado_${pedidoDoc.id}`,
                    tipo: 'pedido_entregado',
                    descripcion: `Pedido retirado/entregado`,
                    fecha: pedido.fecha_entrega?.toDate(),
                    metadata: {
                        pedido_id: pedidoDoc.id,
                        estado: pedido.estado
                    }
                });
            }
        }
        
        // Ordenar por fecha descendente
        activities.sort((a, b) => (b.fecha || 0) - (a.fecha || 0));
        
        // Filtrar por tipo si se especifica
        const filteredActivities = type ? 
            activities.filter(activity => activity.tipo === type) : 
            activities;
        
        // Convertir fechas a ISO string
        const formattedActivities = filteredActivities.map(activity => ({
            ...activity,
            fecha: activity.fecha ? activity.fecha.toISOString() : null
        }));
        
        res.json({
            success: true,
            data: formattedActivities.slice(0, parseInt(limit))
        });
        
    } catch (error) {
        console.error('Error obteniendo actividad del usuario:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor',
            message: 'Error obteniendo el historial de actividad'
        });
    }
};

// Exportar datos del usuario (GDPR compliance)
const exportUserData = async (req, res) => {
    try {
        const userId = req.user.id;
        const db = getDB();
        
        // Obtener datos del usuario
        const userDoc = await db.collection('usuarios').doc(userId).get();
        
        if (!userDoc.exists) {
            return res.status(404).json({
                success: false,
                error: 'Usuario no encontrado'
            });
        }
        
        const userData = userDoc.data();
        delete userData.contrasena; // No incluir contraseña
        
        // Obtener todos los pedidos
        const pedidosSnapshot = await db.collection('pedidos')
            .where('id_usuario', '==', userId)
            .get();
        
        const pedidos = [];
        for (const pedidoDoc of pedidosSnapshot.docs) {
            const pedido = { id: pedidoDoc.id, ...pedidoDoc.data() };
            
            // Obtener items
            const itemsSnapshot = await pedidoDoc.ref.collection('items').get();
            pedido.items = itemsSnapshot.docs.map(doc => doc.data());
            
            // Convertir timestamps
            if (pedido.fecha_pedido?.toDate) {
                pedido.fecha_pedido = pedido.fecha_pedido.toDate().toISOString();
            }
            if (pedido.fecha_entrega?.toDate) {
                pedido.fecha_entrega = pedido.fecha_entrega.toDate().toISOString();
            }
            
            pedidos.push(pedido);
        }
        
        // Convertir timestamps del usuario
        if (userData.fecha_registro?.toDate) {
            userData.fecha_registro = userData.fecha_registro.toDate().toISOString();
        }
        if (userData.ultima_actividad?.toDate) {
            userData.ultima_actividad = userData.ultima_actividad.toDate().toISOString();
        }
        
        const exportData = {
            usuario: userData,
            pedidos: pedidos,
            estadisticas: {
                total_pedidos: pedidos.length,
                pedidos_completados: pedidos.filter(p => ['Retirado', 'Finalizado'].includes(p.estado)).length,
                total_gastado: pedidos
                    .filter(p => ['Retirado', 'Finalizado'].includes(p.estado))
                    .reduce((sum, p) => sum + (p.total || 0), 0)
            },
            exportado_el: new Date().toISOString(),
            version: '1.0'
        };
        
        res.json({
            success: true,
            message: 'Datos exportados correctamente',
            data: exportData
        });
        
    } catch (error) {
        console.error('Error exportando datos del usuario:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor',
            message: 'Error exportando los datos'
        });
    }
};

// Limpiar cache de estadísticas
const clearStatsCache = (userId) => {
    const keysToDelete = [];
    for (const key of statsCache.keys()) {
        if (key.includes(userId)) {
            keysToDelete.push(key);
        }
    }
    keysToDelete.forEach(key => statsCache.delete(key));
};

module.exports = {
    getUserProfile,
    updateUserProfile,
    getUserOrders,
    getUserStats,
    changePassword,
    deactivateAccount,
    updateUserSettings,
    getUserActivity,
    exportUserData,
    clearStatsCache
};