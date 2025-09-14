// routes/carrito.js
const express = require('express');
const auth = require('../middleware/auth');
const router = express.Router();

// Simulación de base de datos en memoria para carritos
let carritos = [];

// @route   GET /api/carrito
// @desc    Get user's cart
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const carrito = carritos.find(c => c.usuario === req.user.id && c.activo);
    
    if (!carrito) {
      return res.json({
        success: true,
        carrito: {
          id: null,
          usuario: req.user.id,
          items: [],
          total: 0,
          cafeteriaId: null,
          activo: true
        }
      });
    }

    // Recalcular total
    const total = carrito.items.reduce((sum, item) => sum + item.subtotal, 0);
    carrito.total = parseFloat(total.toFixed(2));

    res.json({
      success: true,
      carrito
    });
  } catch (error) {
    console.error('Error obteniendo carrito:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor'
    });
  }
});

// @route   POST /api/carrito
// @desc    Add item to cart
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const {
      itemId,
      nombre,
      precio,
      quantity = 1,
      descripcion,
      categoria,
      cafeteriaId,
      imagen
    } = req.body;

    // Validaciones
    if (!itemId || !nombre || !precio || !cafeteriaId) {
      return res.status(400).json({
        success: false,
        message: 'Datos del item incompletos'
      });
    }

    if (quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'La cantidad debe ser mayor a 0'
      });
    }

    // Buscar carrito existente del usuario
    let carrito = carritos.find(c => c.usuario === req.user.id && c.activo);
    
    // Si no existe carrito, crear uno nuevo
    if (!carrito) {
      carrito = {
        id: Date.now(),
        usuario: req.user.id,
        cafeteriaId: parseInt(cafeteriaId),
        items: [],
        total: 0,
        activo: true,
        fecha_creacion: new Date().toISOString(),
        fecha_actualizacion: new Date().toISOString()
      };
      carritos.push(carrito);
    }

    // Verificar que el item sea de la misma cafetería
    if (carrito.cafeteriaId && carrito.cafeteriaId !== parseInt(cafeteriaId)) {
      return res.status(400).json({
        success: false,
        message: 'No puedes agregar items de diferentes cafeterías',
        cafeteriaActual: carrito.cafeteriaId,
        cafeteriaNueva: parseInt(cafeteriaId)
      });
    }

    // Si es el primer item, establecer la cafetería
    if (!carrito.cafeteriaId) {
      carrito.cafeteriaId = parseInt(cafeteriaId);
    }

    // Verificar si el item ya existe en el carrito
    const itemExistente = carrito.items.find(item => item.itemId === parseInt(itemId));
    
    if (itemExistente) {
      // Actualizar cantidad del item existente
      itemExistente.quantity += quantity;
      itemExistente.subtotal = parseFloat((itemExistente.precio * itemExistente.quantity).toFixed(2));
    } else {
      // Agregar nuevo item
      const nuevoItem = {
        itemId: parseInt(itemId),
        nombre,
        precio: parseFloat(precio),
        quantity: parseInt(quantity),
        descripcion: descripcion || '',
        categoria: categoria || '',
        imagen: imagen || '',
        subtotal: parseFloat((precio * quantity).toFixed(2)),
        fecha_agregado: new Date().toISOString()
      };
      carrito.items.push(nuevoItem);
    }

    // Recalcular total
    carrito.total = parseFloat(carrito.items.reduce((sum, item) => sum + item.subtotal, 0).toFixed(2));
    carrito.fecha_actualizacion = new Date().toISOString();

    res.json({
      success: true,
      message: itemExistente ? 'Cantidad actualizada en el carrito' : 'Item agregado al carrito',
      carrito
    });
  } catch (error) {
    console.error('Error agregando al carrito:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor'
    });
  }
});

// @route   PUT /api/carrito/:itemId
// @desc    Update item quantity in cart
// @access  Private
router.put('/:itemId', auth, async (req, res) => {
  try {
    const itemId = parseInt(req.params.itemId);
    const { quantity } = req.body;

    if (!quantity || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'La cantidad debe ser mayor a 0'
      });
    }

    const carrito = carritos.find(c => c.usuario === req.user.id && c.activo);
    
    if (!carrito) {
      return res.status(404).json({
        success: false,
        message: 'Carrito no encontrado'
      });
    }

    const itemIndex = carrito.items.findIndex(item => item.itemId === itemId);
    
    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Item no encontrado en el carrito'
      });
    }

    // Actualizar cantidad y subtotal
    carrito.items[itemIndex].quantity = parseInt(quantity);
    carrito.items[itemIndex].subtotal = parseFloat((carrito.items[itemIndex].precio * quantity).toFixed(2));

    // Recalcular total
    carrito.total = parseFloat(carrito.items.reduce((sum, item) => sum + item.subtotal, 0).toFixed(2));
    carrito.fecha_actualizacion = new Date().toISOString();

    res.json({
      success: true,
      message: 'Cantidad actualizada',
      carrito
    });
  } catch (error) {
    console.error('Error actualizando carrito:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor'
    });
  }
});

// @route   DELETE /api/carrito/:itemId
// @desc    Remove item from cart
// @access  Private
router.delete('/:itemId', auth, async (req, res) => {
  try {
    const itemId = parseInt(req.params.itemId);

    const carrito = carritos.find(c => c.usuario === req.user.id && c.activo);
    
    if (!carrito) {
      return res.status(404).json({
        success: false,
        message: 'Carrito no encontrado'
      });
    }

    const itemIndex = carrito.items.findIndex(item => item.itemId === itemId);
    
    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Item no encontrado en el carrito'
      });
    }

    // Remover item
    const itemRemovido = carrito.items.splice(itemIndex, 1)[0];

    // Si no quedan items, resetear cafetería
    if (carrito.items.length === 0) {
      carrito.cafeteriaId = null;
      carrito.total = 0;
    } else {
      // Recalcular total
      carrito.total = parseFloat(carrito.items.reduce((sum, item) => sum + item.subtotal, 0).toFixed(2));
    }

    carrito.fecha_actualizacion = new Date().toISOString();

    res.json({
      success: true,
      message: 'Item removido del carrito',
      itemRemovido: itemRemovido.nombre,
      carrito
    });
  } catch (error) {
    console.error('Error removiendo del carrito:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor'
    });
  }
});

// @route   DELETE /api/carrito
// @desc    Clear cart
// @access  Private
router.delete('/', auth, async (req, res) => {
  try {
    const carritoIndex = carritos.findIndex(c => c.usuario === req.user.id && c.activo);
    
    if (carritoIndex === -1) {
      return res.json({
        success: true,
        message: 'Carrito ya estaba vacío',
        carrito: {
          id: null,
          usuario: req.user.id,
          items: [],
          total: 0,
          cafeteriaId: null,
          activo: true
        }
      });
    }

    // Limpiar carrito
    carritos[carritoIndex].items = [];
    carritos[carritoIndex].total = 0;
    carritos[carritoIndex].cafeteriaId = null;
    carritos[carritoIndex].fecha_actualizacion = new Date().toISOString();

    res.json({
      success: true,
      message: 'Carrito vaciado exitosamente',
      carrito: carritos[carritoIndex]
    });
  } catch (error) {
    console.error('Error vaciando carrito:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor'
    });
  }
});

// @route   POST /api/carrito/checkout
// @desc    Convert cart to order
// @access  Private
router.post('/checkout', auth, async (req, res) => {
  try {
    const { metodo_pago, observaciones } = req.body;

    if (!metodo_pago || !['efectivo', 'tarjeta', 'transferencia'].includes(metodo_pago)) {
      return res.status(400).json({
        success: false,
        message: 'Método de pago inválido'
      });
    }

    const carrito = carritos.find(c => c.usuario === req.user.id && c.activo);
    
    if (!carrito || carrito.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'El carrito está vacío'
      });
    }

    // Crear datos del pedido
    const pedidoData = {
      cafeteriaId: carrito.cafeteriaId,
      items: carrito.items,
      metodo_pago,
      observaciones: observaciones || '',
      tipo_pedido: 'normal'
    };

    // Limpiar carrito después del checkout
    carrito.items = [];
    carrito.total = 0;
    carrito.cafeteriaId = null;
    carrito.fecha_actualizacion = new Date().toISOString();

    res.json({
      success: true,
      message: 'Carrito preparado para pedido',
      pedidoData,
      redirect: '/api/pedidos' // El frontend debería hacer POST a esta ruta
    });
  } catch (error) {
    console.error('Error en checkout:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor'
    });
  }
});

// @route   GET /api/carrito/count
// @desc    Get cart items count
// @access  Private
router.get('/count', auth, async (req, res) => {
  try {
    const carrito = carritos.find(c => c.usuario === req.user.id && c.activo);
    
    const count = carrito ? carrito.items.reduce((total, item) => total + item.quantity, 0) : 0;

    res.json({
      success: true,
      count,
      total: carrito ? carrito.total : 0
    });
  } catch (error) {
    console.error('Error obteniendo count del carrito:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor'
    });
  }
});

module.exports = router;