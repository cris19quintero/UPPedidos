// utils/constants.js
module.exports = {
    // Estados de pedidos
    ORDER_STATES: {
        PENDING: 'Pendiente',
        PROCESSING: 'Por Retirar', 
        PICKED_UP: 'Retirado',
        COMPLETED: 'Finalizado',
        CANCELLED: 'Cancelado',
        EXPIRED: 'Expirado'
    },

    // Métodos de pago
    PAYMENT_METHODS: {
        CASH: 'efectivo',
        CARD: 'tarjeta',
        TRANSFER: 'transferencia'
    },

    // Tipos de pedido
    ORDER_TYPES: {
        NORMAL: 'normal',
        EXPRESS: 'express'
    },

    // Roles de usuario
    USER_ROLES: {
        STUDENT: 'estudiante',
        ADMIN: 'admin',
        EMPLOYEE: 'empleado'
    },

    // Horarios de cafetería
    MEAL_TIMES: {
        BREAKFAST: 'desayuno',
        LUNCH: 'almuerzo', 
        DINNER: 'cena',
        ALL_DAY: 'todo_dia'
    },

    // Límites del sistema
    LIMITS: {
        MAX_ITEMS_PER_ORDER: 50,
        MAX_PRICE: 1000,
        MAX_QUANTITY: 50,
        MIN_PASSWORD_LENGTH: 6,
        MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
        MAX_FILES: 5,
        DEFAULT_PAGE_SIZE: 10,
        MAX_PAGE_SIZE: 100
    },

    // Configuraciones por defecto
    DEFAULTS: {
        ORDER_EXPIRY_HOURS: 2,
        PAGINATION_LIMIT: 10,
        RATE_LIMIT_WINDOW: 15 * 60 * 1000, // 15 minutos
        RATE_LIMIT_MAX: 100,
        LOGIN_ATTEMPTS_LIMIT: 5,
        TOKEN_EXPIRY: '24h',
        REFRESH_TOKEN_EXPIRY: '7d'
    },

    // Mensajes del sistema
    MESSAGES: {
        SUCCESS: {
            USER_CREATED: 'Usuario registrado correctamente',
            USER_UPDATED: 'Usuario actualizado correctamente', 
            LOGIN_SUCCESS: 'Inicio de sesión exitoso',
            ORDER_CREATED: 'Pedido creado exitosamente',
            ORDER_UPDATED: 'Pedido actualizado correctamente',
            ORDER_CANCELLED: 'Pedido cancelado correctamente',
            PASSWORD_CHANGED: 'Contraseña actualizada correctamente'
        },
        ERROR: {
            INVALID_CREDENTIALS: 'Credenciales inválidas',
            USER_NOT_FOUND: 'Usuario no encontrado',
            USER_INACTIVE: 'Usuario inactivo',
            EMAIL_EXISTS: 'El correo electrónico ya está registrado',
            WEAK_PASSWORD: 'La contraseña debe tener al menos 6 caracteres',
            INVALID_EMAIL: 'Formato de correo electrónico inválido',
            UNAUTHORIZED: 'No tienes permisos para realizar esta acción',
            ORDER_NOT_FOUND: 'Pedido no encontrado',
            INVALID_ORDER_STATE: 'Estado de pedido inválido',
            EMPTY_CART: 'El carrito está vacío',
            SERVER_ERROR: 'Error interno del servidor',
            VALIDATION_ERROR: 'Datos de entrada inválidos',
            TOKEN_EXPIRED: 'Token de acceso expirado',
            TOKEN_INVALID: 'Token de acceso inválido'
        }
    },

    // Configuraciones de email
    EMAIL_TEMPLATES: {
        WELCOME: 'welcome',
        PASSWORD_RESET: 'password_reset',
        ORDER_CONFIRMATION: 'order_confirmation',
        ORDER_READY: 'order_ready'
    },

    // Códigos de respuesta HTTP
    HTTP_STATUS: {
        OK: 200,
        CREATED: 201,
        BAD_REQUEST: 400,
        UNAUTHORIZED: 401,
        FORBIDDEN: 403,
        NOT_FOUND: 404,
        CONFLICT: 409,
        INTERNAL_SERVER_ERROR: 500
    },

    // Expresiones regulares
    REGEX: {
        EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        UTP_EMAIL: /^[^\s@]+@utp\.ac\.pa$/,
        CEDULA_PA: /^\d{1,2}-\d{1,4}-\d{1,6}$/,
        PHONE: /^[\+]?[0-9\s\-\(\)]{8,}$/,
        STRONG_PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/,
        TIME_FORMAT: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/
    },

    // Configuraciones de logging
    LOG_LEVELS: {
        ERROR: 'error',
        WARN: 'warn', 
        INFO: 'info',
        DEBUG: 'debug'
    }
};