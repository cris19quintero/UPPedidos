// ===== utils/validators.js =====
const validator = require('validator');

// Validador de email UTP
const isUTPEmail = (email) => {
    return validator.isEmail(email) && email.endsWith('@utp.ac.pa');
};

// Validador de cédula panameña
const isValidCedula = (cedula) => {
    if (!cedula) return true; // Campo opcional
    const cedulaRegex = /^\d{1,2}-\d{1,4}-\d{1,6}$/;
    return cedulaRegex.test(cedula);
};

// Validador de teléfono
const isValidPhone = (phone) => {
    if (!phone) return true; // Campo opcional
    const phoneRegex = /^[\+]?[0-9\s\-\(\)]{8,}$/;
    return phoneRegex.test(phone);
};

// Validador de contraseña fuerte
const isStrongPassword = (password) => {
    if (!password) return false;
    // Al menos 6 caracteres, una mayúscula, una minúscula y un número
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/;
    return strongPasswordRegex.test(password);
};

// Sanitizar texto
const sanitizeText = (text) => {
    if (!text) return '';
    return validator.escape(text.trim());
};

// Validar rango de fechas
const isValidDateRange = (startDate, endDate) => {
    if (!startDate || !endDate) return true; // Campos opcionales
    const start = new Date(startDate);
    const end = new Date(endDate);
    return start <= end;
};

// Validar horario de cafetería
const isValidTimeFormat = (time) => {
    if (!time) return false;
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(time);
};

// Validar precio
const isValidPrice = (price) => {
    const numPrice = parseFloat(price);
    return !isNaN(numPrice) && numPrice > 0 && numPrice <= 1000; // Máximo $1000
};

// Validar cantidad
const isValidQuantity = (quantity) => {
    const numQuantity = parseInt(quantity);
    return !isNaN(numQuantity) && numQuantity > 0 && numQuantity <= 50; // Máximo 50 items
};

// Validar estado de pedido
const isValidOrderStatus = (status) => {
    const validStatuses = ['Pendiente', 'Por Retirar', 'Retirado', 'Finalizado', 'Cancelado', 'Expirado'];
    return validStatuses.includes(status);
};

// Validar método de pago
const isValidPaymentMethod = (method) => {
    const validMethods = ['efectivo', 'tarjeta', 'transferencia'];
    return validMethods.includes(method);
};

// Función para limpiar y validar datos de usuario
const cleanUserData = (userData) => {
    return {
        nombre: sanitizeText(userData.nombre),
        apellido: sanitizeText(userData.apellido),
        correo: validator.normalizeEmail(userData.correo || ''),
        telefono: userData.telefono ? sanitizeText(userData.telefono) : null,
        facultad: userData.facultad ? sanitizeText(userData.facultad) : null,
        carrera: userData.carrera ? sanitizeText(userData.carrera) : null,
        edificio_habitual: userData.edificio_habitual ? sanitizeText(userData.edificio_habitual) : null,
        cedula: userData.cedula ? sanitizeText(userData.cedula) : null,
        semestre: userData.semestre ? parseInt(userData.semestre) : null
    };
};

// Función para validar datos completos de usuario
const validateUserData = (userData, isUpdate = false) => {
    const errors = [];
    
    if (!isUpdate || userData.nombre) {
        if (!userData.nombre || userData.nombre.length < 2) {
            errors.push('El nombre debe tener al menos 2 caracteres');
        }
    }
    
    if (!isUpdate || userData.apellido) {
        if (!userData.apellido || userData.apellido.length < 2) {
            errors.push('El apellido debe tener al menos 2 caracteres');
        }
    }
    
    if (!isUpdate || userData.correo) {
        if (!isUTPEmail(userData.correo)) {
            errors.push('Debe usar un correo institucional @utp.ac.pa válido');
        }
    }
    
    if (userData.telefono && !isValidPhone(userData.telefono)) {
        errors.push('Formato de teléfono inválido');
    }
    
    if (userData.cedula && !isValidCedula(userData.cedula)) {
        errors.push('Formato de cédula inválido (ej: 8-123-12345)');
    }
    
    if (userData.semestre && (userData.semestre < 1 || userData.semestre > 12)) {
        errors.push('El semestre debe estar entre 1 y 12');
    }
    
    return {
        isValid: errors.length === 0,
        errors,
        cleanData: cleanUserData(userData)
    };
};

module.exports = {
    isUTPEmail,
    isValidCedula,
    isValidPhone,
    isStrongPassword,
    sanitizeText,
    isValidDateRange,
    isValidTimeFormat,
    isValidPrice,
    isValidQuantity,
    isValidOrderStatus,
    isValidPaymentMethod,
    cleanUserData,
    validateUserData
};