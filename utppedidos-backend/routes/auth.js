// middleware/auth.js - Middleware de autenticación
const jwt = require('jsonwebtoken');
const { executeQuery } = require('../config/database');

// Middleware para verificar token JWT
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
        
        if (!token) {
            return res.status(401).json({
                error: 'Token de acceso requerido',
                message: 'Debes estar autenticado para acceder a este recurso'
            });
        }
        
        // Verificar el token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'utpedidos_secret_key_2024');
        
        // Verificar que el usuario existe y está activo
        const user = await executeQuery(
            'SELECT id_usuario, correo, nombre, apellido, activo FROM Usuarios WHERE id_usuario = ? AND activo = TRUE',
            [decoded.id]
        );
        
        if (user.length === 0) {
            return res.status(401).json({
                error: 'Usuario no válido',
                message: 'El usuario asociado al token no existe o está inactivo'
            });
        }
        
        // Agregar información del usuario a la request
        req.user = {
            id: user[0].id_usuario,
            email: user[0].correo,
            nombre: user[0].nombre,
            apellido: user[0].apellido
        };
        
        next();
        
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                error: 'Token inválido',
                message: 'El token proporcionado no es válido'
            });
        }
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                error: 'Token expirado',
                message: 'El token ha expirado, por favor inicia sesión nuevamente'
            });
        }
        
        console.error('Error en middleware de autenticación:', error);
        return res.status(500).json({
            error: 'Error interno del servidor',
            message: 'Error verificando la autenticación'
        });
    }
};

// Middleware para verificar roles (opcional, para admin)
const requireRole = (roles) => {
    return async (req, res, next) => {
        try {
            const userId = req.user.id;
            
            // Verificar rol del usuario
            const userRole = await executeQuery(
                'SELECT rol FROM Usuarios WHERE id_usuario = ?',
                [userId]
            );
            
            if (userRole.length === 0) {
                return res.status(403).json({
                    error: 'Acceso denegado',
                    message: 'No tienes permisos para acceder a este recurso'
                });
            }
            
            const role = userRole[0].rol;
            
            // Verificar si el rol del usuario está en la lista de roles permitidos
            if (!roles.includes(role)) {
                return res.status(403).json({
                    error: 'Permisos insuficientes',
                    message: `Se requiere uno de los siguientes roles: ${roles.join(', ')}`
                });
            }
            
            req.user.role = role;
            next();
            
        } catch (error) {
            console.error('Error verificando rol:', error);
            return res.status(500).json({
                error: 'Error interno del servidor',
                message: 'Error verificando los permisos'
            });
        }
    };
};

// Middleware para verificar si el usuario es admin
const requireAdmin = requireRole(['admin']);

// Middleware opcional (no requiere autenticación pero añade info si está presente)
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        
        if (!token) {
            // No hay token, continuar sin usuario
            req.user = null;
            return next();
        }
        
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'utpedidos_secret_key_2024');
            
            const user = await executeQuery(
                'SELECT id_usuario, correo, nombre, apellido FROM Usuarios WHERE id_usuario = ? AND activo = TRUE',
                [decoded.id]
            );
            
            if (user.length > 0) {
                req.user = {
                    id: user[0].id_usuario,
                    email: user[0].correo,
                    nombre: user[0].nombre,
                    apellido: user[0].apellido
                };
            } else {
                req.user = null;
            }
        } catch (tokenError) {
            // Token inválido o expirado, continuar sin usuario
            req.user = null;
        }
        
        next();
        
    } catch (error) {
        console.error('Error en middleware de autenticación opcional:', error);
        req.user = null;
        next();
    }
};

// Middleware para verificar que el usuario puede acceder a un recurso específico
const requireOwnership = (getOwnerIdFromParams) => {
    return async (req, res, next) => {
        try {
            const userId = req.user.id;
            const resourceOwnerId = await getOwnerIdFromParams(req);
            
            if (userId !== resourceOwnerId) {
                return res.status(403).json({
                    error: 'Acceso denegado',
                    message: 'Solo puedes acceder a tus propios recursos'
                });
            }
            
            next();
            
        } catch (error) {
            console.error('Error verificando ownership:', error);
            return res.status(500).json({
                error: 'Error interno del servidor',
                message: 'Error verificando los permisos de acceso'
            });
        }
    };
};

// Función helper para generar tokens
const generateTokens = (userId) => {
    const payload = { id: userId };
    
    const accessToken = jwt.sign(
        payload,
        process.env.JWT_SECRET || 'utpedidos_secret_key_2024',
        { expiresIn: process.env.JWT_EXPIRE || '24h' }
    );
    
    const refreshToken = jwt.sign(
        payload,
        process.env.JWT_REFRESH_SECRET || 'utpedidos_refresh_secret_2024',
        { expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d' }
    );
    
    return { accessToken, refreshToken };
};

// Función para verificar refresh token
const verifyRefreshToken = (token) => {
    try {
        return jwt.verify(token, process.env.JWT_REFRESH_SECRET || 'utpedidos_refresh_secret_2024');
    } catch (error) {
        throw error;
    }
};

// Middleware para rate limiting específico por usuario
const userRateLimit = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
    const userRequests = new Map();
    
    return (req, res, next) => {
        const userId = req.user ? req.user.id : req.ip;
        const now = Date.now();
        const windowStart = now - windowMs;
        
        if (!userRequests.has(userId)) {
            userRequests.set(userId, []);
        }
        
        const requests = userRequests.get(userId);
        
        // Limpiar requests antiguos
        const validRequests = requests.filter(timestamp => timestamp > windowStart);
        userRequests.set(userId, validRequests);
        
        if (validRequests.length >= maxRequests) {
            return res.status(429).json({
                error: 'Rate limit excedido',
                message: `Máximo ${maxRequests} requests por ${windowMs / 1000 / 60} minutos`
            });
        }
        
        // Agregar request actual
        validRequests.push(now);
        userRequests.set(userId, validRequests);
        
        next();
    };
};

module.exports = {
    authenticateToken,
    requireRole,
    requireAdmin,
    optionalAuth,
    requireOwnership,
    generateTokens,
    verifyRefreshToken,
    userRateLimit
};