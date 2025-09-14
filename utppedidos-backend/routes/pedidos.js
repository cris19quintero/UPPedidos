// routes/pedidos.js
const express = require('express');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const router = express.Router();

// Simulación de base de datos en memoria (en producción sería MongoDB/Firebase)
let pedidos = [];
let pedidoCounter = 1;

// @route   POST /api/pedidos
// @desc    Create new order
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const {
      cafeteriaId,
      items,
      metodo_pago,
      observaciones,
      tipo_pedido = 'normal'
    } = req.body;

    // Validaciones básicas
    if (!cafeteriaId || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Datos del pedido incompletos'
      });
    }

    if (!metodo_pago || !['efectivo', 'tarjeta', 'transferencia'].includes(metodo_pago)) {
      return res.status(400).json({
        success: false,
        message: 'Método de pago inválido'
      });
    }

    // Calcular total
    const total = items.reduce((sum, item) => {
      return sum + (item.precio * item.quantity);
    }, 0);

    // Crear pedido
    const nuevoPedido = {
      id: pedidoCounter++,
      numero_orden: `UTP-${Date.now().toString().slice(-6)}`,
      usuario: req.user.id,
      usuario_email: req.user.email,
      usuario_nombre: req.user.nombre,
      cafeteriaId: parseInt(cafeteriaId),
      items: items.map(item => ({
        id: item.id,
        nombre: item.nombre,
        precio: item.precio,
        quantity: item.quantity,
        descripcion: item.descripcion || '',
        categoria: item.categoria || '',
        subtotal: item.precio * item.quantity
      })),
      total: parseFloat(total.toFixed(2)),
      metodo_pago,
      tipo_pedido,
      observaciones: observaciones || '',
      estado: 'pendiente',
      fecha_pedido: new Date().toISOString(),
      fecha_actualizacion: new Date().toISOString()
    };

    // Agregar información de la cafetería (simulado)
    const cafeteriaInfo = {
      1: { nombre: 'Cafetería Edificio 1', edificio: 'Edificio 1' },
      2: { nombre: 'Cafetería Central', edificio: 'Cafetería Central' },
      3: { nombre: 'Cafetería Edificio 3', edificio: 'Edificio 3' }
    };
    
    nuevoPedido.cafeteria_info = cafeteriaInfo[cafeteriaId] || {
      nombre: 'Cafetería Desconocida',
      edificio: 'Desconocido'
    };

    // Guardar pedido
    pedidos.push(nuevoPedido);

    console.log(`Nuevo pedido creado: ${nuevoPedido.numero_orden} por ${req.user.email}`);

    res.status(201).json({
      success: true,
      message: 'Pedido creado exitosamente',
      pedido: nuevoPedido
    });
  } catch (error) {
    console.error('Error creando pedido:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor'
    });
  }
});

// @route   GET /api/pedidos
// @desc    Get user orders
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      estado,
      fechaDesde,
      fechaHasta
    } = req.query;

    // Filtrar pedidos del usuario
    let pedidosUsuario = pedidos.filter(p => p.usuario === req.user.id);

    // Aplicar filtros
    if (estado) {
      pedidosUsuario = pedidosUsuario.filter(p => p.estado === estado);
    }

    if (fechaDesde) {
      const desde = new Date(fechaDesde);
      pedidosUsuario = pedidosUsuario.filter(p => new Date(p.fecha_pedido) >= desde);
    }

    if (fechaHasta) {
      const hasta = new Date(fechaHasta);
      hasta.setHours(23, 59, 59, 999);
      pedidosUsuario = pedidosUsuario.filter(p => new Date(p.fecha_pedido) <= hasta);
    }

    // Ordenar por fecha (más reciente primero)
    pedidosUsuario.sort((a, b) => new Date(b.fecha_pedido) - new Date(a.fecha_pedido));

    // Paginación
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const pedidosPaginados = pedidosUsuario.slice(startIndex, endIndex);

    res.json({
      success: true,
      pedidos: pedidosPaginados,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(pedidosUsuario.length / limit),
        total: pedidosUsuario.length
      }
    });
  } catch (error) {
    console.error('Error obteniendo pedidos:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor'
    });
  }
});

// @route   GET /api/pedidos/:id
// @desc    Get order by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const pedidoId = parseInt(req.params.id);
    const pedido = pedidos.find(p => p.id === pedidoId);
    
    if (!pedido) {
      return res.status(404).json({
        success: false,
        message: 'Pedido no encontrado'
      });
    }

    // Verificar que el pedido pertenezca al usuario (a menos que sea admin)
    if (pedido.usuario !== req.user.id && req.user.rol !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para ver este pedido'
      });
    }

    res.json({
      success: true,
      pedido
    });
  } catch (error) {
    console.error('Error obteniendo pedido:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor'
    });
  }
});

// @route   PUT /api/pedidos/:id/status
// @desc    Update order status (Admin only)
// @access  Private/Admin
router.put('/:id/status', [auth, admin], async (req, res) => {
  try {
    const pedidoId = parseInt(req.params.id);
    const { estado } = req.body;
    
    const estadosValidos = ['pendiente', 'en_proceso', 'por_retirar', 'retirado', 'completado', 'cancelado', 'expirado'];
    
    if (!estado || !estadosValidos.includes(estado)) {
      return res.status(400).json({
        success: false,
        message: 'Estado inválido'
      });
    }

    const pedidoIndex = pedidos.findIndex(p => p.id === pedidoId);
    
    if (pedidoIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Pedido no encontrado'
      });
    }

    const pedidoAnterior = { ...pedidos[pedidoIndex] };
    
    // Actualizar estado
    pedidos[pedidoIndex].estado = estado;
    pedidos[pedidoIndex].fecha_actualizacion = new Date().toISOString();
    
    if (estado === 'completado' || estado === 'retirado') {
      pedidos[pedidoIndex].fecha_completado = new Date().toISOString();
    }

    console.log(`Pedido ${pedidoId} actualizado de ${pedidoAnterior.estado} a ${estado}`);

    res.json({
      success: true,
      message: `Pedido actualizado a ${estado}`,
      pedido: pedidos[pedidoIndex]
    });
  } catch (error) {
    console.error('Error actualizando pedido:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor'
    });
  }
});

// @route   DELETE /api/pedidos/:id
// @desc    Cancel order
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const pedidoId = parseInt(req.params.id);
    const pedidoIndex = pedidos.findIndex(p => p.id === pedidoId);
    
    if (pedidoIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Pedido no encontrado'
      });
    }

    const pedido = pedidos[pedidoIndex];

    // Verificar permisos
    if (pedido.usuario !== req.user.id && req.user.rol !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para cancelar este pedido'
      });
    }

    // Solo se pueden cancelar pedidos pendientes o en proceso
    if (!['pendiente', 'en_proceso'].includes(pedido.estado)) {
      return res.status(400).json({
        success: false,
        message: 'No se puede cancelar un pedido en este estado'
      });
    }

    // Actualizar estado en lugar de eliminar
    pedidos[pedidoIndex].estado = 'cancelado';
    pedidos[pedidoIndex].fecha_actualizacion = new Date().toISOString();
    pedidos[pedidoIndex].fecha_cancelado = new Date().toISOString();

    res.json({
      success: true,
      message: 'Pedido cancelado exitosamente',
      pedido: pedidos[pedidoIndex]
    });
  } catch (error) {
    console.error('Error cancelando pedido:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor'
    });
  }
});

// @route   GET /api/pedidos/stats/user
// @desc    Get user order statistics
// @access  Private
router.get('/stats/user', auth, async (req, res) => {
  try {
    const pedidosUsuario = pedidos.filter(p => p.usuario === req.user.id);
    
    const stats = {
      total_pedidos: pedidosUsuario.length,
      pedidos_completados: pedidosUsuario.filter(p => p.estado === 'completado').length,
      pedidos_pendientes: pedidosUsuario.filter(p => ['pendiente', 'en_proceso', 'por_retirar'].includes(p.estado)).length,
      pedidos_cancelados: pedidosUsuario.filter(p => p.estado === 'cancelado').length,
      total_gastado: pedidosUsuario
        .filter(p => p.estado === 'completado')
        .reduce((sum, p) => sum + p.total, 0),
      cafeteria_favorita: getFavoriteCafeteria(pedidosUsuario),
      ultimo_pedido: pedidosUsuario.length > 0 
        ? pedidosUsuario.sort((a, b) => new Date(b.fecha_pedido) - new Date(a.fecha_pedido))[0]
        : null
    };

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor'
    });
  }
});

// @route   GET /api/pedidos/admin/all
// @desc    Get all orders (Admin only)
// @access  Private/Admin
router.get('/admin/all', [auth, admin], async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      estado,
      cafeteria,
      fechaDesde,
      fechaHasta
    } = req.query;

    let pedidosFiltrados = [...pedidos];

    // Aplicar filtros
    if (estado) {
      pedidosFiltrados = pedidosFiltrados.filter(p => p.estado === estado);
    }

    if (cafeteria) {
      pedidosFiltrados = pedidosFiltrados.filter(p => p.cafeteriaId === parseInt(cafeteria));
    }

    if (fechaDesde) {
      const desde = new Date(fechaDesde);
      pedidosFiltrados = pedidosFiltrados.filter(p => new Date(p.fecha_pedido) >= desde);
    }

    if (fechaHasta) {
      const hasta = new Date(fechaHasta);
      hasta.setHours(23, 59, 59, 999);
      pedidosFiltrados = pedidosFiltrados.filter(p => new Date(p.fecha_pedido) <= hasta);
    }

    // Ordenar por fecha (más reciente primero)
    pedidosFiltrados.sort((a, b) => new Date(b.fecha_pedido) - new Date(a.fecha_pedido));

    // Paginación
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const pedidosPaginados = pedidosFiltrados.slice(startIndex, endIndex);

    res.json({
      success: true,
      pedidos: pedidosPaginados,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(pedidosFiltrados.length / limit),
        total: pedidosFiltrados.length
      },
      filtros: {
        estado,
        cafeteria,
        fechaDesde,
        fechaHasta
      }
    });
  } catch (error) {
    console.error('Error obteniendo pedidos (admin):', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor'
    });
  }
});

// Función auxiliar para obtener cafetería favorita
function getFavoriteCafeteria(pedidosUsuario) {
  if (pedidosUsuario.length === 0) return null;
  
  const contadorCafeterias = {};
  pedidosUsuario.forEach(pedido => {
    const id = pedido.cafeteriaId;
    contadorCafeterias[id] = (contadorCafeterias[id] || 0) + 1;
  });
  
  const cafeteriaFavoritaId = Object.keys(contadorCafeterias)
    .reduce((a, b) => contadorCafeterias[a] > contadorCafeterias[b] ? a : b);
  
  const cafeteriaNames = {
    1: 'Cafetería Edificio 1',
    2: 'Cafetería Central',
    3: 'Cafetería Edificio 3'
  };
  
  return {
    id: parseInt(cafeteriaFavoritaId),
    nombre: cafeteriaNames[cafeteriaFavoritaId] || 'Desconocida',
    pedidos: contadorCafeterias[cafeteriaFavoritaId]
  };
}

module.exports = router;