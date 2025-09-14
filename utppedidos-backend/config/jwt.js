// ===== config/jwt.js - Configuración JWT =====
const jwt = require('jsonwebtoken');

// Generar tokens de acceso y refresh
const generateTokens = (userId) => {
    const payload = { 
        id: userId,
        timestamp: Date.now()
    };
    
    const accessToken = jwt.sign(
        payload,
        process.env.JWT_SECRET || 'tu_jwt_secret_aqui',
        { expiresIn: process.env.JWT_EXPIRE || '24h' }
    );
    
    const refreshToken = jwt.sign(
        payload,
        process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'tu_refresh_secret_aqui',
        { expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d' }
    );
    
    return { accessToken, refreshToken };
};

// Verificar token de acceso
const verifyAccessToken = (token) => {
    try {
        return jwt.verify(token, process.env.JWT_SECRET || 'tu_jwt_secret_aqui');
    } catch (error) {
        throw error;
    }
};

// Verificar refresh token
const verifyRefreshToken = (token) => {
    try {
        return jwt.verify(token, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'tu_refresh_secret_aqui');
    } catch (error) {
        throw error;
    }
};

// Decodificar token sin verificar (para debugging)
const decodeToken = (token) => {
    return jwt.decode(token);
};

module.exports = {
    generateTokens,
    verifyAccessToken,
    verifyRefreshToken,
    decodeToken
};