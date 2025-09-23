// ===== controllers/orderController.js - CÓDIGO COMPLETO CORREGIDO =====
const { getDB, generateId, serverTimestamp, runTransaction } = require('../config/database');
const { successResponse, errorResponse } = require('../utils/helpers');
const admin = require('firebase-admin');

// Crear pedido desde carrito persistente
const createOrderFromCart = async (req, res) => {
    try {
        const userId = req.user.id;
        const { metodo_pago, observaciones, tipo_pedido = 'normal' } = req.body;
        const db = getDB();

        if (!metodo_pago || !['efectivo', 'tarjeta', 'transferencia'].includes(metodo_pago)) {
            const { response, statusCode } = errorResponse('Método de pago inválido');
            return res.status(statusCode).json(response);
        }

        let pedidoId;
        let pedidoData;

        await runTransaction(async (transaction) => {
            // Buscar carrito activo del usuario
            const carritoQuery = await db.collection('carritos')
                .where('id_usuario', '==', userId)
                .where('activo', '==', true)
                .limit(1)
                .get();

            if (carritoQuery.empty) {
                throw new Error('No tienes un carrito activo');
            }

            const carritoDoc = carritoQuery.docs[0];
            const carritoData = carritoDoc.data();

            // Obtener items del carrito
            const itemsSnapshot = await carritoDoc.ref.collection('items').get();
            
            if (itemsSnapshot.empty) {
                throw new Error('El carrito está vacío');
            }

            // Verificar productos y calcular total
            const items = [];
            let total = 0;

            for (const itemDoc of itemsSnapshot.docs) {
                const item = itemDoc.data();
                
                // Verificar que el producto sigue activo
                const productoRef = db.collection('productos').doc(item.id_producto);
                const productoDoc = await transaction.get(productoRef);
                
                if (!productoDoc.exists || !productoDoc.data().activo) {
                    throw new Error(`El producto ${item.id_producto} ya no está disponible`);
                }

                const producto = productoDoc.data();
                
                // Verificar precio actual
                if (producto.precio !== item.precio_unitario) {
                    throw new Error(`El precio del producto "${producto.nombre}" ha cambiado. Actualiza tu carrito.`);
                }

                const itemData = {
                    id_producto: item.id_producto,
                    nombre: producto.nombre,
                    cantidad: item.cantidad,
                    precio_unitario: producto.precio,
                    subtotal: item.subtotal,
                    categoria: producto.categoria,
                    horario: producto.horario
                };

                items.push(itemData);
                total += item.subtotal;
            }

            // Agregar cargo express si aplica
            if (tipo_pedido === 'express') {
                total += 1.00;
            }

            // Verificar cafetería
            const cafeteriaRef = db.collection('cafeterias').doc(carritoData.id_cafeteria);
            const cafeteriaDoc = await transaction.get(cafeteriaRef);
            
            if (!cafeteriaDoc.exists || !cafeteriaDoc.data().activa) {
                throw new Error('La cafetería no está disponible');
            }

            // Crear pedido
            pedidoId = generateId();
            const tiempoEstimado = calcularTiempoEstimado(items);
            
            pedidoData = {
                id_pedido: pedidoId,
                id_usuario: userId,
                id_cafeteria: carritoData.id_cafeteria,
                estado: 'Pendiente',
                total,
                metodo_pago,
                tipo_pedido,
                observaciones: observaciones || '',
                fecha_pedido: serverTimestamp(),
                fecha_estimada: new Date(Date.now() + (tiempoEstimado * 60000)),
                tiempo_estimado: tiempoEstimado,
                items_count: items.length,
                cafeteria_nombre: cafeteriaDoc.data().nombre
            };

            const pedidoRef = db.collection('pedidos').doc(pedidoId);
            transaction.set(pedidoRef, pedidoData);

            // Agregar items del pedido como subcolección
            items.forEach((item, index) => {
                const itemRef = pedidoRef.collection('items').doc(`item_${index}`);
                transaction.set(itemRef, {
                    ...item,
                    id_item: `item_${index}`,
                    fecha_agregado: serverTimestamp()
                });
            });

            // Desactivar carrito
            transaction.update(carritoDoc.ref, { activo: false });

            // Actualizar estadísticas del producto
            items.forEach(item => {
                const productoRef = db.collection('productos').doc(item.id_producto);
                transaction.update(productoRef, {
                    ventas_totales: admin.firestore.FieldValue.increment(item.cantidad),
                    pedidos_count: admin.firestore.FieldValue.increment(1),
                    ultima_venta: serverTimestamp()
                });
            });
        });

        const { response } = successResponse('Pedido creado correctamente', {
            pedido: pedidoData,
            numero_pedido: pedidoId,
            estado: 'Pendiente'
        });
        res.status(201).json(response);

    } catch (error) {
        console.error('Error creando pedido:', error);
        const { response, statusCode } = errorResponse('Error creando el pedido', error);
        res.status(statusCode).json(response);
    }
};

// Crear pedido directo (sin carrito) - PARA CARTMODAL
const createDirectOrder = async (req, res) => {
    try {
        const userId = req.user?.id || 'guest';
        const { items, metodo_pago, observaciones, tipo_pedido = 'normal', usuario_info } = req.body;
        const db = getDB();

        // Validaciones básicas
        if (!items || !Array.isArray(items) || items.length === 0) {
            const { response, statusCode } = errorResponse('Debe incluir al menos un producto en el pedido');
            return res.status(statusCode).json(response);
        }

        if (!metodo_pago || !['efectivo', 'tarjeta', 'transferencia'].includes(metodo_pago)) {
            const { response, statusCode } = errorResponse('Método de pago inválido');
            return res.status(statusCode).json(response);
        }

        let pedidoId;
        let pedidoData;

        await runTransaction(async (transaction) => {
            // Verificar productos y calcular total
            const productosData = [];
            let total = 0;
            let id_cafeteria;

            for (const item of items) {
                const productId = item.id_producto || item.id;
                const cantidad = item.cantidad || item.quantity || 1;

                if (!productId) {
                    throw new Error('Cada item debe tener un id_producto válido');
                }

                const productoRef = db.collection('productos').doc(productId);
                const productoDoc = await transaction.get(productoRef);
                
                if (!productoDoc.exists || !productoDoc.data().activo) {
                    throw new Error(`Producto ${productId} no encontrado o inactivo`);
                }
                
                const producto = productoDoc.data();
                
                // Verificar que todos los productos sean de la misma cafetería
                if (!id_cafeteria) {
                    id_cafeteria = producto.id_cafeteria;
                } else if (id_cafeteria !== producto.id_cafeteria) {
                    throw new Error('Todos los productos deben ser de la misma cafetería');
                }
                
                const subtotal = producto.precio * cantidad;
                total += subtotal;
                
                productosData.push({
                    id_producto: productId,
                    nombre: producto.nombre,
                    cantidad: cantidad,
                    precio_unitario: producto.precio,
                    subtotal,
                    categoria: producto.categoria,
                    horario: producto.horario,
                    descripcion: producto.descripcion
                });
            }

            // Agregar cargo express si aplica
            if (tipo_pedido === 'express') {
                total += 1.00;
            }

            // Verificar cafetería
            const cafeteriaRef = db.collection('cafeterias').doc(id_cafeteria);
            const cafeteriaDoc = await transaction.get(cafeteriaRef);
            
            if (!cafeteriaDoc.exists || !cafeteriaDoc.data().activa) {
                throw new Error('Cafetería no encontrada o inactiva');
            }

            // Crear pedido
            pedidoId = generateId();
            const tiempoEstimado = calcularTiempoEstimado(productosData);
            
            // Determinar nombre del usuario
            const nombreUsuario = usuario_info?.nombre || 
                                (req.user?.nombre) || 
                                (req.user?.email) || 
                                'Invitado';
            
            pedidoData = {
                id_pedido: pedidoId,
                id_usuario: userId,
                usuario_nombre: nombreUsuario,
                id_cafeteria,
                estado: 'Pendiente',
                total,
                metodo_pago,
                tipo_pedido,
                observaciones: observaciones || '',
                fecha_pedido: serverTimestamp(),
                fecha_estimada: new Date(Date.now() + (tiempoEstimado * 60000)),
                tiempo_estimado: tiempoEstimado,
                items_count: productosData.length,
                cafeteria_nombre: cafeteriaDoc.data().nombre,
                cantidad_total: productosData.reduce((sum, item) => sum + item.cantidad, 0)
            };

            const pedidoRef = db.collection('pedidos').doc(pedidoId);
            transaction.set(pedidoRef, pedidoData);

            // Agregar items del pedido
            productosData.forEach((item, index) => {
                const itemRef = pedidoRef.collection('items').doc(`item_${index}`);
                transaction.set(itemRef, {
                    ...item,
                    id_item: `item_${index}`,
                    fecha_agregado: serverTimestamp()
                });
            });

            // Actualizar estadísticas del producto
            productosData.forEach(item => {
                const productoRef = db.collection('productos').doc(item.id_producto);
                transaction.update(productoRef, {
                    ventas_totales: admin.firestore.FieldValue.increment(item.cantidad),
                    pedidos_count: admin.firestore.FieldValue.increment(1),
                    ultima_venta: serverTimestamp()
                });
            });
        });

        const { response } = successResponse('Pedido creado correctamente', {
            pedido: pedidoData,
            numero_pedido: pedidoId,
            estado: 'Pendiente'
        });
        res.status(201).json(response);

    } catch (error) {
        console.error('Error creando pedido directo:', error);
        const { response, statusCode } = errorResponse('Error creando el pedido', error);
        res.status(statusCode).json(response);
    }
};

// Crear pedido directo (alias para compatibilidad)
const createOrder = createDirectOrder;

// Obtener pedidos del usuario - CORREGIDO PARA EVITAR ÍNDICE
const getUserOrders = async (req, res) => {
    try {
        const userId = req.user.id;
        const { estado, limit = 20, page = 1 } = req.query;
        const db = getDB();

        // Consulta sin orderBy para evitar índice
        let pedidosQuery = db.collection('pedidos')
            .where('id_usuario', '==', userId);

        // Aplicar filtro de estado si se especifica
        if (estado && estado !== 'todos' && estado !== '') {
            pedidosQuery = pedidosQuery.where('estado', '==', estado);
        }

        // Limitar resultados
        pedidosQuery = pedidosQuery.limit(parseInt(limit));

        const pedidosSnapshot = await pedidosQuery.get();
        
        const pedidos = [];
        for (const pedidoDoc of pedidosSnapshot.docs) {
            const pedido = { id: pedidoDoc.id, ...pedidoDoc.data() };
            
            // Obtener items del pedido
            const itemsSnapshot = await pedidoDoc.ref.collection('items').get();
            pedido.items = itemsSnapshot.docs.map(doc => doc.data());
            
            // Convertir timestamps
            if (pedido.fecha_pedido) {
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

        const { response } = successResponse('Pedidos obtenidos correctamente', {
            pedidos,
            total: pedidos.length,
            page: parseInt(page),
            limit: parseInt(limit),
            filtros: { estado: estado || 'todos' }
        });
        res.json(response);

    } catch (error) {
        console.error('Error obteniendo pedidos del usuario:', error);
        const { response, statusCode } = errorResponse('Error obteniendo pedidos', error);
        res.status(statusCode).json(response);
    }
};

// Obtener pedido por ID
const getOrderById = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const db = getDB();

        const pedidoDoc = await db.collection('pedidos').doc(id).get();

        if (!pedidoDoc.exists) {
            const { response, statusCode } = errorResponse('Pedido no encontrado', null, 404);
            return res.status(statusCode).json(response);
        }

        const pedido = { id: pedidoDoc.id, ...pedidoDoc.data() };

        // Verificar que el pedido pertenece al usuario
        if (pedido.id_usuario !== userId) {
            const { response, statusCode } = errorResponse('No tienes acceso a este pedido', null, 403);
            return res.status(statusCode).json(response);
        }

        // Obtener items del pedido
        const itemsSnapshot = await pedidoDoc.ref.collection('items').get();
        pedido.items = itemsSnapshot.docs.map(doc => doc.data());

        // Obtener información de la cafetería
        const cafeteriaDoc = await db.collection('cafeterias').doc(pedido.id_cafeteria).get();
        if (cafeteriaDoc.exists) {
            pedido.cafeteria_info = {
                nombre: cafeteriaDoc.data().nombre,
                telefono: cafeteriaDoc.data().telefono,
                edificio: cafeteriaDoc.data().edificio
            };
        }

        // Convertir timestamps
        if (pedido.fecha_pedido) {
            pedido.fecha_pedido = pedido.fecha_pedido.toDate();
        }
        if (pedido.fecha_estimada) {
            pedido.fecha_estimada = new Date(pedido.fecha_estimada);
        }

        const { response } = successResponse('Pedido obtenido correctamente', pedido);
        res.json(response);

    } catch (error) {
        console.error('Error obteniendo pedido por ID:', error);
        const { response, statusCode } = errorResponse('Error obteniendo el pedido', error);
        res.status(statusCode).json(response);
    }
};

// Cancelar pedido
const cancelOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const db = getDB();

        await runTransaction(async (transaction) => {
            const pedidoRef = db.collection('pedidos').doc(id);
            const pedidoDoc = await transaction.get(pedidoRef);

            if (!pedidoDoc.exists) {
                throw new Error('Pedido no encontrado');
            }

            const pedido = pedidoDoc.data();

            // Verificar que el pedido pertenece al usuario
            if (pedido.id_usuario !== userId) {
                throw new Error('No tienes acceso a este pedido');
            }

            // Verificar que se puede cancelar
            if (!['Pendiente', 'Confirmado'].includes(pedido.estado)) {
                throw new Error('El pedido no se puede cancelar en su estado actual');
            }

            // Actualizar estado
            transaction.update(pedidoRef, {
                estado: 'Cancelado',
                fecha_cancelacion: serverTimestamp(),
                motivo_cancelacion: 'Cancelado por el usuario'
            });
        });

        const { response } = successResponse('Pedido cancelado correctamente');
        res.json(response);

    } catch (error) {
        console.error('Error cancelando pedido:', error);
        const { response, statusCode } = errorResponse('Error cancelando el pedido', error);
        res.status(statusCode).json(response);
    }
};

// Helper para calcular tiempo estimado
const calcularTiempoEstimado = (items) => {
    let tiempoBase = 10; // 10 minutos base
    
    items.forEach(item => {
        // Agregar tiempo por cantidad
        tiempoBase += item.cantidad * 2;
        
        // Tiempo adicional por categoría
        switch (item.categoria) {
            case 'Platos Principales':
            case 'Almuerzos':
                tiempoBase += 8;
                break;
            case 'Bebidas Calientes':
                tiempoBase += 3;
                break;
            case 'Postres':
                tiempoBase += 5;
                break;
            case 'Sandwiches':
                tiempoBase += 6;
                break;
            case 'Desayunos':
                tiempoBase += 7;
                break;
            case 'Cenas':
                tiempoBase += 10;
                break;
            default:
                tiempoBase += 2;
        }
    });

    return Math.min(tiempoBase, 45); // Máximo 45 minutos
};

module.exports = {
    createOrderFromCart,
    createDirectOrder,
    createOrder,
    getUserOrders,
    getOrderById,
    cancelOrder
};