// routes/menu.js
const express = require('express');
const router = express.Router();

// Datos estáticos del menú (en producción vendría de Firebase/MongoDB)
const menuData = {
  1: {
    categorias: [
      {
        categoria: 'Desayunos',
        items: [
          {
            id: 1,
            nombre: 'Desayuno Panameño',
            descripcion: 'Huevos revueltos, tortilla, queso fresco y café',
            precio: 4.50,
            imagen: '/imagenes/desayuno-panameno.jpg',
            disponible: true,
            categoria: 'Desayunos',
            horario: 'desayuno',
            tiempo_preparacion: 15,
            ingredientes: ['huevos', 'tortilla', 'queso', 'café'],
            calorias: 450,
            vegetariano: false,
            cafeteriaId: 1
          },
          {
            id: 2,
            nombre: 'Sandwich de Jamón',
            descripcion: 'Pan tostado, jamón de pavo, queso amarillo',
            precio: 3.00,
            imagen: '/imagenes/sandwich-jamon.jpg',
            disponible: true,
            categoria: 'Desayunos',
            horario: 'desayuno',
            tiempo_preparacion: 8,
            ingredientes: ['pan', 'jamón', 'queso'],
            calorias: 320,
            vegetariano: false,
            cafeteriaId: 1
          },
          {
            id: 3,
            nombre: 'Bowl de Avena con Frutas',
            descripcion: 'Avena, frutas frescas, miel y nueces',
            precio: 2.75,
            imagen: '/imagenes/bowl-avena.jpg',
            disponible: true,
            categoria: 'Desayunos',
            horario: 'desayuno',
            tiempo_preparacion: 10,
            ingredientes: ['avena', 'frutas', 'miel', 'nueces'],
            calorias: 280,
            vegetariano: true,
            cafeteriaId: 1
          }
        ]
      },
      {
        categoria: 'Bebidas Calientes',
        items: [
          {
            id: 4,
            nombre: 'Café Americano',
            descripcion: 'Café negro recién preparado',
            precio: 1.50,
            imagen: '/imagenes/cafe-americano.jpg',
            disponible: true,
            categoria: 'Bebidas Calientes',
            horario: 'todo_dia',
            tiempo_preparacion: 3,
            ingredientes: ['café'],
            calorias: 5,
            vegetariano: true,
            cafeteriaId: 1
          },
          {
            id: 5,
            nombre: 'Café con Leche',
            descripcion: 'Café con leche espumosa',
            precio: 2.00,
            imagen: '/imagenes/cafe-leche.jpg',
            disponible: true,
            categoria: 'Bebidas Calientes',
            horario: 'todo_dia',
            tiempo_preparacion: 5,
            ingredientes: ['café', 'leche'],
            calorias: 120,
            vegetariano: true,
            cafeteriaId: 1
          }
        ]
      },
      {
        categoria: 'Almuerzos',
        items: [
          {
            id: 6,
            nombre: 'Pollo Guisado',
            descripcion: 'Pollo guisado con arroz blanco y ensalada mixta',
            precio: 5.50,
            imagen: '/imagenes/pollo-guisado.jpg',
            disponible: true,
            categoria: 'Almuerzos',
            horario: 'almuerzo',
            tiempo_preparacion: 20,
            ingredientes: ['pollo', 'arroz', 'vegetales'],
            calorias: 620,
            vegetariano: false,
            cafeteriaId: 1
          }
        ]
      }
    ]
  },
  2: {
    categorias: [
      {
        categoria: 'Desayunos',
        items: [
          {
            id: 7,
            nombre: 'Pancakes con Miel',
            descripcion: 'Stack de pancakes con miel de maple',
            precio: 3.50,
            imagen: '/imagenes/pancakes.jpg',
            disponible: true,
            categoria: 'Desayunos',
            horario: 'desayuno',
            tiempo_preparacion: 12,
            ingredientes: ['harina', 'huevos', 'leche', 'miel'],
            calorias: 420,
            vegetariano: true,
            cafeteriaId: 2
          }
        ]
      },
      {
        categoria: 'Almuerzos',
        items: [
          {
            id: 8,
            nombre: 'Sancocho de Gallina',
            descripcion: 'Sancocho tradicional panameño',
            precio: 6.50,
            imagen: '/imagenes/sancocho.jpg',
            disponible: true,
            categoria: 'Almuerzos',
            horario: 'almuerzo',
            tiempo_preparacion: 25,
            ingredientes: ['gallina', 'yuca', 'ñame', 'mazorca'],
            calorias: 580,
            vegetariano: false,
            cafeteriaId: 2
          },
          {
            id: 9,
            nombre: 'Arroz con Pollo',
            descripcion: 'Arroz amarillo con pollo y vegetales',
            precio: 6.00,
            imagen: '/imagenes/arroz-pollo.jpg',
            disponible: true,
            categoria: 'Almuerzos',
            horario: 'almuerzo',
            tiempo_preparacion: 18,
            ingredientes: ['arroz', 'pollo', 'vegetales'],
            calorias: 520,
            vegetariano: false,
            cafeteriaId: 2
          }
        ]
      },
      {
        categoria: 'Cenas',
        items: [
          {
            id: 10,
            nombre: 'Hamburguesa Clásica',
            descripcion: 'Hamburguesa con papas fritas',
            precio: 4.50,
            imagen: '/imagenes/hamburguesa.jpg',
            disponible: true,
            categoria: 'Cenas',
            horario: 'cena',
            tiempo_preparacion: 15,
            ingredientes: ['carne', 'pan', 'vegetales', 'papas'],
            calorias: 680,
            vegetariano: false,
            cafeteriaId: 2
          }
        ]
      }
    ]
  },
  3: {
    categorias: [
      {
        categoria: 'Desayunos',
        items: [
          {
            id: 11,
            nombre: 'Tostadas con Tocino',
            descripcion: 'Huevos revueltos, tostadas y tocino con jugo de naranja',
            precio: 1.80,
            imagen: '/imagenes/tostadas-tocino.jpg',
            disponible: true,
            categoria: 'Desayunos',
            horario: 'desayuno',
            tiempo_preparacion: 10,
            ingredientes: ['huevos', 'tostadas', 'tocino', 'jugo'],
            calorias: 380,
            vegetariano: false,
            cafeteriaId: 3
          }
        ]
      },
      {
        categoria: 'Almuerzos',
        items: [
          {
            id: 12,
            nombre: 'Arroz con Pollo',
            descripcion: 'Arroz con pollo en plancha, frijoles, ensalada y plátanos fritos',
            precio: 1.75,
            imagen: '/imagenes/arroz-pollo-3.jpg',
            disponible: true,
            categoria: 'Almuerzos',
            horario: 'almuerzo',
            tiempo_preparacion: 18,
            ingredientes: ['arroz', 'pollo', 'frijoles', 'ensalada', 'plátano'],
            calorias: 490,
            vegetariano: false,
            cafeteriaId: 3
          }
        ]
      },
      {
        categoria: 'Cenas Ligeras',
        items: [
          {
            id: 13,
            nombre: 'Empanadas de Carne',
            descripcion: 'Empanadas crujientes rellenas de carne',
            precio: 2.50,
            imagen: '/imagenes/empanadas-carne.jpg',
            disponible: true,
            categoria: 'Cenas Ligeras',
            horario: 'cena',
            tiempo_preparacion: 10,
            ingredientes: ['masa', 'carne', 'condimentos'],
            calorias: 220,
            vegetariano: false,
            cafeteriaId: 3
          },
          {
            id: 14,
            nombre: 'Arroz con Carne',
            descripcion: 'Arroz blanco, frijoles, carne y ensalada de vegetales',
            precio: 1.00,
            imagen: '/imagenes/arroz-carne.jpg',
            disponible: true,
            categoria: 'Cenas Ligeras',
            horario: 'cena',
            tiempo_preparacion: 16,
            ingredientes: ['arroz', 'frijoles', 'carne', 'ensalada'],
            calorias: 410,
            vegetariano: false,
            cafeteriaId: 3
          }
        ]
      }
    ]
  }
};

// @route   GET /api/menu/cafeteria/:id
// @desc    Get menu by cafeteria ID
// @access  Public
router.get('/cafeteria/:id', async (req, res) => {
  try {
    const cafeteriaId = parseInt(req.params.id);
    const { horario, categoria, vegetariano } = req.query;
    
    const menu = menuData[cafeteriaId];
    
    if (!menu) {
      return res.status(404).json({
        success: false,
        message: 'Menú no encontrado para esta cafetería'
      });
    }

    let menuFiltrado = { ...menu };

    // Filtrar por horario
    if (horario && horario !== 'todo_dia') {
      menuFiltrado.categorias = menu.categorias.map(cat => ({
        ...cat,
        items: cat.items.filter(item => 
          item.disponible && (item.horario === horario || item.horario === 'todo_dia')
        )
      })).filter(cat => cat.items.length > 0);
    } else {
      // Solo mostrar items disponibles
      menuFiltrado.categorias = menu.categorias.map(cat => ({
        ...cat,
        items: cat.items.filter(item => item.disponible)
      })).filter(cat => cat.items.length > 0);
    }

    // Filtrar por categoría
    if (categoria) {
      menuFiltrado.categorias = menuFiltrado.categorias
        .filter(cat => cat.categoria.toLowerCase().includes(categoria.toLowerCase()));
    }

    // Filtrar por vegetariano
    if (vegetariano === 'true') {
      menuFiltrado.categorias = menuFiltrado.categorias.map(cat => ({
        ...cat,
        items: cat.items.filter(item => item.vegetariano === true)
      })).filter(cat => cat.items.length > 0);
    }

    const totalItems = menuFiltrado.categorias.reduce((total, cat) => total + cat.items.length, 0);

    res.json({
      success: true,
      cafeteriaId,
      menu: menuFiltrado,
      total_items: totalItems,
      filtros: {
        horario: horario || 'todos',
        categoria: categoria || 'todas',
        vegetariano: vegetariano || 'todos'
      }
    });
  } catch (error) {
    console.error('Error obteniendo menú:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor'
    });
  }
});

// @route   GET /api/menu/horario/:horario
// @desc    Get menu items by horario (desayuno, almuerzo, cena, todo_dia)
// @access  Public
router.get('/horario/:horario', async (req, res) => {
  try {
    const horario = req.params.horario.toLowerCase();
    const { cafeteria, vegetariano, max_precio } = req.query;
    
    const itemsPorHorario = [];

    // Determinar qué cafeterías buscar
    const cafeteriasABuscar = cafeteria ? [cafeteria] : Object.keys(menuData);

    cafeteriasABuscar.forEach(id => {
      const menu = menuData[id];
      if (!menu) return;

      menu.categorias.forEach(categoria => {
        categoria.items.forEach(item => {
          if (item.disponible && (item.horario === horario || item.horario === 'todo_dia')) {
            let incluir = true;

            // Filtro vegetariano
            if (vegetariano === 'true' && !item.vegetariano) {
              incluir = false;
            }

            // Filtro precio máximo
            if (max_precio && item.precio > parseFloat(max_precio)) {
              incluir = false;
            }

            if (incluir) {
              itemsPorHorario.push({
                ...item,
                cafeteriaId: parseInt(id)
              });
            }
          }
        });
      });
    });

    // Ordenar por precio
    itemsPorHorario.sort((a, b) => a.precio - b.precio);

    res.json({
      success: true,
      horario,
      items: itemsPorHorario,
      total: itemsPorHorario.length,
      filtros: {
        cafeteria: cafeteria || 'todas',
        vegetariano: vegetariano || 'todos',
        max_precio: max_precio || 'sin_limite'
      }
    });
  } catch (error) {
    console.error('Error obteniendo menú por horario:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor'
    });
  }
});

// @route   GET /api/menu/search
// @desc    Search menu items
// @access  Public
router.get('/search', async (req, res) => {
  try {
    const { q: query, cafeteria, horario, vegetariano, max_precio, min_precio } = req.query;
    
    if (!query || query.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'La búsqueda debe tener al menos 2 caracteres'
      });
    }

    const resultados = [];
    const searchQuery = query.toLowerCase().trim();

    // Determinar en qué cafeterías buscar
    const cafeteriasABuscar = cafeteria ? [cafeteria] : Object.keys(menuData);

    cafeteriasABuscar.forEach(id => {
      const menu = menuData[id];
      if (!menu) return;

      menu.categorias.forEach(categoria => {
        categoria.items.forEach(item => {
          if (!item.disponible) return;

          const matchNombre = item.nombre.toLowerCase().includes(searchQuery);
          const matchDescripcion = item.descripcion.toLowerCase().includes(searchQuery);
          const matchIngredientes = item.ingredientes.some(ing => 
            ing.toLowerCase().includes(searchQuery)
          );
          const matchCategoria = item.categoria.toLowerCase().includes(searchQuery);

          if (matchNombre || matchDescripcion || matchIngredientes || matchCategoria) {
            let incluir = true;

            // Aplicar filtros adicionales
            if (horario && horario !== 'todo_dia' && item.horario !== horario && item.horario !== 'todo_dia') {
              incluir = false;
            }

            if (vegetariano === 'true' && !item.vegetariano) {
              incluir = false;
            }

            if (max_precio && item.precio > parseFloat(max_precio)) {
              incluir = false;
            }

            if (min_precio && item.precio < parseFloat(min_precio)) {
              incluir = false;
            }

            if (incluir) {
              resultados.push({
                ...item,
                cafeteriaId: parseInt(id),
                relevancia: calcularRelevancia(item, searchQuery)
              });
            }
          }
        });
      });
    });

    // Ordenar por relevancia y luego por precio
    resultados.sort((a, b) => {
      if (a.relevancia !== b.relevancia) {
        return b.relevancia - a.relevancia;
      }
      return a.precio - b.precio;
    });

    res.json({
      success: true,
      query,
      resultados: resultados.map(({ relevancia, ...item }) => item), // Remover relevancia del resultado
      total: resultados.length,
      filtros: {
        cafeteria: cafeteria || 'todas',
        horario: horario || 'todos',
        vegetariano: vegetariano || 'todos',
        max_precio: max_precio || 'sin_limite',
        min_precio: min_precio || 'sin_limite'
      }
    });
  } catch (error) {
    console.error('Error en búsqueda:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor'
    });
  }
});

// @route   GET /api/menu/item/:id
// @desc    Get menu item by ID
// @access  Public
router.get('/item/:id', async (req, res) => {
  try {
    const itemId = parseInt(req.params.id);
    let itemEncontrado = null;
    let cafeteriaId = null;

    // Buscar el item en todas las cafeterías
    Object.entries(menuData).forEach(([id, menu]) => {
      if (itemEncontrado) return;
      
      menu.categorias.forEach(categoria => {
        const item = categoria.items.find(i => i.id === itemId);
        if (item) {
          itemEncontrado = item;
          cafeteriaId = parseInt(id);
        }
      });
    });

    if (!itemEncontrado) {
      return res.status(404).json({
        success: false,
        message: 'Item no encontrado'
      });
    }

    if (!itemEncontrado.disponible) {
      return res.status(404).json({
        success: false,
        message: 'Item no disponible actualmente'
      });
    }

    res.json({
      success: true,
      item: {
        ...itemEncontrado,
        cafeteriaId
      }
    });
  } catch (error) {
    console.error('Error obteniendo item:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor'
    });
  }
});

// @route   GET /api/menu/categorias
// @desc    Get all categories
// @access  Public
router.get('/categorias', async (req, res) => {
  try {
    const { cafeteria } = req.query;
    const categorias = new Set();

    const cafeteriasABuscar = cafeteria ? [cafeteria] : Object.keys(menuData);

    cafeteriasABuscar.forEach(id => {
      const menu = menuData[id];
      if (!menu) return;

      menu.categorias.forEach(categoria => {
        if (categoria.items.some(item => item.disponible)) {
          categorias.add(categoria.categoria);
        }
      });
    });

    res.json({
      success: true,
      categorias: Array.from(categorias).sort(),
      total: categorias.size
    });
  } catch (error) {
    console.error('Error obteniendo categorías:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor'
    });
  }
});

// Función auxiliar para calcular relevancia en búsquedas
function calcularRelevancia(item, query) {
  let puntos = 0;
  
  // Coincidencia exacta en nombre (máxima relevancia)
  if (item.nombre.toLowerCase() === query) {
    puntos += 100;
  } else if (item.nombre.toLowerCase().includes(query)) {
    puntos += 50;
  }
  
  // Coincidencia en descripción
  if (item.descripcion.toLowerCase().includes(query)) {
    puntos += 25;
  }
  
  // Coincidencia en ingredientes
  item.ingredientes.forEach(ingrediente => {
    if (ingrediente.toLowerCase().includes(query)) {
      puntos += 15;
    }
  });
  
  // Coincidencia en categoría
  if (item.categoria.toLowerCase().includes(query)) {
    puntos += 10;
  }
  
  return puntos;
}

module.exports = router;    