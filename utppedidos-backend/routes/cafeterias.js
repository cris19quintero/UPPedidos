// routes/cafeterias.js
const express = require('express');
const router = express.Router();

// Datos estáticos de cafeterías (en producción vendría de Firebase/MongoDB)
const cafeteriasData = [
  {
    id: 1,
    nombre: 'Cafetería Edificio 1',
    direccion: 'Edificio 1, Planta Baja',
    edificio: 'Edificio 1',
    imagen: '/imagenes/cafeteria1.png',
    color: '#ff9e80',
    ubicacion: {
      lat: 9.0348,
      lng: -79.5453
    },
    horarios: {
      desayuno: { inicio: '07:00', fin: '09:30' },
      almuerzo: { inicio: '11:45', fin: '13:45' },
      cena: { inicio: '16:30', fin: '19:00' }
    },
    activa: true,
    telefono: '+507 123-4567',
    email: 'cafeteria1@utp.ac.pa',
    administrador: 'Administrador 1'
  },
  {
    id: 2,
    nombre: 'Cafetería Central',
    direccion: 'Edificio Central, 2do Piso',
    edificio: 'Central',
    imagen: '/imagenes/cafeteria2.png',
    color: '#80d8ff',
    ubicacion: {
      lat: 9.0349,
      lng: -79.5454
    },
    horarios: {
      desayuno: { inicio: '07:00', fin: '09:30' },
      almuerzo: { inicio: '11:45', fin: '13:45' },
      cena: { inicio: '16:30', fin: '19:00' }
    },
    activa: true,
    telefono: '+507 123-4568',
    email: 'cafeteriacentral@utp.ac.pa',
    administrador: 'Administrador 2'
  },
  {
    id: 3,
    nombre: 'Cafetería Edificio 3',
    direccion: 'Edificio 3, Planta Baja',
    edificio: 'Edificio 3',
    imagen: '/imagenes/cafeteria3.png',
    color: '#8adc9d',
    ubicacion: {
      lat: 9.0350,
      lng: -79.5455
    },
    horarios: {
      desayuno: { inicio: '07:30', fin: '10:00' },
      almuerzo: { inicio: '12:00', fin: '14:00' },
      cena: { inicio: '17:00', fin: '19:30' }
    },
    activa: true,
    telefono: '+507 123-4569',
    email: 'cafeteria3@utp.ac.pa',
    administrador: 'Administrador 3'
  }
];

// @route   GET /api/cafeterias
// @desc    Get all cafeterias
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { activa = true } = req.query;
    
    let cafeterias = cafeteriasData;
    
    // Filtrar por estado activo si se especifica
    if (activa !== undefined) {
      const isActiva = activa === 'true' || activa === true;
      cafeterias = cafeteriasData.filter(c => c.activa === isActiva);
    }
    
    res.json({
      success: true,
      cafeterias,
      total: cafeterias.length
    });
  } catch (error) {
    console.error('Error obteniendo cafeterías:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor'
    });
  }
});

// @route   GET /api/cafeterias/:id
// @desc    Get cafeteria by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const cafeteriaId = parseInt(req.params.id);
    const cafeteria = cafeteriasData.find(c => c.id === cafeteriaId);
    
    if (!cafeteria) {
      return res.status(404).json({
        success: false,
        message: 'Cafetería no encontrada'
      });
    }

    res.json({
      success: true,
      cafeteria
    });
  } catch (error) {
    console.error('Error obteniendo cafetería:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'ID de cafetería inválido'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error del servidor'
    });
  }
});

// @route   GET /api/cafeterias/:id/horarios
// @desc    Get cafeteria schedule
// @access  Public
router.get('/:id/horarios', async (req, res) => {
  try {
    const cafeteriaId = parseInt(req.params.id);
    const cafeteria = cafeteriasData.find(c => c.id === cafeteriaId);
    
    if (!cafeteria) {
      return res.status(404).json({
        success: false,
        message: 'Cafetería no encontrada'
      });
    }

    res.json({
      success: true,
      horarios: cafeteria.horarios,
      cafeteria: {
        id: cafeteria.id,
        nombre: cafeteria.nombre,
        edificio: cafeteria.edificio
      }
    });
  } catch (error) {
    console.error('Error obteniendo horarios:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor'
    });
  }
});

// @route   GET /api/cafeterias/:id/ubicacion
// @desc    Get cafeteria location
// @access  Public
router.get('/:id/ubicacion', async (req, res) => {
  try {
    const cafeteriaId = parseInt(req.params.id);
    const cafeteria = cafeteriasData.find(c => c.id === cafeteriaId);
    
    if (!cafeteria) {
      return res.status(404).json({
        success: false,
        message: 'Cafetería no encontrada'
      });
    }

    res.json({
      success: true,
      ubicacion: cafeteria.ubicacion,
      direccion: cafeteria.direccion,
      cafeteria: {
        id: cafeteria.id,
        nombre: cafeteria.nombre,
        edificio: cafeteria.edificio
      }
    });
  } catch (error) {
    console.error('Error obteniendo ubicación:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor'
    });
  }
});

// @route   GET /api/cafeterias/horario/actual
// @desc    Get current schedule for all cafeterias
// @access  Public
router.get('/horario/actual', async (req, res) => {
  try {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    const cafeteriasConEstado = cafeteriasData
      .filter(c => c.activa)
      .map(cafeteria => {
        const horarios = cafeteria.horarios;
        let estadoActual = 'cerrada';
        let proximoHorario = null;

        // Verificar cada horario
        Object.entries(horarios).forEach(([periodo, horario]) => {
          if (currentTime >= horario.inicio && currentTime <= horario.fin) {
            estadoActual = `abierta_${periodo}`;
          }
        });

        // Si está cerrada, encontrar el próximo horario
        if (estadoActual === 'cerrada') {
          const horariosOrdenados = Object.entries(horarios)
            .map(([periodo, horario]) => ({ periodo, ...horario }))
            .sort((a, b) => a.inicio.localeCompare(b.inicio));

          for (const horario of horariosOrdenados) {
            if (currentTime < horario.inicio) {
              proximoHorario = horario;
              break;
            }
          }
        }

        return {
          ...cafeteria,
          estado_actual: estadoActual,
          proximo_horario: proximoHorario,
          hora_actual: currentTime
        };
      });

    res.json({
      success: true,
      cafeterias: cafeteriasConEstado,
      hora_actual: currentTime,
      fecha_actual: now.toISOString()
    });
  } catch (error) {
    console.error('Error obteniendo horario actual:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor'
    });
  }
});

module.exports = router;