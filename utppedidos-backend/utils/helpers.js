// ===== utils/helpers.js - SOLO BACKEND (Node.js) =====

// Función para respuestas exitosas
const successResponse = (message, data = null) => {
    return {
        response: {
            success: true,
            message,
            ...(data && { data }),
            timestamp: new Date().toISOString()
        }
    };
};

// Función para respuestas de error
const errorResponse = (message, error = null, statusCode = 500) => {
    const response = {
        success: false,
        error: message,
        timestamp: new Date().toISOString()
    };

    if (error && process.env.NODE_ENV === 'development') {
        response.details = error.message || error;
    }

    return { response, statusCode };
};

// Calcular total del carrito
const calculateCartTotal = (items) => {
    return items.reduce((total, item) => {
        return total + (item.subtotal || (item.precio_unitario * item.cantidad));
    }, 0);
};

// Obtener horario actual de comida
const getCurrentMealTime = () => {
    const now = new Date();
    const hour = now.getHours();
    
    if (hour >= 7 && hour < 11) {
        return 'desayuno';
    } else if (hour >= 11 && hour < 16) {
        return 'almuerzo';
    } else if (hour >= 16 && hour <= 21) {
        return 'cena';
    }
    
    return 'cerrado';
};

// Verificar si cafetería está abierta
const isCafeteriaOpen = (horarios) => {
    const now = new Date();
    const currentTime = now.getHours() * 100 + now.getMinutes(); // Formato HHMM
    
    const timeToMinutes = (timeStr) => {
        if (!timeStr) return null;
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 100 + minutes;
    };
    
    const checkTimeRange = (inicio, fin) => {
        const inicioMinutes = timeToMinutes(inicio);
        const finMinutes = timeToMinutes(fin);
        
        if (!inicioMinutes || !finMinutes) return false;
        
        return currentTime >= inicioMinutes && currentTime <= finMinutes;
    };
    
    // Verificar cada horario
    return checkTimeRange(horarios.desayuno.inicio, horarios.desayuno.fin) ||
           checkTimeRange(horarios.almuerzo.inicio, horarios.almuerzo.fin) ||
           checkTimeRange(horarios.cena.inicio, horarios.cena.fin);
};

// Formatear fecha para mostrar
const formatDate = (date) => {
    if (!date) return '';
    
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleDateString('es-PA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

// Generar número de pedido único
const generateOrderNumber = () => {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    
    return `UTP${year}${month}${day}${random}`;
};

// Validar horario de comida
const validateMealTime = (horario, categoriaProducto) => {
    const horariosValidos = ['desayuno', 'almuerzo', 'cena', 'todo_dia'];
    
    if (!horariosValidos.includes(horario)) {
        return false;
    }
    
    // Validaciones específicas por categoría
    if (categoriaProducto === 'Desayunos' && horario !== 'desayuno') {
        return false;
    }
    
    return true;
};

// Calcular descuento (si aplicable)
const calculateDiscount = (total, userType = 'estudiante') => {
    const descuentos = {
        estudiante: 0.05, // 5%
        profesor: 0.10,   // 10%
        empleado: 0.07    // 7%
    };
    
    const porcentajeDescuento = descuentos[userType] || 0;
    const montoDescuento = total * porcentajeDescuento;
    
    return {
        porcentaje: porcentajeDescuento * 100,
        monto: montoDescuento,
        total_con_descuento: total - montoDescuento
    };
};

// Validar datos de producto
const validateProductData = (productData) => {
    const required = ['nombre', 'precio', 'categoria', 'id_cafeteria'];
    const missing = required.filter(field => !productData[field]);
    
    if (missing.length > 0) {
        return {
            valid: false,
            errors: [`Campos requeridos faltantes: ${missing.join(', ')}`]
        };
    }
    
    const errors = [];
    
    if (productData.precio <= 0) {
        errors.push('El precio debe ser mayor a 0');
    }
    
    if (productData.nombre.length < 3) {
        errors.push('El nombre debe tener al menos 3 caracteres');
    }
    
    const categoriasValidas = [
        'Desayunos', 'Platos Principales', 'Comida Rápida', 
        'Comida Saludable', 'Aperitivos', 'Bebidas Calientes', 
        'Bebidas Frías', 'Postres'
    ];
    
    if (!categoriasValidas.includes(productData.categoria)) {
        errors.push('Categoría no válida');
    }
    
    const horariosValidos = ['desayuno', 'almuerzo', 'cena', 'todo_dia'];
    if (productData.horario && !horariosValidos.includes(productData.horario)) {
        errors.push('Horario no válido');
    }
    
    return {
        valid: errors.length === 0,
        errors
    };
};

// Sanitizar datos de entrada
const sanitizeInput = (input) => {
    if (typeof input !== 'string') return input;
    
    return input
        .trim()
        .replace(/[<>]/g, '') // Remover caracteres peligrosos
        .replace(/\s+/g, ' '); // Normalizar espacios
};

// Paginación helper
const paginate = (array, page, limit) => {
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    
    return {
        data: array.slice(startIndex, endIndex),
        pagination: {
            current_page: page,
            total_pages: Math.ceil(array.length / limit),
            total_items: array.length,
            items_per_page: limit,
            has_next: endIndex < array.length,
            has_prev: startIndex > 0
        }
    };
};

// Convertir timestamp de Firebase a Date
const convertFirebaseTimestamp = (timestamp) => {
    if (!timestamp) return null;
    
    // Si ya es un objeto Date
    if (timestamp instanceof Date) {
        return timestamp;
    }
    
    // Si es un timestamp de Firebase
    if (timestamp && typeof timestamp.toDate === 'function') {
        return timestamp.toDate();
    }
    
    // Si es un timestamp en milisegundos
    if (typeof timestamp === 'number') {
        return new Date(timestamp);
    }
    
    // Si es una string de fecha
    if (typeof timestamp === 'string') {
        return new Date(timestamp);
    }
    
    return null;
};

// Validar datos de usuario para Firebase
const validateUserDataForFirebase = (userData, isUpdate = false) => {
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
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(userData.correo)) {
            errors.push('Formato de correo electrónico inválido');
        }
        
        if (!userData.correo.endsWith('@utp.ac.pa')) {
            errors.push('Debe usar un correo institucional @utp.ac.pa');
        }
    }
    
    if (userData.telefono) {
        const phoneRegex = /^[\+]?[0-9\s\-\(\)]{8,}$/;
        if (!phoneRegex.test(userData.telefono)) {
            errors.push('Formato de teléfono inválido');
        }
    }
    
    if (userData.cedula) {
        const cedulaRegex = /^\d{1,2}-\d{1,4}-\d{1,6}$/;
        if (!cedulaRegex.test(userData.cedula)) {
            errors.push('Formato de cédula inválido (ej: 8-123-12345)');
        }
    }
    
    if (userData.semestre && (userData.semestre < 1 || userData.semestre > 12)) {
        errors.push('El semestre debe estar entre 1 y 12');
    }
    
    return {
        valid: errors.length === 0,
        errors,
        cleanData: {
            nombre: sanitizeInput(userData.nombre),
            apellido: sanitizeInput(userData.apellido),
            correo: userData.correo?.toLowerCase().trim(),
            telefono: userData.telefono ? sanitizeInput(userData.telefono) : null,
            facultad: userData.facultad ? sanitizeInput(userData.facultad) : null,
            carrera: userData.carrera ? sanitizeInput(userData.carrera) : null,
            edificio_habitual: userData.edificio_habitual ? sanitizeInput(userData.edificio_habitual) : null,
            cedula: userData.cedula ? sanitizeInput(userData.cedula) : null,
            semestre: userData.semestre ? parseInt(userData.semestre) : null
        }
    };
};

// Helper para generar IDs únicos en Firebase
const generateFirebaseId = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 20; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};

module.exports = {
    successResponse,
    errorResponse,
    calculateCartTotal,
    getCurrentMealTime,
    isCafeteriaOpen,
    formatDate,
    generateOrderNumber,
    validateMealTime,
    calculateDiscount,
    validateProductData,
    sanitizeInput,
    paginate,
    convertFirebaseTimestamp,
    validateUserDataForFirebase,
    generateFirebaseId
};