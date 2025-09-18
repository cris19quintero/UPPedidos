// src/services/backendApi.js - CORREGIDO PARA VERCEL + RAILWAY
import axios from 'axios';

// URLs según el entorno - CORREGIDO
const getApiUrl = () => {
  // En producción (Vercel), usar Railway
  if (process.env.NODE_ENV === 'production') {
    return 'https://uppedidos-production.up.railway.app/api'; // ✅ SIN 's' EXTRA
  }
  
  // En desarrollo, usar localhost
  return 'http://localhost:3001/api';
};

const API_BASE_URL = getApiUrl();

console.log('🔗 Configurando backendApi con URL:', API_BASE_URL);
console.log('🌐 Entorno:', process.env.NODE_ENV || 'development');

const backendApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: 45000, // 45 segundos para Railway (más tiempo)
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Interceptor para requests
backendApi.interceptors.request.use(
  (config) => {
    console.log(`[REQUEST] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    console.error('[REQUEST ERROR]:', error);
    return Promise.reject(error);
  }
);

// Interceptor para responses - MEJORADO PARA VERCEL + RAILWAY
backendApi.interceptors.response.use(
  (response) => {
    console.log(`[RESPONSE] ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('[RESPONSE ERROR]:', error);
    
    if (error.response) {
      console.error('Server Error Response:');
      console.error('   - Status:', error.response.status);
      console.error('   - Data:', error.response.data);
      
      // Manejar errores específicos
      if (error.response.status === 503) {
        console.error('⚠️ Servicio no disponible - Railway puede estar iniciando');
      } else if (error.response.status === 401) {
        console.warn('🔐 Token expirado o inválido');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } else if (error.response.status >= 500) {
        console.error('💥 Error del servidor Railway');
      } else if (error.response.status === 404) {
        console.error('🔍 Endpoint no encontrado en Railway');
      }
      
    } else if (error.request) {
      console.error('❌ Error de red - Backend Railway no disponible');
      console.error('   - URL actual:', API_BASE_URL);
      
      // Información de debug para producción
      if (process.env.NODE_ENV === 'production') {
        console.error('🚂 Verificar Railway:');
        console.error('   - Healthcheck: https://utpedidos-production.up.railway.app/health');
        console.error('   - Ping: https://utpedidos-production.up.railway.app/ping');
        console.error('   - Vercel intenta conectar a Railway desde:', window.location.origin);
      }
      
    } else {
      console.error('❓ Error desconocido:', error.message);
    }
    
    return Promise.reject(error);
  }
);

// Función para verificar conectividad Railway desde Vercel
export const checkBackendHealth = async () => {
  try {
    const healthUrl = API_BASE_URL.replace('/api', '/health');
    console.log('🏥 Verificando Railway desde Vercel:', healthUrl);
    
    const response = await axios.get(healthUrl, { 
      timeout: 15000,
      headers: {
        'Origin': window.location.origin // Para CORS
      }
    });
    
    if (response.data.status === 'healthy') {
      console.log('✅ Railway está saludable desde Vercel');
      return { healthy: true, data: response.data };
    } else {
      console.warn('⚠️ Railway responde pero no está saludable:', response.data);
      return { healthy: false, data: response.data };
    }
  } catch (error) {
    console.error('❌ Railway no disponible desde Vercel:', error.message);
    return { 
      healthy: false, 
      error: error.message,
      url: API_BASE_URL,
      origin: window.location.origin
    };
  }
};

// Función para ping simple
export const pingBackend = async () => {
  try {
    const pingUrl = API_BASE_URL.replace('/api', '/ping');
    const response = await axios.get(pingUrl, { timeout: 10000 });
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export default backendApi;