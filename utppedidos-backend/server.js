// server.js - Servidor principal del backend UTPedidos
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');

// Cargar variables de entorno
dotenv.config();

// Importar configuración de base de datos
const { connectDB } = require('./config/database');

// Importar rutas
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const cafeteriaRoutes = require('./routes/cafeterias');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const cartRoutes = require('./routes/cart');
const adminRoutes = require('./routes/admin');

// Importar middlewares
const { errorHandler } = require('./middleware/errorHandler');
const { authenticateToken } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 5000;

// Conectar a la base de datos
connectDB();

// Middlewares de seguridad
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"],
            fontSrc: ["'self'", "https://cdnjs.cloudflare.com"],
        },
    },
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutos
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    message: {
        error: 'Demasiadas solicitudes desde esta IP, intenta de nuevo más tarde.',
        resetTime: new Date(Date.now() + (parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000))
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        res.status(429).json({
            error: 'Rate limit excedido',
            message: 'Demasiadas solicitudes desde esta IP',
            resetTime: new Date(Date.now() + (parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000))
        });
    }
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: parseInt(process.env.AUTH_RATE_LIMIT_MAX) || 5,
    message: {
        error: 'Demasiados intentos de autenticación, intenta de nuevo en 15 minutos.'
    },
    skipSuccessfulRequests: true,
});

// Aplicar rate limiting
app.use('/api/auth', authLimiter);
app.use('/api/', limiter);

// Middlewares generales
app.use(compression());

// Logging
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
} else {
    app.use(morgan('combined'));
}

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Servir archivos estáticos
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Configuración CORS
const corsOptions = {
    origin: function (origin, callback) {
        const allowedOrigins = process.env.NODE_ENV === 'production' 
            ? (process.env.FRONTEND_URL_PROD || '').split(',').map(url => url.trim())
            : (process.env.FRONTEND_URL_DEV || 'http://localhost:3000,http://localhost:5173').split(',').map(url => url.trim());
        
        // Permitir requests sin origin (mobile apps, postman, etc.)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('No permitido por CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['X-Total-Count', 'X-Page-Count']
};

app.use(cors(corsOptions));

// Middleware para parsear JSON con manejo de errores
app.use((error, req, res, next) => {
    if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
        return res.status(400).json({ 
            error: 'JSON inválido',
            message: 'El cuerpo de la petición contiene JSON malformado'
        });
    }
    next();
});

// Ruta de salud del sistema
app.get('/health', async (req, res) => {
    try {
        const { getDB } = require('./config/database');
        const db = getDB();
        
        // Verificar conexión a la base de datos
        await db.execute('SELECT 1');
        
        res.status(200).json({
            status: 'OK',
            message: 'UTPedidos API está funcionando correctamente',
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV || 'development',
            version: require('./package.json').version,
            database: 'Connected',
            uptime: process.uptime()
        });
    } catch (error) {
        res.status(503).json({
            status: 'ERROR',
            message: 'Servicio no disponible',
            timestamp: new Date().toISOString(),
            error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno'
        });
    }
});

// Ruta básica
app.get('/', (req, res) => {
    res.json({
        message: '🍽️ Bienvenido a UTPedidos API',
        version: require('./package.json').version,
        documentation: '/api/docs',
        health: '/health',
        endpoints: {
            auth: '/api/auth',
            users: '/api/users',
            cafeterias: '/api/cafeterias',
            products: '/api/products',
            orders: '/api/orders',
            cart: '/api/cart'
        }
    });
});

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/users', authenticateToken, userRoutes);
app.use('/api/cafeterias', cafeteriaRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', authenticateToken, orderRoutes);
app.use('/api/cart', authenticateToken, cartRoutes);
app.use('/api/admin', authenticateToken, adminRoutes);

// Ruta para estadísticas públicas
app.get('/api/stats/public', async (req, res) => {
    try {
        const { getDB } = require('./config/database');
        const db = getDB();
        
        const [cafeteriasCount] = await db.execute(
            'SELECT COUNT(*) as count FROM Cafeterias WHERE activa = TRUE'
        );
        const [productsCount] = await db.execute(
            'SELECT COUNT(*) as count FROM Productos WHERE activo = TRUE'
        );
        const [ordersToday] = await db.execute(
            'SELECT COUNT(*) as count FROM Pedidos WHERE DATE(fecha_pedido) = CURDATE()'
        );
        const [ordersTotal] = await db.execute(
            'SELECT COUNT(*) as count FROM Pedidos'
        );
        
        res.json({
            cafeterias_activas: cafeteriasCount[0].count,
            productos_disponibles: productsCount[0].count,
            pedidos_hoy: ordersToday[0].count,
            pedidos_total: ordersTotal[0].count,
            sistema_activo: true,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error obteniendo estadísticas públicas:', error);
        res.status(500).json({ 
            error: 'Error interno del servidor',
            message: 'No se pudieron obtener las estadísticas'
        });
    }
});

// Documentación básica de la API
app.get('/api/docs', (req, res) => {
    res.json({
        title: 'UTPedidos API Documentation',
        version: require('./package.json').version,
        description: 'API para el sistema de pedidos de cafeterías de la UTP',
        baseUrl: `${req.protocol}://${req.get('host')}/api`,
        endpoints: {
            authentication: {
                'POST /auth/login': 'Iniciar sesión',
                'POST /auth/register': 'Registrar usuario',
                'POST /auth/refresh': 'Renovar token',
                'POST /auth/logout': 'Cerrar sesión'
            },
            users: {
                'GET /users/profile': 'Obtener perfil del usuario',
                'PUT /users/profile': 'Actualizar perfil del usuario',
                'GET /users/orders': 'Obtener pedidos del usuario',
                'GET /users/stats': 'Obtener estadísticas del usuario'
            },
            cafeterias: {
                'GET /cafeterias': 'Listar cafeterías',
                'GET /cafeterias/:id': 'Obtener cafetería específica',
                'GET /cafeterias/:id/menu': 'Obtener menú de cafetería'
            },
            products: {
                'GET /products': 'Listar productos',
                'GET /products/:id': 'Obtener producto específico',
                'GET /products/cafeteria/:id': 'Productos por cafetería',
                'GET /products/category/:category': 'Productos por categoría'
            },
            orders: {
                'GET /orders': 'Listar pedidos del usuario',
                'POST /orders': 'Crear nuevo pedido',
                'GET /orders/:id': 'Obtener pedido específico',
                'PUT /orders/:id/status': 'Actualizar estado del pedido'
            },
            cart: {
                'GET /cart': 'Obtener carrito del usuario',
                'POST /cart/add': 'Agregar producto al carrito',
                'PUT /cart/item/:id': 'Actualizar item del carrito',
                'DELETE /cart/item/:id': 'Eliminar item del carrito',
                'DELETE /cart/clear': 'Vaciar carrito'
            }
        },
        examples: {
            login: {
                method: 'POST',
                url: '/api/auth/login',
                body: {
                    correo: 'estudiante@utp.ac.pa',
                    contrasena: 'MiPassword123'
                }
            },
            createOrder: {
                method: 'POST',
                url: '/api/orders',
                headers: {
                    'Authorization': 'Bearer <token>'
                },
                body: {
                    id_cafeteria: 1,
                    items: [
                        {
                            id_producto: 1,
                            cantidad: 2
                        }
                    ],
                    metodo_pago: 'efectivo',
                    observaciones: 'Sin cebolla'
                }
            }
        }
    });
});

// Manejo de rutas no encontradas
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Ruta no encontrada',
        message: `La ruta ${req.method} ${req.originalUrl} no existe en esta API`,
        suggestion: 'Revisa la documentación en /api/docs',
        availableRoutes: [
            'GET /',
            'GET /health',
            'GET /api/docs',
            'POST /api/auth/login',
            'POST /api/auth/register',
            'GET /api/cafeterias',
            'GET /api/products',
            'GET /api/stats/public'
        ]
    });
});

// Middleware de manejo de errores (debe ir al final)
app.use(errorHandler);

// Manejo de errores no capturados
process.on('uncaughtException', (error) => {
    console.error('❌ Error no capturado:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Promesa rechazada no manejada:', reason);
    console.error('En la promesa:', promise);
    process.exit(1);
});

// Graceful shutdown
const gracefulShutdown = (signal) => {
    console.log(`\n${signal} recibido, iniciando cierre graceful...`);
    
    server.close(() => {
        console.log('✅ Servidor HTTP cerrado');
        
        // Cerrar conexiones de base de datos
        const { getDB } = require('./config/database');
        try {
            const db = getDB();
            db.end(() => {
                console.log('✅ Conexiones de base de datos cerradas');
                process.exit(0);
            });
        } catch (error) {
            console.log('⚠️ No hay conexiones de BD que cerrar');
            process.exit(0);
        }
    });
    
    // Force close after 10 seconds
    setTimeout(() => {
        console.error('❌ Forzando cierre después de 10 segundos');
        process.exit(1);
    }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Iniciar servidor
const server = app.listen(PORT, () => {
    console.log(`
🚀 ===================================
   UTPedidos Backend Server Started
🚀 ===================================
📍 Puerto: ${PORT}
🌍 Entorno: ${process.env.NODE_ENV || 'development'}
🕐 Timestamp: ${new Date().toLocaleString('es-ES')}
📋 API Base: http://localhost:${PORT}/api
💚 Health Check: http://localhost:${PORT}/health
📖 Documentación: http://localhost:${PORT}/api/docs
🔧 Base de datos: MySQL - ${process.env.DB_NAME || 'UTPPEDIDOS'}
====================================
    `);
});

// Configurar timeout del servidor
server.timeout = 30000; // 30 segundos

module.exports = app;