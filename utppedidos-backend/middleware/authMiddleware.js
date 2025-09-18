// ===== middleware/authMiddkeware.js - Middleware de autenticación Firebase MEJORADO =====
const { verifyAccessToken, verifyRefreshToken, generateTokens } = require('../config/jwt');
const { getDB } = require('../config/database');

// Cache de usuarios para optimización (en producción usar Redis)
const userCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

// Limpiar cache automáticamente
setInterval(() => {
    const now = Date.now();
    for (const [key, data] of userCache.entries()) {
        if (now - data.timestamp > CACHE_TTL) {
            userCache.delete(key);
        }
    }
}, 60 * 1000); // Limpiar cada minuto

// Obtener usuario desde cache o base de datos
const getUserFromCacheOrDB = async (userId) => {
    // Verificar cache primero
    const cached = userCache.get(userId);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.user;
    }
    
    // Obtener de la base de datos
    const db = getDB();
    const userDoc = await db.collection('usuarios').doc(userId).get();
    
    if (!userDoc.exists) {
        return null;
    }
    
    const userData = userDoc.data();
    
    // Guardar en cache
    userCache.set(userId, {
        user: userData,
        timestamp: Date.now()
    });
    
    return userData;
};

// Limpiar cache de usuario específico
const clearUserCache = (userId) => {
    userCache.delete(userId);
};

// Middleware principal de autenticación mejorado
const auth = async (req, res, next) => {
    try {
        // Obtener token del header Authorization, x-auth-token o cookie
        const authHeader = req.header('Authorization');
        let token = authHeader && authHeader.startsWith('Bearer ') 
            ? authHeader.substring(7) 
            : req.header('x-auth-token');
        
        // También verificar en cookies como fallback
        if (!token && req.cookies && req.cookies.accessToken) {
            token = req.cookies.accessToken;
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                error: 'Token requerido',
                message: 'No se proporcionó token de acceso',
                code: 'NO_TOKEN'
            });
        }

        try {
            // Verificar el token JWT
            const decoded = verifyAccessToken(token);
            
            // Obtener información del usuario (con cache)
            const userData = await getUserFromCacheOrDB(decoded.id);

            if (!userData) {
                return res.status(401).json({
                    success: false,
                    error: 'Token inválido',
                    message: 'Usuario no encontrado',
                    code: 'USER_NOT_FOUND'
                });
            }

            // Verificar que el usuario esté activo
            if (!userData.activo) {
                // Limpiar cache si el usuario está inactivo
                clearUserCache(decoded.id);
                return res.status(401).json({
                    success: false,
                    error: 'Usuario inactivo',
                    message: 'La cuenta ha sido desactivada',
                    code: 'USER_INACTIVE'
                });
            }

            // Verificar si el token fue emitido antes de un cambio de contraseña
            if (userData.password_changed_at && decoded.iat) {
                const passwordChangedTimestamp = Math.floor(userData.password_changed_at.toDate().getTime() / 1000);
                if (decoded.iat < passwordChangedTimestamp) {
                    clearUserCache(decoded.id);
                    return res.status(401).json({
                        success: false,
                        error: 'Token inválido',
                        message: 'Token emitido antes del cambio de contraseña',
                        code: 'TOKEN_EXPIRED_PASSWORD_CHANGE'
                    });
                }
            }

            // Añadir información del usuario al request
            req.user = {
                id: decoded.id,
                nombre: userData.nombre,
                apellido: userData.apellido,
                email: userData.correo,
                facultad: userData.facultad,
                edificio_habitual: userData.edificio_habitual,
                activo: userData.activo,
                rol: userData.rol || 'usuario',
                configuracion: userData.configuracion || {},
                fecha_registro: userData.fecha_registro
            };

            // Actualizar última actividad cada 10 minutos para evitar demasiadas escrituras
            const shouldUpdateActivity = !userData.ultima_actividad || 
                Date.now() - userData.ultima_actividad.toDate().getTime() > 10 * 60 * 1000;
            
            if (shouldUpdateActivity) {
                // Actualizar en background sin esperar
                setImmediate(async () => {
                    try {
                        const db = getDB();
                        await db.collection('usuarios').doc(decoded.id).update({
                            ultima_actividad: new Date()
                        });
                        // Actualizar cache
                        const cached = userCache.get(decoded.id);
                        if (cached) {
                            cached.user.ultima_actividad = new Date();
                        }
                    } catch (updateError) {
                        console.error('Error actualizando última actividad:', updateError);
                    }
                });
            }

            next();

        } catch (tokenError) {
            // Limpiar cache en caso de error de token
            if (tokenError.name !== 'TokenExpiredError') {
                const decoded = verifyAccessToken(token, { ignoreExpiration: true });
                if (decoded && decoded.id) {
                    clearUserCache(decoded.id);
                }
            }

            // Manejar diferentes tipos de errores de token
            if (tokenError.name === 'TokenExpiredError') {
                return res.status(401).json({
                    success: false,
                    error: 'Token expirado',
                    message: 'El token de acceso ha expirado',
                    code: 'TOKEN_EXPIRED',
                    canRefresh: true
                });
            } else if (tokenError.name === 'JsonWebTokenError') {
                return res.status(401).json({
                    success: false,
                    error: 'Token inválido',
                    message: 'Token malformado o inválido',
                    code: 'TOKEN_INVALID'
                });
            } else if (tokenError.name === 'NotBeforeError') {
                return res.status(401).json({
                    success: false,
                    error: 'Token no válido aún',
                    message: 'El token no es válido todavía',
                    code: 'TOKEN_NOT_BEFORE'
                });
            } else {
                return res.status(401).json({
                    success: false,
                    error: 'Error de token',
                    message: 'Error procesando el token',
                    code: 'TOKEN_ERROR'
                });
            }
        }
    } catch (error) {
        console.error('Error en middleware de autenticación:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor',
            message: 'Error en la autenticación',
            code: 'INTERNAL_ERROR'
        });
    }
};

// Middleware para verificar rol de administrador mejorado
const adminAuth = async (req, res, next) => {
    try {
        // El middleware auth debe ejecutarse antes
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'Autenticación requerida',
                message: 'Debe autenticarse primero',
                code: 'AUTH_REQUIRED'
            });
        }

        // Verificar rol desde el objeto de usuario ya cargado
        if (req.user.rol !== 'admin') {
            return res.status(403).json({
                success: false,
                error: 'Acceso denegado',
                message: 'Se requieren permisos de administrador',
                code: 'INSUFFICIENT_PERMISSIONS'
            });
        }

        // Verificación adicional desde la base de datos para operaciones críticas
        const userData = await getUserFromCacheOrDB(req.user.id);
        
        if (!userData || userData.rol !== 'admin') {
            clearUserCache(req.user.id);
            return res.status(403).json({
                success: false,
                error: 'Acceso denegado',
                message: 'Permisos de administrador no válidos',
                code: 'INVALID_ADMIN_PERMISSIONS'
            });
        }

        next();

    } catch (error) {
        console.error('Error en middleware de admin:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor',
            message: 'Error verificando permisos',
            code: 'INTERNAL_ERROR'
        });
    }
};

// Middleware para verificar rol de cafetería
const cafeteriaAuth = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'Autenticación requerida',
                message: 'Debe autenticarse primero',
                code: 'AUTH_REQUIRED'
            });
        }

        // Verificar que sea admin o tenga rol de cafetería
        const allowedRoles = ['admin', 'cafeteria', 'moderador'];
        
        if (!allowedRoles.includes(req.user.rol)) {
            return res.status(403).json({
                success: false,
                error: 'Acceso denegado',
                message: 'Se requieren permisos de cafetería o administrador',
                code: 'INSUFFICIENT_PERMISSIONS'
            });
        }

        // Si es rol cafetería, verificar que tenga acceso a la cafetería específica
        if (req.user.rol === 'cafeteria' && req.params.cafeteriaId) {
            const userData = await getUserFromCacheOrDB(req.user.id);
            
            if (userData.cafeteria_asignada && userData.cafeteria_asignada !== req.params.cafeteriaId) {
                return res.status(403).json({
                    success: false,
                    error: 'Acceso denegado',
                    message: 'No tienes permisos para esta cafetería',
                    code: 'CAFETERIA_ACCESS_DENIED'
                });
            }
        }

        next();

    } catch (error) {
        console.error('Error en middleware de cafetería:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor',
            message: 'Error verificando permisos de cafetería',
            code: 'INTERNAL_ERROR'
        });
    }
};

// Middleware opcional - no requiere autenticación pero la usa si está presente
const optionalAuth = async (req, res, next) => {
    const authHeader = req.header('Authorization');
    let token = authHeader && authHeader.startsWith('Bearer ') 
        ? authHeader.substring(7) 
        : req.header('x-auth-token');
    
    // También verificar en cookies
    if (!token && req.cookies && req.cookies.accessToken) {
        token = req.cookies.accessToken;
    }

    if (!token) {
        return next(); // Continuar sin usuario autenticado
    }

    try {
        const decoded = verifyAccessToken(token);
        const userData = await getUserFromCacheOrDB(decoded.id);

        if (userData && userData.activo) {
            req.user = {
                id: decoded.id,
                nombre: userData.nombre,
                apellido: userData.apellido,
                email: userData.correo,
                rol: userData.rol || 'usuario',
                configuracion: userData.configuracion || {}
            };
        }
    } catch (error) {
        // Ignorar errores de token en middleware opcional
        console.log('Token opcional inválido, continuando sin autenticación');
    }

    next();
};

// Middleware para rate limiting por usuario
const userRateLimit = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
    const requestCounts = new Map();
    
    // Limpiar contadores automáticamente
    setInterval(() => {
        const now = Date.now();
        for (const [key, data] of requestCounts.entries()) {
            if (now - data.resetTime > windowMs) {
                requestCounts.delete(key);
            }
        }
    }, windowMs);
    
    return (req, res, next) => {
        if (!req.user) {
            return next(); // Sin autenticación, no aplicar rate limit por usuario
        }
        
        const userId = req.user.id;
        const now = Date.now();
        const userRequests = requestCounts.get(userId) || { count: 0, resetTime: now };
        
        // Reset si ha pasado la ventana de tiempo
        if (now - userRequests.resetTime > windowMs) {
            userRequests.count = 0;
            userRequests.resetTime = now;
        }
        
        userRequests.count++;
        requestCounts.set(userId, userRequests);
        
        if (userRequests.count > maxRequests) {
            return res.status(429).json({
                success: false,
                error: 'Demasiadas solicitudes',
                message: `Máximo ${maxRequests} solicitudes por ${windowMs / 1000 / 60} minutos`,
                code: 'RATE_LIMIT_EXCEEDED',
                retryAfter: Math.ceil((windowMs - (now - userRequests.resetTime)) / 1000)
            });
        }
        
        // Agregar headers informativos
        res.set({
            'X-RateLimit-Limit': maxRequests,
            'X-RateLimit-Remaining': maxRequests - userRequests.count,
            'X-RateLimit-Reset': new Date(userRequests.resetTime + windowMs).toISOString()
        });
        
        next();
    };
};

// Middleware para logging de actividad de usuarios
const activityLogger = (action) => {
    return (req, res, next) => {
        const originalSend = res.send;
        
        res.send = function(data) {
            // Log solo respuestas exitosas
            if (res.statusCode < 400 && req.user) {
                setImmediate(async () => {
                    try {
                        // En una implementación real, guardarías esto en una colección de logs
                        console.log(`[ACTIVITY] Usuario: ${req.user.id}, Acción: ${action}, IP: ${req.ip}, Timestamp: ${new Date().toISOString()}`);
                    } catch (error) {
                        console.error('Error logging activity:', error);
                    }
                });
            }
            
            originalSend.call(this, data);
        };
        
        next();
    };
};

// Middleware para verificar si el usuario puede realizar acciones sensibles
const sensitiveActionAuth = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'Autenticación requerida',
                code: 'AUTH_REQUIRED'
            });
        }
        
        // Verificar que el token no sea muy antiguo para acciones sensibles (24 horas)
        const userData = await getUserFromCacheOrDB(req.user.id);
        
        if (userData.ultimo_login) {
            const lastLogin = userData.ultimo_login.toDate();
            const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
            
            if (lastLogin < twentyFourHoursAgo) {
                return res.status(401).json({
                    success: false,
                    error: 'Re-autenticación requerida',
                    message: 'Debes iniciar sesión nuevamente para realizar esta acción',
                    code: 'REAUTHENTICATION_REQUIRED'
                });
            }
        }
        
        next();
        
    } catch (error) {
        console.error('Error en sensitive action auth:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor',
            code: 'INTERNAL_ERROR'
        });
    }
};

module.exports = {
    auth,
    adminAuth,
    cafeteriaAuth,
    optionalAuth,
    userRateLimit,
    activityLogger,
    sensitiveActionAuth,
    clearUserCache,
    generateTokens,
    verifyAccessToken,
    verifyRefreshToken
};