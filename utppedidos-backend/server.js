// server.js - CORS CORREGIDO PARA VERCEL + RAILWAY
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const compression = require('compression');
const colors = require('colors');
require('dotenv').config();

// Importar configuración de base de datos
const { connectDB, healthCheck, getDatabaseStats } = require('./config/database');

const app = express();

// Configuración del puerto para Railway
const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '0.0.0.0';

// Middlewares de seguridad y rendimiento
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

if (process.env.COMPRESSION_ENABLED === 'true') {
  app.use(compression({ level: parseInt(process.env.COMPRESSION_LEVEL) || 6 }));
}

// ✅ CORS CORREGIDO PARA VERCEL
const corsOptions = {
  origin: [
    // URLs de producción Vercel - ✅ SIN "/" al final
    'https://utppedidos.vercel.app',
    'https://utppedidos-git-main-cristopher-quintero-s-projects.vercel.app',
    'https://utppedidos-f9a2zfdal-cristopher-quintero-s-projects.vercel.app',
    
    // Wildcards para cualquier deploy de Vercel
    'https://utppedidos-*.vercel.app',
    
    // URLs de desarrollo local
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:3001',
    
    // Variables de entorno (si están definidas)
    process.env.FRONTEND_URL,
    process.env.FRONTEND_URL_PROD,
    
    // Firebase (si usas)
    'https://utppedidos-2d630.web.app',
    'https://utppedidos-2d630.firebaseapp.com',
    
    // Railway URL propia (para health checks)
    'https://uppedidos-production.up.railway.app'
  ].filter(Boolean), // Remover valores undefined/null
  
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'x-auth-token', 
    'Accept',
    'Origin',
    'X-Requested-With'
  ],
  optionsSuccessStatus: 200 // Para IE11
};

// ✅ APLICAR CORS GLOBALMENTE
app.use(cors(corsOptions));

// ✅ MANEJAR PREFLIGHT REQUESTS EXPLÍCITAMENTE
app.options('*', cors(corsOptions));

// ✅ MIDDLEWARE ADICIONAL PARA DEBUG Y CORS MANUAL
app.use((req, res, next) => {
  const origin = req.headers.origin;
  console.log(`🌐 Request from origin: ${origin}`.cyan);
  
  // Lista de orígenes permitidos para fallback manual
  const allowedOrigins = [
    'https://utppedidos.vercel.app',
    'http://localhost:3000',
    'http://localhost:5173'
  ];
  
  // Si el origen está permitido o contiene vercel.app, permitir
  if (allowedOrigins.includes(origin) || (origin && origin.includes('vercel.app'))) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
  }
  
  // Headers adicionales para CORS
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS,PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  
  // Responder a preflight OPTIONS
  if (req.method === 'OPTIONS') {
    console.log(`✅ Preflight OPTIONS request handled for: ${req.path}`.green);
    res.status(200).end();
    return;
  }
  
  next();
});

app.use(morgan(process.env.LOG_LEVEL === 'info' ? 'combined' : 'dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware para logging de requests en Railway
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`.cyan);
  next();
});

// ✅ HEALTH CHECK CON CORS INFO
app.get('/health', async (req, res) => {
  try {
    const isDbHealthy = await healthCheck();
    const stats = await getDatabaseStats();
    
    const healthData = {
      status: isDbHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      service: 'UTPedidos Backend',
      environment: process.env.NODE_ENV,
      platform: 'Railway',
      cors: {
        configured: true,
        allowedOrigins: corsOptions.origin.length,
        frontendUrl: process.env.FRONTEND_URL_PROD || 'https://utppedidos.vercel.app'
      },
      database: {
        connected: isDbHealthy,
        stats: stats
      },
      server: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        port: PORT,
        host: HOST
      }
    };
    
    res.status(isDbHealthy ? 200 : 503).json(healthData);
  } catch (error) {
    console.error('❌ Health check error:', error.message);
    res.status(503).json({
      status: 'error',
      message: 'Health check failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// ✅ ENDPOINT PING SIMPLE PARA CORS TEST
app.get('/ping', (req, res) => {
  res.json({
    message: 'pong',
    timestamp: new Date().toISOString(),
    origin: req.headers.origin,
    corsWorking: true
  });
});

// Endpoint para estadísticas detalladas
app.get('/api/stats', async (req, res) => {
  try {
    const stats = await getDatabaseStats();
    res.json(stats);
  } catch (error) {
    console.error('❌ Stats error:', error.message);
    res.status(500).json({ error: 'Error obteniendo estadísticas' });
  }
});

// Importar y configurar rutas
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const cafeteriaRoutes = require('./routes/cafeterias');
const menuRoutes = require('./routes/menu');
const pedidoRoutes = require('./routes/pedidos');
const carritoRoutes = require('./routes/carrito');
const productRoutes = require('./routes/products');
const cartRoutes = require('./routes/cart');
const adminRoutes = require('./routes/admin');

// Configurar rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/cafeterias', cafeteriaRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/products', productRoutes);
app.use('/api/pedidos', pedidoRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/carrito', carritoRoutes); // Legacy compatibility
app.use('/api/admin', adminRoutes);

// Ruta raíz informativa
app.get('/', (req, res) => {
  res.json({
    message: 'UTPedidos Backend API - Railway Deployment',
    version: '1.0.0',
    environment: process.env.NODE_ENV,
    platform: 'Railway',
    timestamp: new Date().toISOString(),
    cors: {
      status: 'configured',
      frontendUrl: 'https://utppedidos.vercel.app'
    },
    endpoints: [
      'GET /health - Health check',
      'GET /ping - CORS test',
      'GET /api/stats - Database statistics',
      'POST /api/auth/* - Authentication',
      'GET /api/users/* - User management',
      'GET /api/cafeterias/* - Cafeteria management',
      'GET /api/pedidos/* - Order management',
      'GET /api/carritos/* - Cart management'
    ]
  });
});

// Middleware de manejo de errores
app.use((err, req, res, next) => {
  console.error('❌ Unhandled error:'.red, err.stack);
  
  res.status(err.status || 500).json({
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
    timestamp: new Date().toISOString()
  });
});

// Manejo de rutas no encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint no encontrado',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// Función para iniciar el servidor
const startServer = async () => {
  try {
    console.log('🚀 Iniciando servidor UTPedidos en Railway...'.yellow);
    console.log('=' .repeat(50));
    
    // Conectar a Firebase/Firestore
    console.log('📡 Conectando a Firebase...'.cyan);
    await connectDB();
    
    // Mostrar información de CORS
    console.log('🌐 CORS configurado para:'.cyan);
    corsOptions.origin.forEach(origin => {
      if (origin) console.log(`   - ${origin}`.green);
    });
    
    // Iniciar servidor
    const server = app.listen(PORT, HOST, () => {
      console.log('=' .repeat(50));
      console.log('✅ Servidor Railway iniciado exitosamente!'.green);
      console.log(`🌐 URL: http://${HOST}:${PORT}`.cyan);
      console.log(`🌐 Public URL: https://uppedidos-production.up.railway.app`.cyan);
      console.log(`📍 Entorno: ${process.env.NODE_ENV}`.cyan);
      console.log(`🗄️ Base de datos: Firebase/Firestore`.cyan);
      console.log(`🔐 JWT configurado: ${process.env.JWT_SECRET ? '✅' : '❌'}`.cyan);
      console.log(`🌐 CORS configurado para Vercel: ✅`.green);
      console.log('=' .repeat(50));
    });
    
    // Manejo graceful de shutdown
    process.on('SIGTERM', () => {
      console.log('🛑 Recibida señal SIGTERM, cerrando servidor...'.yellow);
      server.close(() => {
        console.log('✅ Servidor cerrado exitosamente'.green);
        process.exit(0);
      });
    });
    
    process.on('SIGINT', () => {
      console.log('🛑 Recibida señal SIGINT, cerrando servidor...'.yellow);
      server.close(() => {
        console.log('✅ Servidor cerrado exitosamente'.green);
        process.exit(0);
      });
    });
    
  } catch (error) {
    console.error('❌ Error crítico iniciando servidor:'.red, error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
};

// Iniciar el servidor solo si este archivo es ejecutado directamente
if (require.main === module) {
  startServer();
}

module.exports = app;