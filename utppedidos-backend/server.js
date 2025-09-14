// server.js - Servidor principal completo y actualizado
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const colors = require('colors');
const path = require('path');
require('dotenv').config();

// Importar conexión a la base de datos
const { connectDB, healthCheck } = require('./config/database');

// Importar middleware
const errorHandler = require('./middleware/errorHandler');
const { generalLimiter } = require('./middleware/rateLimiter');

// Importar rutas
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const cafeteriaRoutes = require('./routes/cafeterias');
const menuRoutes = require('./routes/menu');
const pedidoRoutes = require('./routes/pedidos');
const carritoRoutes = require('./routes/carrito');
const productRoutes = require('./routes/products');
const cartRoutes = require('./routes/cart');
const adminRoutes = require('./routes/admin');

// Crear aplicación Express
const app = express();

// ========== CONFIGURACIÓN INICIAL ==========

// Conectar a la base de datos
connectDB().catch(err => {
    console.error('❌ Error fatal de conexión a BD:', err);
    process.exit(1);
});

// ========== MIDDLEWARE DE SEGURIDAD ==========

// Helmet para headers de seguridad
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "https:", "blob:"],
            scriptSrc: ["'self'"],
            connectSrc: ["'self'", "https://api.utp.ac.pa"]
        }
    }
}));

// CORS configurado para desarrollo y producción
const corsOptions = {
    origin: function (origin, callback) {
        const allowedOrigins = process.env.NODE_ENV === 'production'
            ? (process.env.FRONTEND_URL_PROD || '').split(',').filter(Boolean)
            : (process.env.FRONTEND_URL_DEV || 'http://localhost:3000,http://localhost:5173').split(',');
        
        // Permitir requests sin origin (mobile apps, Postman, etc.)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('No permitido por CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token', 'X-Requested-With'],
    exposedHeaders: ['X-Total-Count', 'X-Page-Count']
};

app.use(cors(corsOptions));

// Manejar preflight requests
app.options('*', cors(corsOptions));

// ========== MIDDLEWARE DE PARSING Y COMPRESIÓN ==========

// Compresión de respuestas
if (process.env.COMPRESSION_ENABLED !== 'false') {
    app.use(compression({
        level: parseInt(process.env.COMPRESSION_LEVEL) || 6,
        threshold: 1024,
        filter: (req, res) => {
            if (req.headers['x-no-compression']) {
                return false;
            }
            return compression.filter(req, res);
        }
    }));
}

// Body parser con límites configurables
app.use(express.json({ 
    limit: process.env.JSON_LIMIT || '10mb',
    verify: (req, res, buf) => {
        req.rawBody = buf;
    }
}));

app.use(express.urlencoded({ 
    extended: true, 
    limit: process.env.URL_ENCODED_LIMIT || '10mb' 
}));

// ========== MIDDLEWARE DE LOGGING ==========

// Logging configurado por ambiente
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
} else if (process.env.NODE_ENV === 'production') {
    app.use(morgan('combined', {
        skip: (req, res) => res.statusCode < 400
    }));
}

// Log de requests importantes
app.use((req, res, next) => {
    if (req.method !== 'GET' || req.url.includes('/api/')) {
        console.log(`${new Date().toISOString()} - ${req.method} ${req.url} - IP: ${req.ip}`.gray);
    }
    next();
});

// ========== MIDDLEWARE DE RATE LIMITING ==========

// Rate limiting general para todas las rutas
app.use('/api/', generalLimiter);

// ========== ARCHIVOS ESTÁTICOS ==========

// Servir archivos subidos
const uploadsPath = process.env.UPLOAD_PATH || './public/uploads/';
app.use('/uploads', express.static(path.resolve(uploadsPath), {
    maxAge: '7d',
    etag: true
}));

// Servir archivos públicos
app.use('/public', express.static(path.join(__dirname, 'public'), {
    maxAge: '1d',
    etag: true
}));

// Servir imágenes de productos (si existen)
app.use('/images', express.static(path.join(__dirname, 'public/images'), {
    maxAge: '7d',
    etag: true
}));

// ========== RUTAS DE SALUD Y MONITOREO ==========

// Health check básico
app.get('/health', async (req, res) => {
    try {
        const dbHealth = await healthCheck();
        const memoryUsage = process.memoryUsage();
        const uptime = process.uptime();

        res.status(200).json({
            success: true,
            message: 'Servidor UTPedidos funcionando correctamente',
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV || 'development',
            version: '1.0.0',
            uptime: `${Math.floor(uptime / 60)}m ${Math.floor(uptime % 60)}s`,
            database: dbHealth ? 'conectada' : 'desconectada',
            memory: {
                used: Math.round(memoryUsage.heapUsed / 1024 / 1024) + ' MB',
                total: Math.round(memoryUsage.heapTotal / 1024 / 1024) + ' MB'
            }
        });
    } catch (error) {
        res.status(503).json({
            success: false,
            message: 'Servicio no disponible',
            error: error.message
        });
    }
});

// Health check detallado para monitoreo
app.get('/health/detailed', async (req, res) => {
    try {
        const dbHealth = await healthCheck();
        const stats = {
            server: {
                status: 'ok',
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                cpu: process.cpuUsage(),
                version: process.version,
                environment: process.env.NODE_ENV
            },
            database: {
                status: dbHealth ? 'connected' : 'disconnected',
                host: process.env.DB_HOST || 'localhost'
            },
            services: {
                email: process.env.EMAIL_USER ? 'configured' : 'not configured',
                uploads: process.env.UPLOAD_PATH ? 'configured' : 'default'
            }
        };

        res.json({
            success: true,
            timestamp: new Date().toISOString(),
            stats
        });
    } catch (error) {
        res.status(503).json({
            success: false,
            error: error.message
        });
    }
});

// ========== RUTAS DE LA API ==========

// Información general de la API
app.get('/api', (req, res) => {
    res.json({
        success: true,
        message: 'API UTPedidos v1.0.0',
        description: 'Sistema de pedidos para cafeterías de la Universidad Tecnológica de Panamá',
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        endpoints: {
            authentication: '/api/auth',
            users: '/api/users',
            cafeterias: '/api/cafeterias',
            menu: '/api/menu',
            products: '/api/products',
            orders: '/api/pedidos',
            cart: '/api/cart',
            legacy_cart: '/api/carrito',
            admin: '/api/admin'
        },
        documentation: '/api/docs',
        health: '/health'
    });
});

// Rutas principales de la API
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/cafeterias', cafeteriaRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/products', productRoutes);
app.use('/api/pedidos', pedidoRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/carrito', carritoRoutes); // Legacy compatibility
app.use('/api/admin', adminRoutes);

// Documentación de la API
app.get('/api/docs', (req, res) => {
    res.json({
        success: true,
        title: 'Documentación API UTPedidos',
        version: '1.0.0',
        baseUrl: `${req.protocol}://${req.get('host')}/api`,
        authentication: {
            type: 'Bearer Token',
            description: 'Incluir en header: Authorization: Bearer {token}'
        },
        endpoints: {
            // Autenticación
            'POST /auth/register': 'Registrar nuevo usuario',
            'POST /auth/login': 'Iniciar sesión',
            'GET /auth/me': 'Obtener perfil actual [Auth]',
            'POST /auth/logout': 'Cerrar sesión [Auth]',
            'POST /auth/refresh': 'Renovar token',

            // Usuarios
            'GET /users/profile': 'Ver perfil [Auth]',
            'PUT /users/profile': 'Actualizar perfil [Auth]',
            'GET /users/stats': 'Estadísticas del usuario [Auth]',
            'POST /users/change-password': 'Cambiar contraseña [Auth]',

            // Cafeterías
            'GET /cafeterias': 'Listar cafeterías',
            'GET /cafeterias/:id': 'Detalle de cafetería',
            'GET /cafeterias/:id/stats': 'Estadísticas de cafetería',

            // Productos/Menú
            'GET /menu/cafeteria/:id': 'Menú por cafetería',
            'GET /menu/search': 'Buscar en menú',
            'GET /products/cafeteria/:id': 'Productos por cafetería',
            'GET /products/search': 'Buscar productos',

            // Carrito
            'GET /cart': 'Ver carrito [Auth]',
            'POST /cart': 'Agregar al carrito [Auth]',
            'PUT /cart/:id': 'Actualizar item [Auth]',
            'DELETE /cart/:id': 'Remover item [Auth]',
            'DELETE /cart': 'Vaciar carrito [Auth]',

            // Pedidos
            'POST /pedidos': 'Crear pedido [Auth]',
            'GET /pedidos': 'Mis pedidos [Auth]',
            'GET /pedidos/:id': 'Detalle de pedido [Auth]',
            'DELETE /pedidos/:id': 'Cancelar pedido [Auth]',

            // Administración
            'GET /admin/dashboard': 'Dashboard admin [Admin]',
            'GET /admin/orders': 'Todos los pedidos [Admin]',
            'PUT /admin/orders/:id/status': 'Cambiar estado [Admin]',
            'GET /admin/reports/sales': 'Reporte de ventas [Admin]'
        },
        status_codes: {
            200: 'OK - Operación exitosa',
            201: 'Created - Recurso creado',
            400: 'Bad Request - Datos inválidos',
            401: 'Unauthorized - Token requerido o inválido',
            403: 'Forbidden - Sin permisos',
            404: 'Not Found - Recurso no encontrado',
            409: 'Conflict - Conflicto de datos',
            500: 'Internal Server Error - Error del servidor'
        },
        response_format: {
            success: 'boolean - Indica si la operación fue exitosa',
            message: 'string - Mensaje descriptivo',
            data: 'object - Datos de respuesta (opcional)',
            error: 'string - Mensaje de error (solo en errores)',
            timestamp: 'string - Marca de tiempo ISO'
        },
        examples: {
            success_response: {
                success: true,
                message: 'Operación exitosa',
                data: { id: 1, nombre: 'Ejemplo' },
                timestamp: new Date().toISOString()
            },
            error_response: {
                success: false,
                error: 'Descripción del error',
                timestamp: new Date().toISOString()
            }
        }
    });
});

// ========== MANEJO DE ERRORES ==========

// Ruta para manejar 404
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint no encontrado',
        message: `La ruta ${req.method} ${req.originalUrl} no existe`,
        suggestion: 'Consulta /api/docs para ver las rutas disponibles',
        timestamp: new Date().toISOString()
    });
});

// Middleware global de manejo de errores
app.use(errorHandler);

// ========== CONFIGURACIÓN DEL SERVIDOR ==========

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || 'localhost';

const server = app.listen(PORT, () => {
    // Banner de inicio
    console.log('\n' + '='.repeat(70).cyan.bold);
    console.log('🚀 SERVIDOR UTPEDIDOS INICIADO CORRECTAMENTE'.cyan.bold);
    console.log('='.repeat(70).cyan.bold);
    console.log('');
    
    // Información del servidor
    console.log('📋 INFORMACIÓN DEL SERVIDOR:'.yellow.bold);
    console.log(`   🌍 Entorno: ${(process.env.NODE_ENV || 'development').toUpperCase()}`.yellow);
    console.log(`   🖥️  Host: ${HOST}`.yellow);
    console.log(`   📡 Puerto: ${PORT}`.yellow);
    console.log(`   🔗 URL Local: http://${HOST}:${PORT}`.yellow);
    console.log(`   📚 API Docs: http://${HOST}:${PORT}/api/docs`.yellow);
    console.log(`   💚 Health: http://${HOST}:${PORT}/health`.yellow);
    console.log('');

    // Información de la base de datos
    console.log('🗄️ CONFIGURACIÓN DE BASE DE DATOS:'.green.bold);
    console.log(`   🏢 Host: ${process.env.DB_HOST || 'localhost'}`.green);
    console.log(`   📊 Base de datos: ${process.env.DB_NAME || 'UTPPEDIDOS'}`.green);
    console.log(`   👤 Usuario: ${process.env.DB_USER || 'root'}`.green);
    console.log('');

    // Rutas disponibles
    console.log('🛣️ RUTAS PRINCIPALES:'.blue.bold);
    console.log('   🔐 /api/auth      - Autenticación y registro'.blue);
    console.log('   👤 /api/users     - Gestión de usuarios'.blue);
    console.log('   🏢 /api/cafeterias - Información de cafeterías'.blue);
    console.log('   🍽️ /api/menu      - Menús y productos'.blue);
    console.log('   🛒 /api/cart      - Carrito de compras'.blue);
    console.log('   📝 /api/pedidos   - Gestión de pedidos'.blue);
    console.log('   👑 /api/admin     - Panel de administración'.blue);
    console.log('');

    // Configuraciones activas
    console.log('⚙️ CONFIGURACIONES:'.magenta.bold);
    console.log(`   🔒 Rate Limiting: ${process.env.RATE_LIMIT_MAX_REQUESTS || '100'} req/${(process.env.RATE_LIMIT_WINDOW_MS || 900000) / 60000}min`.magenta);
    console.log(`   📦 Compresión: ${process.env.COMPRESSION_ENABLED !== 'false' ? 'Activada' : 'Desactivada'}`.magenta);
    console.log(`   📧 Email: ${process.env.EMAIL_USER ? 'Configurado' : 'No configurado'}`.magenta);
    console.log(`   📁 Uploads: ${process.env.UPLOAD_PATH || './public/uploads/'}`.magenta);
    console.log('');

    console.log('✅ Servidor listo para recibir conexiones'.green.bold);
    console.log('='.repeat(70).cyan.bold + '\n');
});

// ========== MANEJO DE ERRORES DEL SERVIDOR ==========

server.on('error', (error) => {
    console.error('\n❌ ERROR DEL SERVIDOR:'.red.bold);
    
    if (error.code === 'EADDRINUSE') {
        console.error(`   El puerto ${PORT} ya está en uso`.red);
        console.error(`   Soluciones posibles:`.yellow);
        console.error(`   • Cambiar el puerto en el archivo .env`.yellow);
        console.error(`   • Terminar el proceso que usa el puerto ${PORT}`.yellow);
        console.error(`   • Usar: lsof -ti:${PORT} | xargs kill -9`.yellow);
    } else if (error.code === 'EACCES') {
        console.error(`   Sin permisos para usar el puerto ${PORT}`.red);
        console.error(`   Usa un puerto superior a 1024 o ejecuta con sudo`.yellow);
    } else {
        console.error(`   Código: ${error.code}`.red);
        console.error(`   Mensaje: ${error.message}`.red);
    }
    
    console.error('\n');
    process.exit(1);
});

// ========== MANEJO DE SEÑALES DEL SISTEMA ==========

const gracefulShutdown = (signal) => {
    console.log(`\n⚠️ Señal ${signal} recibida. Cerrando servidor...`.yellow.bold);
    
    server.close((err) => {
        if (err) {
            console.error('❌ Error cerrando servidor:', err);
            process.exit(1);
        }
        
        console.log('✅ Servidor HTTP cerrado correctamente'.green);
        
        // Cerrar conexiones de base de datos
        const { closeDB } = require('./config/database');
        closeDB().then(() => {
            console.log('✅ Conexiones de BD cerradas correctamente'.green);
            console.log('👋 Servidor terminado correctamente. ¡Hasta pronto!'.cyan.bold);
            process.exit(0);
        }).catch((err) => {
            console.error('❌ Error cerrando BD:', err);
            process.exit(1);
        });
    });

    // Forzar cierre después de 30 segundos
    setTimeout(() => {
        console.error('❌ Forzando cierre del servidor (timeout)'.red);
        process.exit(1);
    }, 30000);
};

// Manejo de señales del sistema
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Manejo de promesas no capturadas
process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Promesa rechazada no manejada en:', promise);
    console.error('❌ Razón:', reason);
    
    if (process.env.NODE_ENV === 'production') {
        gracefulShutdown('UNHANDLED_REJECTION');
    }
});

// Manejo de excepciones no capturadas
process.on('uncaughtException', (error) => {
    console.error('❌ Excepción no capturada:', error);
    
    if (process.env.NODE_ENV === 'production') {
        gracefulShutdown('UNCAUGHT_EXCEPTION');
    } else {
        console.error('⚠️ Continuando ejecución en modo desarrollo...');
    }
});

// ========== EXPORTAR APLICACIÓN ==========

module.exports = { app, server };