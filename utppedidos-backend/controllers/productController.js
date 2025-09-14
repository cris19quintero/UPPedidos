
// ===== controllers/productController.js - MIGRADO A FIREBASE =====
const { getDB } = require('../config/database');
const { successResponse, errorResponse, getCurrentMealTime } = require('../utils/helpers');

// Obtener productos por cafetería
const getProductsByCafeteria = async (req, res) => {
    try {
        const { id } = req.params;
        const { horario, categoria, disponible = 'true', precio_min, precio_max } = req.query;
        const db = getDB();

        // Verificar que la cafetería existe
        const cafeteriaDoc = await db.collection('cafeterias').doc(id).get();

        if (!cafeteriaDoc.exists || !cafeteriaDoc.data().activa) {
            const { response, statusCode } = errorResponse('Cafetería no encontrada', null, 404);
            return res.status(statusCode).json(response);
        }

        // Construir query para productos
        let productosQuery = db.collection('productos').where('id_cafeteria', '==', id);

        if (disponible === 'true') {
            productosQuery = productosQuery.where('activo', '==', true);
        }

        // Ejecutar query base
        const productosSnapshot = await productosQuery.get();
        
        // Filtrar en memoria (Firebase tiene limitaciones en queries compuestas)
        let productos = productosSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })).filter(producto => {
            // Filtro por horario
            if (horario && horario !== 'todo_dia') {
                if (producto.horario !== horario && producto.horario !== 'todo_dia') {
                    return false;
                }
            }

            // Filtro por categoría
            if (categoria && producto.categoria !== categoria) {
                return false;
            }

            // Filtro por precio
            if (precio_min && producto.precio < parseFloat(precio_min)) {
                return false;
            }
            if (precio_max && producto.precio > parseFloat(precio_max)) {
                return false;
            }

            return true;
        });

        // Agrupar por categoría
        const productosPorCategoria = productos.reduce((acc, producto) => {
            const categoria = producto.categoria;
            if (!acc[categoria]) {
                acc[categoria] = {
                    categoria: categoria,
                    items: []
                };
            }

            // Procesar ingredientes
            let ingredientes = producto.ingredientes || [];
            if (typeof ingredientes === 'string') {
                try {
                    ingredientes = JSON.parse(ingredientes);
                } catch (e) {
                    ingredientes = ingredientes.split(',').map(i => i.trim());
                }
            }

            acc[categoria].items.push({
                ...producto,
                id_producto: producto.id,
                ingredientes,
                precio: parseFloat(producto.precio),
                vegetariano: !!producto.vegetariano,
                calorias: producto.calorias || null
            });

            return acc;
        }, {});

        // Ordenar items dentro de cada categoría
        Object.values(productosPorCategoria).forEach(categoria => {
            categoria.items.sort((a, b) => {
                if (a.precio !== b.precio) return a.precio - b.precio;
                return a.nombre.localeCompare(b.nombre);
            });
        });

        const categoriasArray = Object.values(productosPorCategoria);

        const { response } = successResponse('Productos obtenidos correctamente', {
            cafeteria: {
                id_cafeteria: id,
                nombre: cafeteriaDoc.data().nombre
            },
            categorias: categoriasArray,
            total_items: productos.length,
            horario_actual: getCurrentMealTime(),
            filtros_aplicados: {
                horario: horario || 'todos',
                categoria: categoria || 'todas',
                precio_min: precio_min || null,
                precio_max: precio_max || null
            }
        });
        res.json(response);

    } catch (error) {
        console.error('Error obteniendo productos por cafetería:', error);
        const { response, statusCode } = errorResponse('Error obteniendo productos', error);
        res.status(statusCode).json(response);
    }
};

// Buscar productos
const searchProducts = async (req, res) => {
    try {
        const { q: query, cafeteria, horario, precio_max, precio_min, categoria, vegetariano } = req.query;
        const db = getDB();

        if (!query || query.length < 2) {
            const { response, statusCode } = errorResponse('La búsqueda debe tener al menos 2 caracteres');
            return res.status(statusCode).json(response);
        }

        // En Firebase, necesitamos obtener todos los productos y filtrar en memoria
        let productosQuery = db.collection('productos').where('activo', '==', true);

        if (cafeteria) {
            productosQuery = productosQuery.where('id_cafeteria', '==', cafeteria);
        }

        const productosSnapshot = await productosQuery.get();
        
        // Obtener información de cafeterías para todos los productos
        const cafeteriasSnapshot = await db.collection('cafeterias')
            .where('activa', '==', true)
            .get();
        
        const cafeteriasMap = new Map();
        cafeteriasSnapshot.docs.forEach(doc => {
            cafeteriasMap.set(doc.id, doc.data());
        });

        // Filtrar productos en memoria
        const queryLower = query.toLowerCase();
        let productos = productosSnapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter(producto => {
                // Filtro de búsqueda por texto
                const matchesQuery = 
                    producto.nombre.toLowerCase().includes(queryLower) ||
                    (producto.descripcion && producto.descripcion.toLowerCase().includes(queryLower)) ||
                    (producto.ingredientes && 
                     (typeof producto.ingredientes === 'string' 
                        ? producto.ingredientes.toLowerCase().includes(queryLower)
                        : Array.isArray(producto.ingredientes) && 
                          producto.ingredientes.some(ing => ing.toLowerCase().includes(queryLower))
                     )
                    );

                if (!matchesQuery) return false;

                // Otros filtros
                if (horario && horario !== 'todo_dia') {
                    if (producto.horario !== horario && producto.horario !== 'todo_dia') {
                        return false;
                    }
                }

                if (categoria && producto.categoria !== categoria) {
                    return false;
                }

                if (vegetariano === 'true' && !producto.vegetariano) {
                    return false;
                }

                if (precio_min && producto.precio < parseFloat(precio_min)) {
                    return false;
                }

                if (precio_max && producto.precio > parseFloat(precio_max)) {
                    return false;
                }

                return true;
            });

        // Ordenar por relevancia
        productos.sort((a, b) => {
            const aNameMatch = a.nombre.toLowerCase().includes(queryLower);
            const bNameMatch = b.nombre.toLowerCase().includes(queryLower);
            
            if (aNameMatch && !bNameMatch) return -1;
            if (!aNameMatch && bNameMatch) return 1;
            
            return a.precio - b.precio;
        });

        // Limitar resultados y formatear
        productos = productos.slice(0, 100);
        
        const productosFormateados = productos.map(producto => {
            let ingredientes = producto.ingredientes || [];
            if (typeof ingredientes === 'string') {
                try {
                    ingredientes = JSON.parse(ingredientes);
                } catch (e) {
                    ingredientes = ingredientes.split(',').map(i => i.trim());
                }
            }

            const cafeteria = cafeteriasMap.get(producto.id_cafeteria);

            return {
                ...producto,
                id_producto: producto.id,
                precio: parseFloat(producto.precio),
                ingredientes,
                vegetariano: !!producto.vegetariano,
                calorias: producto.calorias || null,
                cafeteria_info: cafeteria ? {
                    id_cafeteria: producto.id_cafeteria,
                    nombre: cafeteria.nombre,
                    edificio: cafeteria.edificio
                } : null
            };
        });

        const { response } = successResponse('Búsqueda completada', {
            query: query.trim(),
            productos: productosFormateados,
            total: productosFormateados.length,
            filtros_aplicados: {
                cafeteria: cafeteria || 'todas',
                horario: horario || 'todos',
                categoria: categoria || 'todas',
                vegetariano: vegetariano || 'todos',
                precio_min: precio_min || null,
                precio_max: precio_max || null
            }
        });
        res.json(response);

    } catch (error) {
        console.error('Error en búsqueda de productos:', error);
        const { response, statusCode } = errorResponse('Error en la búsqueda', error);
        res.status(statusCode).json(response);
    }
};

// Obtener producto por ID
const getProductById = async (req, res) => {
    try {
        const { id } = req.params;
        const db = getDB();

        const productoDoc = await db.collection('productos').doc(id).get();

        if (!productoDoc.exists || !productoDoc.data().activo) {
            const { response, statusCode } = errorResponse('Producto no encontrado', null, 404);
            return res.status(statusCode).json(response);
        }

        const producto = { id: productoDoc.id, ...productoDoc.data() };

        // Obtener información de la cafetería
        const cafeteriaDoc = await db.collection('cafeterias').doc(producto.id_cafeteria).get();
        
        if (!cafeteriaDoc.exists || !cafeteriaDoc.data().activa) {
            const { response, statusCode } = errorResponse('Cafetería no encontrada', null, 404);
            return res.status(statusCode).json(response);
        }

        const cafeteria = cafeteriaDoc.data();

        // Procesar ingredientes
        let ingredientes = producto.ingredientes || [];
        if (typeof ingredientes === 'string') {
            try {
                ingredientes = JSON.parse(ingredientes);
            } catch (e) {
                ingredientes = ingredientes.split(',').map(i => i.trim());
            }
        }

        // Obtener productos similares
        const productosSimilaresSnapshot = await db.collection('productos')
            .where('categoria', '==', producto.categoria)
            .where('id_cafeteria', '==', producto.id_cafeteria)
            .where('activo', '==', true)
            .limit(6)
            .get();

        const productosSimilares = productosSimilaresSnapshot.docs
            .filter(doc => doc.id !== id)
            .slice(0, 4)
            .map(doc => {
                const data = doc.data();
                return {
                    id_producto: doc.id,
                    nombre: data.nombre,
                    precio: parseFloat(data.precio),
                    imagen: data.imagen,
                    descripcion: data.descripcion
                };
            });

        const productoCompleto = {
            id_producto: producto.id,
            nombre: producto.nombre,
            descripcion: producto.descripcion,
            precio: parseFloat(producto.precio),
            imagen: producto.imagen,
            categoria: producto.categoria,
            horario: producto.horario,
            tiempo_preparacion: producto.tiempo_preparacion,
            calorias: producto.calorias,
            vegetariano: !!producto.vegetariano,
            ingredientes,
            cafeteria_info: {
                id_cafeteria: producto.id_cafeteria,
                nombre: cafeteria.nombre,
                edificio: cafeteria.edificio,
                telefono: cafeteria.telefono,
                direccion: cafeteria.direccion
            },
            productos_similares: productosSimilares
        };

        const { response } = successResponse('Producto obtenido correctamente', productoCompleto);
        res.json(response);

    } catch (error) {
        console.error('Error obteniendo producto por ID:', error);
        const { response, statusCode } = errorResponse('Error obteniendo el producto', error);
        res.status(statusCode).json(response);
    }
};

// Obtener categorías disponibles
const getCategories = async (req, res) => {
    try {
        const { cafeteria, horario } = req.query;
        const db = getDB();
        
        let productosQuery = db.collection('productos').where('activo', '==', true);

        if (cafeteria) {
            productosQuery = productosQuery.where('id_cafeteria', '==', cafeteria);
        }

        const productosSnapshot = await productosQuery.get();
        
        // Procesar categorías en memoria
        const categoriasMap = new Map();
        
        productosSnapshot.docs.forEach(doc => {
            const producto = doc.data();
            
            // Filtro por horario
            if (horario && horario !== 'todo_dia') {
                if (producto.horario !== horario && producto.horario !== 'todo_dia') {
                    return;
                }
            }

            const categoria = producto.categoria;
            const precio = parseFloat(producto.precio);
            
            if (!categoriasMap.has(categoria)) {
                categoriasMap.set(categoria, {
                    categoria,
                    total_productos: 0,
                    precios: []
                });
            }
            
            const catData = categoriasMap.get(categoria);
            catData.total_productos++;
            catData.precios.push(precio);
        });

        // Calcular estadísticas
        const categoriasFormateadas = Array.from(categoriasMap.values()).map(cat => {
            const precios = cat.precios.sort((a, b) => a - b);
            return {
                categoria: cat.categoria,
                total_productos: cat.total_productos,
                precio_minimo: Math.min(...precios),
                precio_maximo: Math.max(...precios),
                precio_promedio: precios.reduce((a, b) => a + b, 0) / precios.length
            };
        }).sort((a, b) => a.categoria.localeCompare(b.categoria));

        const { response } = successResponse('Categorías obtenidas correctamente', {
            categorias: categoriasFormateadas,
            total_categorias: categoriasFormateadas.length,
            filtros_aplicados: {
                cafeteria: cafeteria || 'todas',
                horario: horario || 'todos'
            }
        });
        res.json(response);

    } catch (error) {
        console.error('Error obteniendo categorías:', error);
        const { response, statusCode } = errorResponse('Error obteniendo categorías', error);
        res.status(statusCode).json(response);
    }
};

// Obtener productos por horario
const getProductsBySchedule = async (req, res) => {
    try {
        const { horario } = req.params;
        const { cafeteria, categoria, vegetariano, precio_max } = req.query;
        const db = getDB();

        const horariosValidos = ['desayuno', 'almuerzo', 'cena', 'todo_dia'];
        if (!horariosValidos.includes(horario)) {
            const { response, statusCode } = errorResponse('Horario inválido');
            return res.status(statusCode).json(response);
        }

        // Query base
        let productosQuery = db.collection('productos').where('activo', '==', true);

        if (cafeteria) {
            productosQuery = productosQuery.where('id_cafeteria', '==', cafeteria);
        }

        const productosSnapshot = await productosQuery.get();
        
        // Obtener cafeterías activas
        const cafeteriasSnapshot = await db.collection('cafeterias')
            .where('activa', '==', true)
            .get();
        
        const cafeteriasMap = new Map();
        cafeteriasSnapshot.docs.forEach(doc => {
            cafeteriasMap.set(doc.id, doc.data());
        });

        // Filtrar productos
        let productos = productosSnapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter(producto => {
                // Filtro por horario
                if (producto.horario !== horario && producto.horario !== 'todo_dia') {
                    return false;
                }

                // Otros filtros
                if (categoria && producto.categoria !== categoria) {
                    return false;
                }

                if (vegetariano === 'true' && !producto.vegetariano) {
                    return false;
                }

                if (precio_max && producto.precio > parseFloat(precio_max)) {
                    return false;
                }

                return true;
            })
            .slice(0, 50); // Limitar resultados

        // Formatear productos
        const productosFormateados = productos.map(producto => {
            const cafeteria = cafeteriasMap.get(producto.id_cafeteria);
            
            return {
                ...producto,
                id_producto: producto.id,
                precio: parseFloat(producto.precio),
                vegetariano: !!producto.vegetariano,
                cafeteria_info: cafeteria ? {
                    id_cafeteria: producto.id_cafeteria,
                    nombre: cafeteria.nombre,
                    edificio: cafeteria.edificio
                } : null
            };
        });

        // Ordenar
        productosFormateados.sort((a, b) => {
            if (a.categoria !== b.categoria) {
                return a.categoria.localeCompare(b.categoria);
            }
            if (a.precio !== b.precio) {
                return a.precio - b.precio;
            }
            return a.nombre.localeCompare(b.nombre);
        });

        const { response } = successResponse(`Productos de ${horario} obtenidos correctamente`, {
            horario,
            productos: productosFormateados,
            total: productosFormateados.length,
            filtros_aplicados: {
                cafeteria: cafeteria || 'todas',
                categoria: categoria || 'todas',
                vegetariano: vegetariano || 'todos',
                precio_max: precio_max || null
            }
        });
        res.json(response);

    } catch (error) {
        console.error('Error obteniendo productos por horario:', error);
        const { response, statusCode } = errorResponse('Error obteniendo productos por horario', error);
        res.status(statusCode).json(response);
    }
};

module.exports = {
    getProductsByCafeteria,
    searchProducts,
    getProductById,
    getCategories,
    getProductsBySchedule
};