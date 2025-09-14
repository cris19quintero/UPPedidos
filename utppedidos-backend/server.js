// server.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const colors = require('colors');
const path = require('path');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

// Importar conexión a la base de datos
const connectDB = require('./config/database');

// Importar middleware de manejo de errores
const errorHandler = require('./utils/errorHandler');

// Importar rutas
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const cafeteriaRoutes = require('./routes/cafeterias');
const menuRoutes = require('./routes/menu');
const pedidoRoutes = require('./routes/pedidos');
const carritoRoutes = require('./routes/carrito');

// Crear aplicación Express
const app = express();

// Conectar a la base de datos
connectDB();

// ========== MIDDLEWARE ==========

// Seguridad
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"]
    }
  }
}));

// CORS
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://utppedidos.netlify.app', 'https://utppedidos.vercel.app']
    : ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token']
}));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Servir archivos estáticos
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/public', express.static(path.join(__dirname, 'public')));

// ========== RUTAS ==========

// Ruta de salud
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Servidor UTPedidos funcionando correctamente',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: '1.0.0'
  });
});

// Rutas principales
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/cafeterias', cafeteriaRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/pedidos', pedidoRoutes);
app.use('/api/carrito', carritoRoutes);

// Ruta de información de la API
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'API UTPedidos v1.0.0',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      cafeterias: '/api/cafeterias',
      menu: '/api/menu',
      pedidos: '/api/pedidos',
      carrito: '/api/carrito'
    },
    documentation: '/api/docs'
  });
});

// Documentación simple de la API
app.get('/api/docs', (req, res) => {
  res.json({
    success: true,
    api_documentation: {
      authentication: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        me: 'GET /api/auth/me [Protected]',
        refresh: 'POST /api/auth/refresh [Protected]',
        logout: 'POST /api/auth/logout [Protected]'
      },
      users: {
        profile: 'PUT /api/users/profile [Protected]',
        stats: 'GET /api/users/stats/overview [Admin]'
      },
      cafeterias: {
        list: 'GET /api/cafeterias',
        getById: 'GET /api/cafeterias/:id'
      },
      menu: {
        byCafeteria: 'GET /api/menu/cafeteria/:id',
        byHorario: 'GET /api/menu/horario/:horario',
        search: 'GET /api/menu/search?q=query'
      },
      pedidos: {
        create: 'POST /api/pedidos [Protected]',
        list: 'GET /api/pedidos [Protected]',
        getById: 'GET /api/pedidos/:id [Protected]',
        updateStatus: 'PUT /api/pedidos/:id/status [Admin]'
      },
      carrito: {
        get: 'GET /api/carrito [Protected]',
        add: 'POST /api/carrito [Protected]',
        update: 'PUT /api/carrito/:itemId [Protected]',
        remove: 'DELETE /api/carrito/:itemId [Protected]',
        clear: 'DELETE /api/carrito [Protected]'
      }
    }
  });
});

// Manejo de rutas no encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Ruta ${req.originalUrl} no encontrada`,
    suggestion: 'Visita /api para ver las rutas disponibles'
  });
});

// Middleware de manejo de errores (debe ir al final)
app.use(errorHandler);

// ========== INICIO DEL SERVIDOR ==========

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log('');
  console.log('='.repeat(60).cyan);
  console.log(`🚀 SERVIDOR UTPEDIDOS INICIADO`.cyan.bold);
  console.log('='.repeat(60).cyan);
  console.log(`📍 Modo: ${process.env.NODE_ENV || 'development'}`.yellow);
  console.log(`🌐 Puerto: ${PORT}`.yellow);
  console.log(`📡 URL: http://localhost:${PORT}`.yellow);
  console.log(`🔗 API: http://localhost:${PORT}/api`.yellow);
  console.log(`📖 Docs: http://localhost:${PORT}/api/docs`.yellow);
  console.log(`💚 Health: http://localhost:${PORT}/health`.yellow);
  console.log('='.repeat(60).cyan);
  console.log('');
});

// Manejo de errores del servidor
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Puerto ${PORT} ya está en uso`.red);
    process.exit(1);
  } else {
    console.error(`❌ Error del servidor:`, error);
    process.exit(1);
  }
});

// Manejo de cierre del servidor
process.on('SIGINT', () => {
  console.log('\n⚠️ Cerrando servidor...'.yellow);
  server.close(() => {
    console.log('✅ Servidor cerrado correctamente'.green);
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('\n⚠️ Cerrando servidor (SIGTERM)...'.yellow);
  server.close(() => {
    console.log('✅ Servidor cerrado correctamente'.green);
    process.exit(0);
  });
});

// Manejo de promesas rechazadas no capturadas
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Promise Rejection:', err);
  server.close(() => {
    process.exit(1);
  });
});

// Manejo de excepciones no capturadas
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  process.exit(1);
});

module.exports = app;