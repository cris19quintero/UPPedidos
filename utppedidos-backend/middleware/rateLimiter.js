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

// ===== scripts/seedDatabase.js =====
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const colors = require('colors');
require('dotenv').config();

// Importar modelos
const User = require('../models/User');
const connectDB = require('../config/database');

// Datos de prueba para usuarios
const sampleUsers = [
  {
    nombre: 'Administrador Principal',
    email: 'admin@utp.ac.pa',
    password: 'admin123',
    telefono: '+507 1234-5678',
    direccion: 'Campus UTP, Panamá',
    rol: 'admin',
    activo: true
  },
  {
    nombre: 'Juan Pérez',
    email: 'juan.perez@est.utp.ac.pa',
    password: 'estudiante123',
    telefono: '+507 9876-5432',
    direccion: 'San Miguelito, Panamá',
    rol: 'cliente',
    activo: true
  },
  {
    nombre: 'María González',
    email: 'maria.gonzalez@est.utp.ac.pa',
    password: 'estudiante123',
    telefono: '+507 5555-1234',
    direccion: 'Villa Lucre, Panamá',
    rol: 'cliente',
    activo: true
  },
  {
    nombre: 'Carlos Ruiz',
    email: 'carlos.ruiz@utp.ac.pa',
    password: 'empleado123',
    telefono: '+507 7777-8888',
    direccion: 'Pedregal, Panamá',
    rol: 'empleado',
    activo: true
  }
];

// Función principal de seedeo
async function seedDatabase() {
  try {
    console.log('🌱 Iniciando seedeo de la base de datos...'.yellow);
    
    // Conectar a la base de datos
    await connectDB();
    
    // Limpiar colección de usuarios
    await User.deleteMany({});
    console.log('🗑️  Usuarios existentes eliminados'.red);
    
    // Crear usuarios de prueba
    for (const userData of sampleUsers) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userData.password, salt);
      
      const user = new User({
        ...userData,
        password: hashedPassword
      });
      
      await user.save();
      console.log(`✅ Usuario creado: ${userData.email} (${userData.rol})`.green);
    }
    
    console.log('🎉 ¡Seedeo completado exitosamente!'.cyan.bold);
    console.log('');
    console.log('👤 Usuarios creados:'.yellow.bold);
    console.log('   Admin: admin@utp.ac.pa / admin123');
    console.log('   Estudiante 1: juan.perez@est.utp.ac.pa / estudiante123');
    console.log('   Estudiante 2: maria.gonzalez@est.utp.ac.pa / estudiante123');
    console.log('   Empleado: carlos.ruiz@utp.ac.pa / empleado123');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error en el seedeo:', error);
    process.exit(1);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;

// ===== scripts/createAdmin.js =====
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const readline = require('readline');
const colors = require('colors');
require('dotenv').config();

const User = require('../models/User');
const connectDB = require('../config/database');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

async function createAdmin() {
  try {
    console.log('👤 Crear Administrador para UTPedidos'.cyan.bold);
    console.log('====================================='.cyan);
    
    await connectDB();
    
    const nombre = await askQuestion('Nombre completo: ');
    const email = await askQuestion('Email: ');
    const password = await askQuestion('Contraseña: ');
    const telefono = await askQuestion('Teléfono (opcional): ');
    
    // Verificar si el email ya existe
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      console.log('❌ Este email ya está registrado'.red);
      process.exit(1);
    }
    
    // Crear usuario admin
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    const admin = new User({
      nombre,
      email: email.toLowerCase(),
      password: hashedPassword,
      telefono: telefono || '',
      rol: 'admin',
      activo: true
    });
    
    await admin.save();
    
    console.log('');
    console.log('✅ Administrador creado exitosamente!'.green.bold);
    console.log(`📧 Email: ${email}`.yellow);
    console.log(`🔑 Contraseña: ${password}`.yellow);
    console.log(`👤 Rol: admin`.yellow);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creando administrador:', error);
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  createAdmin();
}

module.exports = createAdmin;

// ===== middleware/compression.js =====
const compression = require('compression');

const compressionMiddleware = compression({
  level: 6, // Nivel de compresión (0-9)
  threshold: 1024, // Solo comprimir respuestas >= 1kb
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  }
});

module.exports = compressionMiddleware;

// ===== utils/logger.js =====
const colors = require('colors');

class Logger {
  static info(message, data = null) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] INFO: ${message}`.cyan, data ? data : '');
  }
  
  static success(message, data = null) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] SUCCESS: ${message}`.green, data ? data : '');
  }
  
  static warn(message, data = null) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] WARN: ${message}`.yellow, data ? data : '');
  }
  
  static error(message, error = null) {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] ERROR: ${message}`.red);
    if (error) {
      console.error(error);
    }
  }
  
  static debug(message, data = null) {
    if (process.env.NODE_ENV === 'development') {
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] DEBUG: ${message}`.magenta, data ? data : '');
    }
  }
  
  static http(method, url, statusCode, responseTime) {
    const color = statusCode >= 400 ? 'red' : statusCode >= 300 ? 'yellow' : 'green';
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${method} ${url} ${statusCode} - ${responseTime}ms`[color]);
  }
}

module.exports = Logger;

// ===== utils/apiHelpers.js =====
const ApiHelpers = {
  // Función para paginar resultados
  paginate: (page = 1, limit = 10, total) => {
    const currentPage = Math.max(1, parseInt(page));
    const pageSize = Math.min(50, Math.max(1, parseInt(limit))); // Límite máximo 50
    const skip = (currentPage - 1) * pageSize;
    const totalPages = Math.ceil(total / pageSize);
    
    return {
      skip,
      limit: pageSize,
      pagination: {
        current: currentPage,
        pages: totalPages,
        total,
        hasNext: currentPage < totalPages,
        hasPrev: currentPage > 1
      }
    };
  },
  
  // Función para sanitizar query params
  sanitizeQuery: (query) => {
    const sanitized = {};
    
    // Lista de campos permitidos para filtros
    const allowedFields = ['page', 'limit', 'sort', 'search', 'estado', 'cafeteria', 'horario'];
    
    Object.keys(query).forEach(key => {
      if (allowedFields.includes(key) && query[key]) {
        sanitized[key] = query[key].toString().trim();
      }
    });
    
    return sanitized;
  },
  
  // Función para generar número de orden único
  generateOrderNumber: () => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `UTP-${timestamp.toString().slice(-6)}${random.toString().padStart(3, '0')}`;
  },
  
  // Función para validar formato de email
  isValidEmail: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },
  
  // Función para formatear respuestas de error
  formatError: (message, errors = null, statusCode = 400) => {
    const response = {
      success: false,
      message,
      timestamp: new Date().toISOString()
    };
    
    if (errors) {
      response.errors = errors;
    }
    
    return response;
  },
  
  // Función para formatear respuestas exitosas
  formatSuccess: (message, data = null, statusCode = 200) => {
    const response = {
      success: true,
      message,
      timestamp: new Date().toISOString()
    };
    
    if (data !== null) {
      response.data = data;
    }
    
    return response;
  }
};

module.exports = ApiHelpers;