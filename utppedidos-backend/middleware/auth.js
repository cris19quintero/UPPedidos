// ===== middleware/auth.js - Middleware de autenticación Firebase =====
const { verifyAccessToken, verifyRefreshToken, generateTokens } = require('../config/jwt');
const { getDB } = require('../config/database');

// Middleware principal de autenticación
const auth = async (req, res, next) => {
    try {
        // Obtener token del header Authorization o x-auth-token
        const authHeader = req.header('Authorization');
        const token = authHeader && authHeader.startsWith('Bearer ') 
            ? authHeader.substring(7) 
            : req.header('x-auth-token');

        if (!token) {
            return res.status(401).json({
                success: false,
                error: 'Token requerido',
                message: 'No se proporcionó token de acceso'
            });
        }

        try {
            // Verificar el token JWT
            const decoded = verifyAccessToken(token);
            
            // Obtener información del usuario desde Firebase
            const db = getDB();
            const userDoc = await db.collection('usuarios').doc(decoded.id).get();

            if (!userDoc.exists) {
                return res.status(401).json({
                    success: false,
                    error: 'Token inválido',
                    message: 'Usuario no encontrado'
                });
            }

            const userData = userDoc.data();

            // Verificar que el usuario esté activo
            if (!userData.activo) {
                return res.status(401).json({
                    success: false,
                    error: 'Usuario inactivo',
                    message: 'La cuenta ha sido desactivada'
                });
            }

            // Añadir información del usuario al request
            req.user = {
                id: decoded.id,
                nombre: userData.nombre,
                apellido: userData.apellido,
                email: userData.correo,
                facultad: userData.facultad,
                activo: userData.activo,
                rol: userData.rol || 'usuario'
            };

            next();

        } catch (tokenError) {
            // Manejar diferentes tipos de errores de token
            if (tokenError.name === 'TokenExpiredError') {
                return res.status(401).json({
                    success: false,
                    error: 'Token expirado',
                    message: 'El token de acceso ha expirado'
                });
            } else if (tokenError.name === 'JsonWebTokenError') {
                return res.status(401).json({
                    success: false,
                    error: 'Token inválido',
                    message: 'Token malformado o inválido'
                });
            } else if (tokenError.name === 'NotBeforeError') {
                return res.status(401).json({
                    success: false,
                    error: 'Token no válido aún',
                    message: 'El token no es válido todavía'
                });
            } else {
                return res.status(401).json({
                    success: false,
                    error: 'Error de token',
                    message: 'Error procesando el token'
                });
            }
        }
    } catch (error) {
        console.error('Error en middleware de autenticación:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor',
            message: 'Error en la autenticación'
        });
    }
};

// Middleware para verificar rol de administrador
const adminAuth = async (req, res, next) => {
    try {
        // El middleware auth debe ejecutarse antes
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'Autenticación requerida',
                message: 'Debe autenticarse primero'
            });
        }

        const db = getDB();
        const userDoc = await db.collection('usuarios').doc(req.user.id).get();

        if (!userDoc.exists) {
            return res.status(401).json({
                success: false,
                error: 'Usuario no encontrado',
                message: 'El usuario no existe'
            });
        }

        const userData = userDoc.data();

        if (userData.rol !== 'admin') {
            return res.status(403).json({
                success: false,
                error: 'Acceso denegado',
                message: 'Se requieren permisos de administrador'
            });
        }

        req.user.rol = userData.rol;
        next();

    } catch (error) {
        console.error('Error en middleware de admin:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor',
            message: 'Error verificando permisos'
        });
    }
};

// Middleware opcional - no requiere autenticación pero la usa si está presente
const optionalAuth = async (req, res, next) => {
    const authHeader = req.header('Authorization');
    const token = authHeader && authHeader.startsWith('Bearer ') 
        ? authHeader.substring(7) 
        : req.header('x-auth-token');

    if (!token) {
        return next(); // Continuar sin usuario autenticado
    }

    try {
        const decoded = verifyAccessToken(token);
        const db = getDB();
        const userDoc = await db.collection('usuarios').doc(decoded.id).get();

        if (userDoc.exists && userDoc.data().activo) {
            req.user = {
                id: decoded.id,
                nombre: userDoc.data().nombre,
                email: userDoc.data().correo,
                rol: userDoc.data().rol || 'usuario'
            };
        }
    } catch (error) {
        // Ignorar errores de token en middleware opcional
        console.log('Token opcional inválido, continuando sin autenticación');
    }

    next();
};

module.exports = {
    auth,
    adminAuth,
    optionalAuth,
    generateTokens,
    verifyAccessToken,
    verifyRefreshToken
};