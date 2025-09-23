// src/services/apiService.js - VERSIÓN COMPLETA CORREGIDA
import backendApi from './backendApi';

// ==================== CAFETERÍAS ====================
export const cafeteriaService = {
  // Obtener todas las cafeterías
  getAll: async () => {
    try {
      const response = await backendApi.get('/cafeterias');
      return response.data;
    } catch (error) {
      console.error('Error obteniendo cafeterías:', error);
      throw error;
    }
  },

  // Obtener cafetería por ID
  getById: async (id) => {
    try {
      const response = await backendApi.get(`/cafeterias/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo cafetería:', error);
      throw error;
    }
  },

  // Obtener estadísticas de cafetería
  getStats: async (id) => {
    try {
      const response = await backendApi.get(`/cafeterias/${id}/stats`);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      throw error;
    }
  }
};

// ==================== PRODUCTOS/MENÚ ====================
export const menuService = {
  // Obtener menú por cafetería - CON DEBUG
  getByCafeteria: async (cafeteriaId, filters = {}) => {
    try {
      console.log('🔍 MenuService - Iniciando llamada para cafetería:', cafeteriaId);
      
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== '') {
          params.append(key, value);
        }
      });
      
      const queryString = params.toString();
      const url = `/menu/cafeteria/${cafeteriaId}${queryString ? `?${queryString}` : ''}`;
      
      console.log('🌐 MenuService - URL completa:', url);
      console.log('🌐 MenuService - Base URL del backendApi:', backendApi.defaults.baseURL);
      
      const response = await backendApi.get(url);
      
      console.log('✅ MenuService - Respuesta exitosa:', response);
      console.log('📊 MenuService - Data:', response.data);
      
      return response.data;
    } catch (error) {
      console.error('❌ MenuService - Error completo:', error);
      console.error('❌ MenuService - Error response:', error.response);
      console.error('❌ MenuService - Error status:', error.response?.status);
      console.error('❌ MenuService - Error data:', error.response?.data);
      throw error;
    }
  },

  // Buscar productos - USANDO /menu/search
  search: async (query, filters = {}) => {
    try {
      const params = new URLSearchParams({ q: query });
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== '') {
          params.append(key, value);
        }
      });
      
      const response = await backendApi.get(`/menu/search?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error buscando productos:', error);
      throw error;
    }
  },

  // Obtener producto por ID - USANDO /menu/item
  getProductById: async (productId) => {
    try {
      const response = await backendApi.get(`/menu/item/${productId}`);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo producto:', error);
      throw error;
    }
  },

  // Obtener categorías - USANDO /menu/categorias (TYPO CORREGIDO)
  getCategories: async (cafeteriaId = null) => {
    try {
      const params = cafeteriaId ? `?cafeteria=${cafeteriaId}` : '';
      const response = await backendApi.get(`/menu/categorias${params}`);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo categorías:', error);
      throw error;
    }
  }
};

// ==================== PEDIDOS ====================
export const orderService = {
  // Crear pedido desde carrito
  createFromCart: async (orderData) => {
    try {
      const response = await backendApi.post('/pedidos', orderData);
      return response.data;
    } catch (error) {
      console.error('Error creando pedido desde carrito:', error);
      throw error;
    }
  },

  // Obtener pedidos del usuario - FUNCIÓN CORRECTA
  getUserOrders: async (filters = {}) => {
    try {
      const params = new URLSearchParams(filters);
      const response = await backendApi.get(`/pedidos?${params}`);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo pedidos:', error);
      throw error;
    }
  },

  // Obtener pedido por ID
  getById: async (orderId) => {
    try {
      const response = await backendApi.get(`/pedidos/${orderId}`);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo pedido:', error);
      throw error;
    }
  },

  // Cancelar pedido
  cancel: async (orderId) => {
    try {
      const response = await backendApi.delete(`/pedidos/${orderId}`);
      return response.data;
    } catch (error) {
      console.error('Error cancelando pedido:', error);
      throw error;
    }
  }
};

// ==================== CARRITO ====================
export const cartService = {
  // Obtener carrito - USANDO /carrito
  get: async () => {
    try {
      const response = await backendApi.get('/carrito');
      return response.data;
    } catch (error) {
      console.error('Error obteniendo carrito:', error);
      throw error;
    }
  },

  // Agregar al carrito - USANDO /carrito
  add: async (productData) => {
    try {
      // Formato compatible con MenuCategory
      const payload = {
        id_producto: productData.id_producto || productData.id,
        cantidad: productData.quantity || 1
      };
      
      const response = await backendApi.post('/carrito', payload);
      return response.data;
    } catch (error) {
      console.error('Error agregando al carrito:', error);
      throw error;
    }
  },

  // Actualizar cantidad - USANDO /carrito
  update: async (productId, quantity) => {
    try {
      const response = await backendApi.put(`/carrito/${productId}`, {
        cantidad: quantity
      });
      return response.data;
    } catch (error) {
      console.error('Error actualizando carrito:', error);
      throw error;
    }
  },

  // Remover del carrito - USANDO /carrito
  remove: async (productId) => {
    try {
      const response = await backendApi.delete(`/carrito/${productId}`);
      return response.data;
    } catch (error) {
      console.error('Error removiendo del carrito:', error);
      throw error;
    }
  },

  // Vaciar carrito - USANDO /carrito
  clear: async () => {
    try {
      const response = await backendApi.delete('/carrito');
      return response.data;
    } catch (error) {
      console.error('Error vaciando carrito:', error);
      throw error;
    }
  }
};

// ==================== USUARIOS ====================
export const userService = {
  // Obtener perfil
  getProfile: async () => {
    try {
      const response = await backendApi.get('/users/profile');
      return response.data;
    } catch (error) {
      console.error('Error obteniendo perfil:', error);
      throw error;
    }
  },

  // Actualizar perfil
  updateProfile: async (profileData) => {
    try {
      const response = await backendApi.put('/users/profile', profileData);
      return response.data;
    } catch (error) {
      console.error('Error actualizando perfil:', error);
      throw error;
    }
  },

  // Cambiar contraseña
  changePassword: async (currentPassword, newPassword) => {
    try {
      const response = await backendApi.post('/users/change-password', {
        currentPassword,
        newPassword
      });
      return response.data;
    } catch (error) {
      console.error('Error cambiando contraseña:', error);
      throw error;
    }
  },

  // Obtener estadísticas del usuario
  getStats: async () => {
    try {
      const response = await backendApi.get('/users/stats');
      return response.data;
    } catch (error) {
      console.error('Error obteniendo estadísticas del usuario:', error);
      throw error;
    }
  }
};

// ==================== FUNCIONES HELPER ====================
export const handleApiError = (error) => {
  if (error.response) {
    const message = error.response.data?.message || 'Error del servidor';
    const status = error.response.status;
    
    if (status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
      return 'Sesión expirada. Por favor, inicia sesión nuevamente.';
    }
    
    return message;
  } else if (error.request) {
    return 'Error de conexión. Verifica tu internet.';
  } else {
    return 'Error inesperado. Intenta nuevamente.';
  }
};

// Función para verificar conectividad con el backend
export const checkBackendHealth = async () => {
  try {
    const response = await backendApi.get('/health');
    return response.data;
  } catch (error) {
    console.error('Backend no disponible:', error);
    return { success: false, message: 'Backend no disponible' };
  }
};

// Exportar servicios como default
const apiService = {
  cafeteria: cafeteriaService,
  menu: menuService,
  order: orderService,
  cart: cartService,
  user: userService,
  handleApiError,
  checkBackendHealth
};

export default apiService;