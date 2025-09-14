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