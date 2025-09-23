
// ===== controllers/cafeteriaController.js - Firebase Version =====
const { getDB } = require('../config/database');
const { successResponse, errorResponse, getCurrentMealTime, isCafeteriaOpen } = require('../utils/helpers');

// Obtener todas las cafeterías
const getAllCafeterias = async (req, res) => {
    try {
        const db = getDB();
        
        const cafeteriasSnapshot = await db.collection('cafeterias')
            .where('activa', '==', true)
            .orderBy('nombre')
            .get();

        const cafeterias = cafeteriasSnapshot.docs.map(doc => {
            const data = doc.data();
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

            return {
                id_cafeteria: doc.id,
                nombre: data.nombre,
                direccion: data.direccion,
                edificio: data.edificio,
                imagen: data.imagen,
                telefono: data.telefono,
                email: data.email,
                horarios,
                activa: data.activa,
                estado_actual: isCafeteriaOpen(horarios) ? 'abierta' : 'cerrada',
                horario_actual: getCurrentMealTime()
            };
        });

        const { response } = successResponse('Cafeterías obtenidas correctamente', cafeterias);
        res.json(response);

    } catch (error) {
        console.error('Error obteniendo cafeterías:', error);
        const { response, statusCode } = errorResponse('Error obteniendo las cafeterías', error);
        res.status(statusCode).json(response);
    }
};

// Obtener cafetería por ID
const getCafeteriaById = async (req, res) => {
    try {
        const { id } = req.params;
        const db = getDB();

        const cafeteriaDoc = await db.collection('cafeterias').doc(id).get();

        if (!cafeteriaDoc.exists || !cafeteriaDoc.data().activa) {
            const { response, statusCode } = errorResponse('Cafetería no encontrada', null, 404);
            return res.status(statusCode).json(response);
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

        const cafeteriaCompleta = {
            id_cafeteria: cafeteriaDoc.id,
            nombre: data.nombre,
            direccion: data.direccion,
            edificio: data.edificio,
            imagen: data.imagen,
            telefono: data.telefono,
            email: data.email,
            descripcion: data.descripcion,
            horarios,
            activa: data.activa,
            estado_actual: isCafeteriaOpen(horarios) ? 'abierta' : 'cerrada',
            horario_actual: getCurrentMealTime()
        };

        const { response } = successResponse('Cafetería obtenida correctamente', cafeteriaCompleta);
        res.json(response);

    } catch (error) {
        console.error('Error obteniendo cafetería:', error);
        const { response, statusCode } = errorResponse('Error obteniendo la cafetería', error);
        res.status(statusCode).json(response);
    }
};

// Obtener estadísticas de cafetería
const getCafeteriaStats = async (req, res) => {
    try {
        const { id } = req.params;
        const db = getDB();

        const cafeteriaDoc = await db.collection('cafeterias').doc(id).get();

        if (!cafeteriaDoc.exists || !cafeteriaDoc.data().activa) {
            const { response, statusCode } = errorResponse('Cafetería no encontrada', null, 404);
            return res.status(statusCode).json(response);
        }

        // Obtener estadísticas de pedidos
        const pedidosSnapshot = await db.collection('pedidos')
            .where('id_cafeteria', '==', id)
            .get();

        let totalPedidos = 0;
        let pedidosCompletados = 0;
        let pedidosPendientes = 0;
        let ingresosTotales = 0;
        let totalVentas = 0;

        pedidosSnapshot.docs.forEach(doc => {
            const pedido = doc.data();
            totalPedidos++;
            
            if (pedido.estado === 'Finalizado') {
                pedidosCompletados++;
                ingresosTotales += pedido.total || 0;
                totalVentas++;
            } else if (pedido.estado === 'Pendiente') {
                pedidosPendientes++;
            }
        });

        const ticketPromedio = totalVentas > 0 ? ingresosTotales / totalVentas : 0;

        // Obtener productos populares
        const productosSnapshot = await db.collection('categorias')
            .where('id_cafeteria', '==', id)
            .orderBy('ventas_totales', 'desc')
            .limit(5)
            .get();

        const categoriasPopulares = categoriasSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                nombre: data.nombre,
                total_vendido: data.ventas_totales || 0,
                pedidos_count: data.pedidos_count || 0
            };
        });

        const stats = {
            general: {
                total_pedidos: totalPedidos,
                pedidos_completados: pedidosCompletados,
                pedidos_pendientes: pedidosPendientes,
                ingresos_totales: ingresosTotales,
                ticket_promedio: ticketPromedio
            },
            categorias_populares: categoriasPopulares,
            cafeteria: {
                nombre: cafeteriaDoc.data().nombre
            }
        };

        const { response } = successResponse('Estadísticas obtenidas correctamente', stats);
        res.json(response);

    } catch (error) {
        console.error('Error obteniendo estadísticas de cafetería:', error);
        const { response, statusCode } = errorResponse('Error obteniendo estadísticas', error);
        res.status(statusCode).json(response);
    }
};

module.exports = {
    getAllCafeterias,
    getCafeteriaById,
    getCafeteriaStats
};
