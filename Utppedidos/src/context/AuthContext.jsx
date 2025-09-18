// src/context/AuthContext.jsx - CON EXPORTACIONES CORREGIDAS
import React, { createContext, useState, useContext, useEffect } from 'react';
import backendApi from '../services/backendApi';

const AuthContext = createContext();

// MOVER useAuth ANTES del AuthProvider
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  // Configurar token en axios al inicializar
  useEffect(() => {
    if (token) {
      backendApi.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      // Verificar si el token es válido
      verifyToken();
    } else {
      setLoading(false);
    }
  }, []);

  // Verificar token con el backend
  const verifyToken = async () => {
    try {
      const response = await backendApi.get('/auth/verify');
      if (response.data.success) {
        setUser(response.data.data.user);
      } else {
        logout();
      }
    } catch (error) {
      console.error('Token inválido:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  // Obtener token actual
  const getAuthToken = () => {
    return token;
  };

  // Login con backend
  const login = async (email, password, rememberMe = false) => {
    try {
      setLoading(true);
      
      const response = await backendApi.post('/auth/login', {
        correo: email,
        contrasena: password
      });

      if (response.data.success) {
        const { user, accessToken, refreshToken } = response.data.data;
        
        // Guardar token y usuario
        setToken(accessToken);
        setUser(user);
        
        if (rememberMe) {
          localStorage.setItem('token', accessToken);
          localStorage.setItem('refreshToken', refreshToken);
          localStorage.setItem('user', JSON.stringify(user));
        } else {
          // Solo en sessionStorage si no quiere recordar
          sessionStorage.setItem('token', accessToken);
          sessionStorage.setItem('user', JSON.stringify(user));
        }
        
        // Configurar header para futuras requests
        backendApi.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
        
        return { success: true, user };
      } else {
        return { success: false, message: response.data.message || 'Error en login' };
      }
      
    } catch (error) {
      console.error('Error en login:', error);
      const message = error.response?.data?.message || 'Error al conectar con el servidor';
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  };

  // Registro con backend
  const register = async (userData) => {
    try {
      setLoading(true);
      
      const response = await backendApi.post('/auth/register', userData);

      if (response.data.success) {
        const { user, accessToken, refreshToken } = response.data.data;
        
        // Auto-login después del registro
        setToken(accessToken);
        setUser(user);
        localStorage.setItem('token', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('user', JSON.stringify(user));
        
        backendApi.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
        
        return { success: true, user };
      } else {
        return { success: false, message: response.data.message || 'Error en registro' };
      }
      
    } catch (error) {
      console.error('Error en registro:', error);
      const message = error.response?.data?.message || 'Error al registrar usuario';
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  };

  // Logout mejorado
  const logout = async () => {
    try {
      // Intentar hacer logout en el backend
      if (token) {
        await backendApi.post('/auth/logout');
      }
    } catch (error) {
      console.error('Error en logout backend:', error);
    } finally {
      // Limpiar estado local
      setUser(null);
      setToken(null);
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
      delete backendApi.defaults.headers.common['Authorization'];
    }
  };

  // Actualizar perfil
  const updateProfile = async (profileData) => {
    try {
      const response = await backendApi.put('/users/profile', profileData);
      
      if (response.data.success) {
        setUser(response.data.data);
        
        // Actualizar en storage también
        const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
        if (userStr) {
          const isLocalStorage = !!localStorage.getItem('user');
          if (isLocalStorage) {
            localStorage.setItem('user', JSON.stringify(response.data.data));
          } else {
            sessionStorage.setItem('user', JSON.stringify(response.data.data));
          }
        }
        
        return { success: true };
      } else {
        return { success: false, message: response.data.message };
      }
    } catch (error) {
      console.error('Error actualizando perfil:', error);
      const message = error.response?.data?.message || 'Error al actualizar perfil';
      return { success: false, message };
    }
  };

  // Cambiar contraseña
  const changePassword = async (currentPassword, newPassword) => {
    try {
      const response = await backendApi.post('/users/change-password', {
        currentPassword,
        newPassword
      });
      
      if (response.data.success) {
        return { success: true };
      } else {
        return { success: false, message: response.data.message };
      }
    } catch (error) {
      console.error('Error cambiando contraseña:', error);
      const message = error.response?.data?.message || 'Error al cambiar contraseña';
      return { success: false, message };
    }
  };

  // Verificar disponibilidad de email
  const checkEmailAvailability = async (email) => {
    try {
      const response = await backendApi.get(`/auth/check-email?email=${encodeURIComponent(email)}`);
      return response.data;
    } catch (error) {
      console.error('Error verificando email:', error);
      return { available: true, isUTPEmail: email.endsWith('@utp.ac.pa') };
    }
  };

  // Renovar token
  const refreshAuthToken = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await backendApi.post('/auth/refresh', {
        refreshToken
      });

      if (response.data.success) {
        const { accessToken, refreshToken: newRefreshToken } = response.data.data;
        
        setToken(accessToken);
        localStorage.setItem('token', accessToken);
        if (newRefreshToken) {
          localStorage.setItem('refreshToken', newRefreshToken);
        }
        
        backendApi.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error renovando token:', error);
      logout();
      return false;
    }
  };

  const value = {
    user,
    loading,
    token,
    getAuthToken,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    checkEmailAvailability,
    refreshAuthToken,
    isAuthenticated: !!user && !!token
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};