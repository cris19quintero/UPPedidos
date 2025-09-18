// routes/menu.js - VERSION CORREGIDA QUE FUNCIONA
const express = require('express');
const router = express.Router();
const { getDB } = require('../config/database');

// @route   GET /api/menu/cafeteria/:id
// @desc    Obtener menú por cafetería - RUTA PRINCIPAL
// @access  Public
router.get('/cafeteria/:id', async (req, res) => {
  try {
    const cafeteriaId = req.params.id;
    console.log(`📍 GET /api/menu/cafeteria/${cafeteriaId}`);
    console.log(`🕐 Timestamp: ${new Date().toISOString()}`);
    
    const db = getDB();
    
    // Primero, verificar que la cafetería existe
    const cafeteriaDoc = await db.collection('cafeterias').doc(cafeteriaId).get();
    
    if (!cafeteriaDoc.exists) {
      console.log('⚠️ Cafetería no encontrada');
      return res.status(404).json({
        success: false,
        message: `Cafetería ${cafeteriaId} no encontrada`
      });
    }
    
    const cafeteriaData = cafeteriaDoc.data();
    console.log(`✅ Cafetería: ${cafeteriaData.nombre}`);
    
    // Buscar productos de esta cafetería
    // IMPORTANTE: Verificar el nombre exacto del campo en tu Firebase
    const productosSnapshot = await db.collection('productos')
      .where('id_cafeteria', '==', cafeteriaId)
      .where('activo', '==', true)
      .get();
    
    console.log(`📊 Productos encontrados: ${productosSnapshot.size}`);
    
    if (productosSnapshot.empty) {
      // Si no hay productos en 'productos', intentar en 'menu'
      console.log('🔄 Buscando en colección alternativa "menu"...');
      
      const menuSnapshot = await db.collection('menu')
        .where('cafeteria_id', '==', cafeteriaId)
        .where('activo', '==', true)
        .get();
      
      console.log(`📊 Productos en menu: ${menuSnapshot.size}`);
      
      if (menuSnapshot.empty) {
        return res.json({
          success: true,
          data: {
            cafeteria: {
              id_cafeteria: cafeteriaId,
              nombre: cafeteriaData.nombre
            },
            categorias: [],
            total_items: 0,
            mensaje: 'No hay productos disponibles en este momento'
          }
        });
      }
      
      // Procesar productos de la colección 'menu'
      const productos = [];
      menuSnapshot.forEach(doc => {
        const data = doc.data();
        productos.push({
          id: doc.id,
          id_producto: doc.id,
          ...data
        });
      });
      
      // Agrupar por categorías
      const categorias = agruparPorCategorias(productos);
      
      return res.json({
        success: true,
        data: {
          cafeteria: {
            id_cafeteria: cafeteriaId,
            nombre: cafeteriaData.nombre
          },
          categorias,
          total_items: productos.length,
          source: 'menu_collection'
        }
      });
    }
    
    // Procesar productos de la colección 'productos'
    const productos = [];
    productosSnapshot.forEach(doc => {
      const data = doc.data();
      productos.push({
        id: doc.id,
        id_producto: doc.id,
        ...data
      });
    });
    
    // Agrupar por categorías
    const categorias = agruparPorCategorias(productos);
    
    // Log de categorías para debug
    console.log('📁 Categorías encontradas:', categorias.map(c => `${c.categoria} (${c.items.length} items)`));
    
    res.json({
      success: true,
      data: {
        cafeteria: {
          id_cafeteria: cafeteriaId,
          nombre: cafeteriaData.nombre
        },
        categorias,
        total_items: productos.length,
        source: 'productos_collection'
      }
    });
    
  } catch (error) {
    console.error('❌ Error en /menu/cafeteria/:id:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener el menú',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Función helper para agrupar productos por categoría
function agruparPorCategorias(productos) {
  const categoriasMap = new Map();
  
  productos.forEach(producto => {
    const categoria = producto.categoria || 'Sin Categoría';
    
    if (!categoriasMap.has(categoria)) {
      categoriasMap.set(categoria, []);
    }
    
    // Formatear producto para el frontend
    const productoFormateado = {
      id: producto.id,
      id_producto: producto.id_producto || producto.id,
      nombre: producto.nombre,
      descripcion: producto.descripcion || '',
      precio: parseFloat(producto.precio) || 0,
      imagen: producto.imagen || '/imagenes/producto-default.jpg',
      categoria: producto.categoria,
      horario: producto.horario || 'todo_dia',
      tiempo_preparacion: producto.tiempo_preparacion || 15,
      ingredientes: Array.isArray(producto.ingredientes) ? producto.ingredientes : [],
      calorias: producto.calorias || null,
      vegetariano: producto.vegetariano || false,
      disponible: producto.disponible !== false, // default true
      activo: producto.activo !== false
    };
    
    categoriasMap.get(categoria).push(productoFormateado);
  });
  
  // Convertir Map a Array con el formato esperado
  const categorias = Array.from(categoriasMap.entries()).map(([categoria, items]) => ({
    categoria,
    items: items.sort((a, b) => a.nombre.localeCompare(b.nombre))
  }));
  
  // Ordenar categorías
  const ordenCategorias = ['Desayunos', 'Almuerzos', 'Cenas', 'Bebidas', 'Snacks', 'Postres'];
  categorias.sort((a, b) => {
    const indexA = ordenCategorias.indexOf(a.categoria);
    const indexB = ordenCategorias.indexOf(b.categoria);
    
    if (indexA !== -1 && indexB !== -1) {
      return indexA - indexB;
    } else if (indexA !== -1) {
      return -1;
    } else if (indexB !== -1) {
      return 1;
    }
    
    return a.categoria.localeCompare(b.categoria);
  });
  
  return categorias;
}

// @route   GET /api/menu/item/:id
// @desc    Obtener producto individual
// @access  Public
router.get('/item/:id', async (req, res) => {
  try {
    const productId = req.params.id;
    const db = getDB();
    
    // Buscar en productos
    let productoDoc = await db.collection('productos').doc(productId).get();
    
    // Si no está en productos, buscar en menu
    if (!productoDoc.exists) {
      productoDoc = await db.collection('menu').doc(productId).get();
    }
    
    if (!productoDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }
    
    const producto = { id: productoDoc.id, ...productoDoc.data() };
    
    res.json({
      success: true,
      data: {
        ...producto,
        id_producto: producto.id
      }
    });
    
  } catch (error) {
    console.error('Error obteniendo producto:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener el producto'
    });
  }
});

// @route   GET /api/menu/search
// @desc    Buscar productos
// @access  Public
router.get('/search', async (req, res) => {
  try {
    const { q: query, cafeteria } = req.query;
    
    if (!query || query.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'La búsqueda debe tener al menos 2 caracteres'
      });
    }
    
    const db = getDB();
    const searchQuery = query.toLowerCase().trim();
    const resultados = [];
    
    // Buscar en productos
    let productosQuery = db.collection('productos').where('activo', '==', true);
    if (cafeteria) {
      productosQuery = productosQuery.where('id_cafeteria', '==', cafeteria);
    }
    
    const productosSnapshot = await productosQuery.get();
    
    productosSnapshot.forEach(doc => {
      const producto = { id: doc.id, ...doc.data() };
      
      if (producto.nombre && producto.nombre.toLowerCase().includes(searchQuery)) {
        resultados.push({
          ...producto,
          id_producto: producto.id,
          source: 'productos'
        });
      }
    });
    
    // Si no hay resultados, buscar en menu
    if (resultados.length === 0) {
      let menuQuery = db.collection('menu').where('activo', '==', true);
      if (cafeteria) {
        menuQuery = menuQuery.where('cafeteria_id', '==', cafeteria);
      }
      
      const menuSnapshot = await menuQuery.get();
      
      menuSnapshot.forEach(doc => {
        const producto = { id: doc.id, ...doc.data() };
        
        if (producto.nombre && producto.nombre.toLowerCase().includes(searchQuery)) {
          resultados.push({
            ...producto,
            id_producto: producto.id,
            source: 'menu'
          });
        }
      });
    }
    
    res.json({
      success: true,
      data: {
        productos: resultados,
        total: resultados.length,
        query
      }
    });
    
  } catch (error) {
    console.error('Error en búsqueda:', error);
    res.status(500).json({
      success: false,
      message: 'Error en la búsqueda'
    });
  }
});

// @route   GET /api/menu/categorias
// @desc    Obtener todas las categorías
// @access  Public
router.get('/categorias', async (req, res) => {
  try {
    const { cafeteria } = req.query;
    const db = getDB();
    const categoriasSet = new Set();
    
    // Buscar en productos
    let productosQuery = db.collection('productos').where('activo', '==', true);
    if (cafeteria) {
      productosQuery = productosQuery.where('id_cafeteria', '==', cafeteria);
    }
    
    const productosSnapshot = await productosQuery.get();
    productosSnapshot.forEach(doc => {
      const producto = doc.data();
      if (producto.categoria) {
        categoriasSet.add(producto.categoria);
      }
    });
    
    // Si no hay categorías, buscar en menu
    if (categoriasSet.size === 0) {
      let menuQuery = db.collection('menu').where('activo', '==', true);
      if (cafeteria) {
        menuQuery = menuQuery.where('cafeteria_id', '==', cafeteria);
      }
      
      const menuSnapshot = await menuQuery.get();
      menuSnapshot.forEach(doc => {
        const producto = doc.data();
        if (producto.categoria) {
          categoriasSet.add(producto.categoria);
        }
      });
    }
    
    const categorias = Array.from(categoriasSet).sort();
    
    res.json({
      success: true,
      data: {
        categorias,
        total_categorias: categorias.length
      }
    });
    
  } catch (error) {
    console.error('Error obteniendo categorías:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener categorías'
    });
  }
});

// @route   GET /api/menu/test/:id
// @desc    Endpoint de prueba para debug
// @access  Public
router.get('/test/:id', async (req, res) => {
  try {
    const cafeteriaId = req.params.id;
    const db = getDB();
    
    console.log(`🧪 TEST para cafetería ${cafeteriaId}`);
    
    // Verificar cafetería
    const cafeteriaDoc = await db.collection('cafeterias').doc(cafeteriaId).get();
    const cafeteriaExists = cafeteriaDoc.exists;
    
    // Contar productos en ambas colecciones
    const productosCount = await db.collection('productos')
      .where('id_cafeteria', '==', cafeteriaId)
      .get();
    
    const menuCount = await db.collection('menu')
      .where('cafeteria_id', '==', cafeteriaId)
      .get();
    
    // Obtener un ejemplo de cada colección
    let ejemploProducto = null;
    let ejemploMenu = null;
    
    if (!productosCount.empty) {
      const doc = productosCount.docs[0];
      ejemploProducto = { id: doc.id, ...doc.data() };
    }
    
    if (!menuCount.empty) {
      const doc = menuCount.docs[0];
      ejemploMenu = { id: doc.id, ...doc.data() };
    }
    
    res.json({
      success: true,
      test_results: {
        cafeteria: {
          id: cafeteriaId,
          exists: cafeteriaExists,
          data: cafeteriaExists ? cafeteriaDoc.data() : null
        },
        productos_collection: {
          count: productosCount.size,
          ejemplo: ejemploProducto
        },
        menu_collection: {
          count: menuCount.size,
          ejemplo: ejemploMenu
        },
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Test falló:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;