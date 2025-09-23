// ===== controllers/cartController.js - CORREGIDO PARA PRODUCTOS =====
const { getDB, generateId, serverTimestamp, runTransaction } = require('../config/database');
const { successResponse, errorResponse, calculateCartTotal } = require('../utils/helpers');

// Obtener carrito del usuario
const getCart = async (req, res) => {
    try {
        const userId = req.user.id;
        const db = getDB();

        // Buscar carrito activo del usuario
        const carritoQuery = await db.collection('carritos')
            .where('id_usuario', '==', userId)
            .where('activo', '==', true)
            .limit(1)
            .get();

        if (carritoQuery.empty) {
            const { response } = successResponse('Carrito vacío', {
                id_carrito: null,
                items: [],
                total: 0,
                cafeteria: null
            });
            return res.json(response);
        }

        const carritoDoc = carritoQuery.docs[0];
        const carritoData = carritoDoc.data();

        // Obtener items del carrito
        const itemsSnapshot = await carritoDoc.ref.collection('items')
            .orderBy('fecha_agregado', 'desc')
            .get();

        const items = [];
        for (const itemDoc of itemsSnapshot.docs) {
            const item = itemDoc.data();
            
            // 🔥 CAMBIO: Obtener información del PRODUCTO (no categoria)
            const productoDoc = await db.collection('productos').doc(item.id_producto).get();
            if (productoDoc.exists) {
                const producto = productoDoc.data();
                items.push({
                    ...item,
                    id_item: itemDoc.id,
                    nombre: producto.nombre,
                    descripcion: producto.descripcion,
                    imagen: producto.imagen,
                    categoria: producto.categoria,
                    precio_actual: producto.precio
                });
            }
        }

        // Obtener información de la cafetería
        let cafeteriaInfo = null;
        if (carritoData.id_cafeteria) {
            const cafeteriaDoc = await db.collection('cafeterias').doc(carritoData.id_cafeteria).get();
            if (cafeteriaDoc.exists) {
                const cafeteria = cafeteriaDoc.data();
                cafeteriaInfo = {
                    id_cafeteria: carritoData.id_cafeteria,
                    nombre: cafeteria.nombre,
                    edificio: cafeteria.edificio
                };
            }
        }

        const total = calculateCartTotal(items);

        const { response } = successResponse('Carrito obtenido correctamente', {
            id_carrito: carritoDoc.id,
            items,
            total,
            cafeteria: cafeteriaInfo
        });
        res.json(response);

    } catch (error) {
        console.error('Error obteniendo carrito:', error);
        const { response, statusCode } = errorResponse('Error obteniendo el carrito', error);
        res.status(statusCode).json(response);
    }
};

// Agregar item al carrito
const addToCart = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id_producto, cantidad = 1 } = req.body;
        const db = getDB();

        if (!id_producto || cantidad <= 0) {
            const { response, statusCode } = errorResponse('Datos inválidos');
            return res.status(statusCode).json(response);
        }

        let carritoId;

        // Usar transacción para operaciones atómicas
        await runTransaction(async (transaction) => {
            // 🔥 CAMBIO: Verificar PRODUCTO (no categoria)
            const productoRef = db.collection('productos').doc(id_producto);
            const productoDoc = await transaction.get(productoRef);

            if (!productoDoc.exists || !productoDoc.data().activo) {
                throw new Error('Producto no encontrado o inactivo');
            }

            const productData = productoDoc.data();

            // Verificar cafetería
            const cafeteriaRef = db.collection('cafeterias').doc(productData.id_cafeteria);
            const cafeteriaDoc = await transaction.get(cafeteriaRef);

            if (!cafeteriaDoc.exists || !cafeteriaDoc.data().activa) {
                throw new Error('Cafetería no encontrada o inactiva');
            }

            // Buscar carrito activo
            const carritoQuery = await db.collection('carritos')
                .where('id_usuario', '==', userId)
                .where('activo', '==', true)
                .limit(1)
                .get();

            let carritoRef;

            if (carritoQuery.empty) {
                // Crear nuevo carrito
                carritoId = generateId();
                carritoRef = db.collection('carritos').doc(carritoId);
                
                transaction.set(carritoRef, {
                    id_carrito: carritoId,
                    id_usuario: userId,
                    id_cafeteria: productData.id_cafeteria,
                    fecha_creacion: serverTimestamp(),
                    activo: true
                });
            } else {
                const carritoDoc = carritoQuery.docs[0];
                carritoRef = carritoDoc.ref;
                carritoId = carritoDoc.id;
                const carritoData = carritoDoc.data();

                // Verificar que sea la misma cafetería
                if (carritoData.id_cafeteria !== productData.id_cafeteria) {
                    throw new Error('No puedes agregar productos de diferentes cafeterías');
                }
            }

            // Verificar si ya existe el item
            const itemQuery = await carritoRef.collection('items')
                .where('id_producto', '==', id_producto)
                .limit(1)
                .get();

            if (!itemQuery.empty) {
                // Actualizar cantidad existente
                const itemDoc = itemQuery.docs[0];
                const currentData = itemDoc.data();
                const newQuantity = currentData.cantidad + cantidad;
                const newSubtotal = newQuantity * productData.precio;

                transaction.update(itemDoc.ref, {
                    cantidad: newQuantity,
                    subtotal: newSubtotal,
                    fecha_agregado: serverTimestamp()
                });
            } else {
                // Crear nuevo item
                const itemId = generateId();
                const itemRef = carritoRef.collection('items').doc(itemId);
                const subtotal = cantidad * productData.precio;

                transaction.set(itemRef, {
                    id_item: itemId,
                    id_producto, // 🔥 CAMBIO: usar id_producto en lugar de id_categoria
                    cantidad,
                    precio_unitario: productData.precio,
                    subtotal,
                    fecha_agregado: serverTimestamp()
                });
            }
        });

        // Obtener carrito actualizado
        const updatedCart = await getCartData(carritoId, db);
        const { response } = successResponse('Producto agregado al carrito', updatedCart);
        res.json(response);

    } catch (error) {
        console.error('Error agregando al carrito:', error);
        const { response, statusCode } = errorResponse('Error agregando producto al carrito', error);
        res.status(statusCode).json(response);
    }
};

// Actualizar cantidad de item
const updateCartItem = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id_producto } = req.params;
        const { cantidad } = req.body;
        const db = getDB();

        if (!cantidad || cantidad <= 0) {
            const { response, statusCode } = errorResponse('Cantidad debe ser mayor a 0');
            return res.status(statusCode).json(response);
        }

        let carritoId;
        await runTransaction(async (transaction) => {
            // Buscar carrito del usuario
            const carritoQuery = await db.collection('carritos')
                .where('id_usuario', '==', userId)
                .where('activo', '==', true)
                .limit(1)
                .get();

            if (carritoQuery.empty) {
                throw new Error('Carrito no encontrado');
            }

            const carritoDoc = carritoQuery.docs[0];
            carritoId = carritoDoc.id;

            // Buscar item en el carrito
            const itemQuery = await carritoDoc.ref.collection('items')
                .where('id_producto', '==', id_producto) // 🔥 CAMBIO: usar id_producto
                .limit(1)
                .get();

            if (itemQuery.empty) {
                throw new Error('Item no encontrado en el carrito');
            }

            // 🔥 CAMBIO: Obtener precio actual del PRODUCTO
            const productoRef = db.collection('productos').doc(id_producto);
            const productoDoc = await transaction.get(productoRef);
            
            if (!productoDoc.exists) {
                throw new Error('Producto no encontrado');
            }

            const precio = productoDoc.data().precio;
            const newSubtotal = cantidad * precio;

            // Actualizar item
            const itemDoc = itemQuery.docs[0];
            transaction.update(itemDoc.ref, {
                cantidad,
                subtotal: newSubtotal,
                fecha_modificado: serverTimestamp()
            });
        });

        const updatedCart = await getCartData(carritoId, db);
        const { response } = successResponse('Cantidad actualizada', updatedCart);
        res.json(response);

    } catch (error) {
        console.error('Error actualizando item del carrito:', error);
        const { response, statusCode } = errorResponse('Error actualizando item del carrito', error);
        res.status(statusCode).json(response);
    }
};

// Remover item
const removeFromCart = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id_producto } = req.params;
        const db = getDB();

        let carritoId;
        let isEmpty = false;

        await runTransaction(async (transaction) => {
            // Buscar carrito del usuario
            const carritoQuery = await db.collection('carritos')
                .where('id_usuario', '==', userId)
                .where('activo', '==', true)
                .limit(1)
                .get();

            if (carritoQuery.empty) {
                throw new Error('Carrito no encontrado');
            }

            const carritoDoc = carritoQuery.docs[0];
            carritoId = carritoDoc.id;

            // Buscar y eliminar item
            const itemQuery = await carritoDoc.ref.collection('items')
                .where('id_producto', '==', id_producto) // 🔥 CAMBIO: usar id_producto
                .limit(1)
                .get();

            if (itemQuery.empty) {
                throw new Error('Item no encontrado en el carrito');
            }

            // Eliminar item
            const itemDoc = itemQuery.docs[0];
            transaction.delete(itemDoc.ref);

            // Verificar si quedan items
            const remainingItemsQuery = await carritoDoc.ref.collection('items').get();
            
            if (remainingItemsQuery.size <= 1) { // <= 1 porque aún no se ha eliminado en la transacción
                isEmpty = true;
                transaction.update(carritoDoc.ref, { activo: false });
            }
        });

        if (isEmpty) {
            const { response } = successResponse('Carrito vacío', {
                id_carrito: null,
                items: [],
                total: 0,
                cafeteria: null
            });
            return res.json(response);
        }

        const updatedCart = await getCartData(carritoId, db);
        const { response } = successResponse('Item removido del carrito', updatedCart);
        res.json(response);

    } catch (error) {
        console.error('Error removiendo item del carrito:', error);
        const { response, statusCode } = errorResponse('Error removiendo item del carrito', error);
        res.status(statusCode).json(response);
    }
};

// Vaciar carrito
const clearCart = async (req, res) => {
    try {
        const userId = req.user.id;
        const db = getDB();

        await runTransaction(async (transaction) => {
            // Buscar carrito activo del usuario
            const carritoQuery = await db.collection('carritos')
                .where('id_usuario', '==', userId)
                .where('activo', '==', true)
                .get();

            carritoQuery.docs.forEach(doc => {
                transaction.update(doc.ref, { activo: false });
            });
        });

        const { response } = successResponse('Carrito vaciado correctamente', {
            id_carrito: null,
            items: [],
            total: 0,
            cafeteria: null
        });
        res.json(response);

    } catch (error) {
        console.error('Error vaciando carrito:', error);
        const { response, statusCode } = errorResponse('Error vaciando el carrito', error);
        res.status(statusCode).json(response);
    }
};

// Helper para obtener datos del carrito
const getCartData = async (carritoId, db) => {
    try {
        const carritoDoc = await db.collection('carritos').doc(carritoId).get();
        if (!carritoDoc.exists) return null;

        const carritoData = carritoDoc.data();

        // Obtener items
        const itemsSnapshot = await carritoDoc.ref.collection('items').get();
        const items = [];
        
        for (const itemDoc of itemsSnapshot.docs) {
            const item = itemDoc.data();
            
            // 🔥 CAMBIO: Obtener información del PRODUCTO
            const productoDoc = await db.collection('productos').doc(item.id_producto).get();
            if (productoDoc.exists) {
                const producto = productoDoc.data();
                items.push({
                    ...item,
                    id_item: itemDoc.id,
                    nombre: producto.nombre,
                    descripcion: producto.descripcion,
                    imagen: producto.imagen,
                    categoria: producto.categoria,
                    precio_actual: producto.precio
                });
            }
        }

        // Obtener información de cafetería
        let cafeteriaInfo = null;
        if (carritoData.id_cafeteria) {
            const cafeteriaDoc = await db.collection('cafeterias').doc(carritoData.id_cafeteria).get();
            if (cafeteriaDoc.exists) {
                const cafeteria = cafeteriaDoc.data();
                cafeteriaInfo = {
                    id_cafeteria: carritoData.id_cafeteria,
                    nombre: cafeteria.nombre,
                    edificio: cafeteria.edificio
                };
            }
        }

        const total = calculateCartTotal(items);

        return {
            id_carrito: carritoId,
            items,
            total,
            cafeteria: cafeteriaInfo
        };
    } catch (error) {
        console.error('Error obteniendo datos del carrito:', error);
        return null;
    }
};

module.exports = {
    getCart,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart
};