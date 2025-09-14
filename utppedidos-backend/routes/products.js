const { db } = require('../config/database.js');
const ApiHelpers = require('../utils/apiHelpers');
const Logger = require('../utils/Logger');

// Obtener carrito del usuario
const getCart = async (req, res) => {
    try {
        const userId = req.user.uid;

        // Buscar carrito activo del usuario
        const cartSnapshot = await db.collection('carritos')
            .where('usuario', '==', userId)
            .where('activo', '==', true)
            .limit(1)
            .get();

        if (cartSnapshot.empty) {
            return res.json(
                ApiHelpers.formatSuccess('Carrito vacío', {
                    id_carrito: null,
                    items: [],
                    total: 0,
                    cafeteria: null
                })
            );
        }

        const cartDoc = cartSnapshot.docs[0];
        const cartData = cartDoc.data();

        // Obtener datos de la cafetería
        let cafeteriaData = null;
        if (cartData.cafeteria) {
            const cafeteriaDoc = await db.collection('cafeterias').doc(cartData.cafeteria).get();
            if (cafeteriaDoc.exists) {
                cafeteriaData = { id: cafeteriaDoc.id, ...cafeteriaDoc.data() };
            }
        }

        // Obtener items del carrito con datos de productos
        const itemsWithProducts = [];
        let total = 0;

        if (cartData.items && cartData.items.length > 0) {
            for (const item of cartData.items) {
                const productDoc = await db.collection('productos').doc(item.producto).get();
                if (productDoc.exists) {
                    const productData = productDoc.data();
                    const subtotal = item.cantidad * item.precio_unitario;
                    total += subtotal;

                    itemsWithProducts.push({
                        id: item.id || item.producto,
                        id_producto: productDoc.id,
                        nombre: productData.nombre,
                        descripcion: productData.descripcion,
                        imagen: productData.imagen,
                        categoria: productData.categoria,
                        cantidad: item.cantidad,
                        precio_unitario: item.precio_unitario,
                        subtotal: subtotal,
                        fecha_agregado: item.fecha_agregado,
                        precio_actual: productData.precio
                    });
                }
            }
        }

        const response = ApiHelpers.formatSuccess('Carrito obtenido correctamente', {
            id_carrito: cartDoc.id,
            items: itemsWithProducts,
            total,
            cafeteria: cafeteriaData ? {
                id_cafeteria: cafeteriaData.id,
                nombre: cafeteriaData.nombre,
                edificio: cafeteriaData.edificio
            } : null
        });

        res.json(response);

    } catch (error) {
        Logger.error('Error obteniendo carrito:', error);
        res.status(500).json(
            ApiHelpers.formatError('Error obteniendo el carrito', error.message)
        );
    }
};

// Agregar item al carrito
const addToCart = async (req, res) => {
    try {
        const userId = req.user.uid;
        const { id_producto, cantidad = 1 } = req.body;

        // Validaciones básicas
        if (!id_producto || cantidad <= 0) {
            return res.status(400).json(
                ApiHelpers.formatError('Datos inválidos: ID del producto es requerido y cantidad debe ser mayor a 0')
            );
        }

        // Verificar que el producto existe y está activo
        const productDoc = await db.collection('productos').doc(id_producto).get();
        if (!productDoc.exists) {
            return res.status(404).json(
                ApiHelpers.formatError('Producto no encontrado')
            );
        }

        const productData = productDoc.data();
        if (!productData.activo) {
            return res.status(400).json(
                ApiHelpers.formatError('Producto no disponible')
            );
        }

        // Verificar que la cafetería está activa
        const cafeteriaDoc = await db.collection('cafeterias').doc(productData.cafeteria).get();
        if (!cafeteriaDoc.exists || !cafeteriaDoc.data().activa) {
            return res.status(400).json(
                ApiHelpers.formatError('Cafetería no disponible')
            );
        }

        // Buscar carrito activo del usuario
        const cartSnapshot = await db.collection('carritos')
            .where('usuario', '==', userId)
            .where('activo', '==', true)
            .limit(1)
            .get();

        let cartRef;
        let cartData;

        if (cartSnapshot.empty) {
            // Crear nuevo carrito
            cartRef = db.collection('carritos').doc();
            cartData = {
                usuario: userId,
                cafeteria: productData.cafeteria,
                items: [],
                activo: true,
                fecha_creacion: new Date(),
                fecha_actualizacion: new Date()
            };
        } else {
            // Usar carrito existente
            cartRef = cartSnapshot.docs[0].ref;
            cartData = cartSnapshot.docs[0].data();

            // Verificar que sea de la misma cafetería
            if (cartData.cafeteria !== productData.cafeteria) {
                return res.status(400).json(
                    ApiHelpers.formatError('No puedes agregar productos de diferentes cafeterías al mismo carrito')
                );
            }
        }

        // Buscar si el producto ya existe en el carrito
        const existingItemIndex = cartData.items.findIndex(
            item => item.producto === id_producto
        );

        if (existingItemIndex > -1) {
            // Actualizar cantidad si ya existe
            cartData.items[existingItemIndex].cantidad += cantidad;
            cartData.items[existingItemIndex].fecha_agregado = new Date();
        } else {
            // Agregar nuevo item
            cartData.items.push({
                id: `${id_producto}_${Date.now()}`,
                producto: id_producto,
                cantidad: cantidad,
                precio_unitario: productData.precio,
                fecha_agregado: new Date()
            });
        }

        cartData.fecha_actualizacion = new Date();

        // Guardar carrito
        await cartRef.set(cartData);

        // Obtener carrito actualizado
        const updatedCart = await getCartData(cartRef.id);
        
        res.json(
            ApiHelpers.formatSuccess('Producto agregado al carrito correctamente', updatedCart)
        );

    } catch (error) {
        Logger.error('Error agregando al carrito:', error);
        res.status(500).json(
            ApiHelpers.formatError('Error agregando producto al carrito', error.message)
        );
    }
};

// Actualizar cantidad de item
const updateCartItem = async (req, res) => {
    try {
        const userId = req.user.uid;
        const { id_producto } = req.params;
        const { cantidad } = req.body;

        // Validaciones
        if (!cantidad || cantidad <= 0) {
            return res.status(400).json(
                ApiHelpers.formatError('La cantidad debe ser mayor a 0')
            );
        }

        // Buscar carrito del usuario
        const cartSnapshot = await db.collection('carritos')
            .where('usuario', '==', userId)
            .where('activo', '==', true)
            .limit(1)
            .get();

        if (cartSnapshot.empty) {
            return res.status(404).json(
                ApiHelpers.formatError('Carrito no encontrado')
            );
        }

        const cartDoc = cartSnapshot.docs[0];
        const cartData = cartDoc.data();

        // Buscar el item en el carrito
        const itemIndex = cartData.items.findIndex(
            item => item.producto === id_producto
        );

        if (itemIndex === -1) {
            return res.status(404).json(
                ApiHelpers.formatError('Producto no encontrado en el carrito')
            );
        }

        // Actualizar cantidad
        cartData.items[itemIndex].cantidad = cantidad;
        cartData.fecha_actualizacion = new Date();

        // Guardar cambios
        await cartDoc.ref.update({
            items: cartData.items,
            fecha_actualizacion: cartData.fecha_actualizacion
        });

        // Obtener carrito actualizado
        const updatedCart = await getCartData(cartDoc.id);
        
        res.json(
            ApiHelpers.formatSuccess('Cantidad actualizada correctamente', updatedCart)
        );

    } catch (error) {
        Logger.error('Error actualizando item del carrito:', error);
        res.status(500).json(
            ApiHelpers.formatError('Error actualizando item del carrito', error.message)
        );
    }
};

// Remover item del carrito
const removeFromCart = async (req, res) => {
    try {
        const userId = req.user.uid;
        const { id_producto } = req.params;

        // Buscar carrito del usuario
        const cartSnapshot = await db.collection('carritos')
            .where('usuario', '==', userId)
            .where('activo', '==', true)
            .limit(1)
            .get();

        if (cartSnapshot.empty) {
            return res.status(404).json(
                ApiHelpers.formatError('Carrito no encontrado')
            );
        }

        const cartDoc = cartSnapshot.docs[0];
        const cartData = cartDoc.data();

        // Buscar el item y removerlo
        const itemIndex = cartData.items.findIndex(
            item => item.producto === id_producto
        );

        if (itemIndex === -1) {
            return res.status(404).json(
                ApiHelpers.formatError('Producto no encontrado en el carrito')
            );
        }

        // Remover item del array
        cartData.items.splice(itemIndex, 1);
        cartData.fecha_actualizacion = new Date();

        // Si no quedan items, desactivar carrito
        if (cartData.items.length === 0) {
            await cartDoc.ref.update({
                activo: false,
                fecha_actualizacion: cartData.fecha_actualizacion
            });

            return res.json(
                ApiHelpers.formatSuccess('Carrito vacío', {
                    id_carrito: null,
                    items: [],
                    total: 0,
                    cafeteria: null
                })
            );
        }

        // Actualizar carrito
        await cartDoc.ref.update({
            items: cartData.items,
            fecha_actualizacion: cartData.fecha_actualizacion
        });

        // Obtener carrito actualizado
        const updatedCart = await getCartData(cartDoc.id);
        
        res.json(
            ApiHelpers.formatSuccess('Producto removido del carrito', updatedCart)
        );

    } catch (error) {
        Logger.error('Error removiendo item del carrito:', error);
        res.status(500).json(
            ApiHelpers.formatError('Error removiendo item del carrito', error.message)
        );
    }
};

// Vaciar carrito completamente
const clearCart = async (req, res) => {
    try {
        const userId = req.user.uid;

        // Buscar y desactivar todos los carritos activos del usuario
        const cartSnapshot = await db.collection('carritos')
            .where('usuario', '==', userId)
            .where('activo', '==', true)
            .get();

        const batch = db.batch();
        cartSnapshot.docs.forEach(doc => {
            batch.update(doc.ref, { 
                activo: false,
                fecha_actualizacion: new Date()
            });
        });

        await batch.commit();

        res.json(
            ApiHelpers.formatSuccess('Carrito vaciado correctamente', {
                id_carrito: null,
                items: [],
                total: 0,
                cafeteria: null
            })
        );

    } catch (error) {
        Logger.error('Error vaciando carrito:', error);
        res.status(500).json(
            ApiHelpers.formatError('Error vaciando el carrito', error.message)
        );
    }
};

// Función auxiliar para obtener datos completos del carrito
const getCartData = async (cartId) => {
    try {
        const cartDoc = await db.collection('carritos').doc(cartId).get();
        if (!cartDoc.exists) return null;

        const cartData = cartDoc.data();

        // Obtener datos de la cafetería
        let cafeteriaData = null;
        if (cartData.cafeteria) {
            const cafeteriaDoc = await db.collection('cafeterias').doc(cartData.cafeteria).get();
            if (cafeteriaDoc.exists) {
                cafeteriaData = { id: cafeteriaDoc.id, ...cafeteriaDoc.data() };
            }
        }

        // Obtener items con datos de productos
        const itemsWithProducts = [];
        let total = 0;

        if (cartData.items && cartData.items.length > 0) {
            for (const item of cartData.items) {
                const productDoc = await db.collection('productos').doc(item.producto).get();
                if (productDoc.exists) {
                    const productData = productDoc.data();
                    const subtotal = item.cantidad * item.precio_unitario;
                    total += subtotal;

                    itemsWithProducts.push({
                        id: item.id || item.producto,
                        id_producto: productDoc.id,
                        nombre: productData.nombre,
                        descripcion: productData.descripcion,
                        imagen: productData.imagen,
                        categoria: productData.categoria,
                        cantidad: item.cantidad,
                        precio_unitario: item.precio_unitario,
                        subtotal: subtotal,
                        fecha_agregado: item.fecha_agregado,
                        precio_actual: productData.precio
                    });
                }
            }
        }

        return {
            id_carrito: cartDoc.id,
            items: itemsWithProducts,
            total,
            cafeteria: cafeteriaData ? {
                id_cafeteria: cafeteriaData.id,
                nombre: cafeteriaData.nombre,
                edificio: cafeteriaData.edificio
            } : null
        };
    } catch (error) {
        Logger.error('Error obteniendo datos del carrito:', error);
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