// middleware/rateLimiter.js
const rateLimit = require('express-rate-limit');

// Rate limiter general
const generalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutos
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    success: false,
    message: 'Demasiadas peticiones desde esta IP, intenta de nuevo más tarde'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Rate limiter para login (más restrictivo)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // Máximo 5 intentos de login por IP
  skipSuccessfulRequests: true,
  message: {
    success: false,
    message: 'Demasiados intentos de login fallidos, intenta en 15 minutos'
  }
});

// Rate limiter para registro
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 3, // Máximo 3 registros por IP por hora
  message: {
    success: false,
    message: 'Límite de registros alcanzado, intenta en una hora'
  }
});

module.exports = {
  generalLimiter,
  loginLimiter,
  registerLimiter
};
