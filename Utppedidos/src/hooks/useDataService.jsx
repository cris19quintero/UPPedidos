// src/hooks/useDataService.js - Hook personalizado para manejar datos
import { useState, useEffect, useCallback } from 'react';
import dataService from '../services/dataService';

export const useDataService = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const handleAsync = useCallback(async (asyncFn, loadingState = true) => {
    if (loadingState) setLoading(true);
    setError(null);
    
    try {
      const result = await asyncFn();
      return result;
    } catch (err) {
      console.error('❌ Error en operación:', err);
      setError(err.message || 'Error desconocido');
      throw err;
    } finally {
      if (loadingState) setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    clearError,
    handleAsync
  };
};

export const useOrders = (userId = null) => {
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({});
  const { loading, error, clearError, handleAsync } = useDataService();

  const loadOrders = useCallback(async () => {
    await handleAsync(async () => {
      const loadedOrders = dataService.getOrders(userId);
      const userStats = userId ? dataService.getUserOrderStats(userId) : {};
      
      setOrders(loadedOrders);
      setStats(userStats);
      
      console.log('📊 Pedidos cargados:', loadedOrders.length);
      return loadedOrders;
    });
  }, [userId, handleAsync]);

  const createOrder = useCallback(async (orderData) => {
    return await handleAsync(async () => {
      const newOrder = dataService.saveOrder(orderData);
      
      if (newOrder) {
        await loadOrders(); // Recargar pedidos
        return newOrder;
      }
      throw new Error('No se pudo crear el pedido');
    });
  }, [handleAsync, loadOrders]);

  const updateOrderStatus = useCallback(async (orderId, newStatus) => {
    return await handleAsync(async () => {
      const updatedOrder = dataService.updateOrderStatus(orderId, newStatus);
      
      if (updatedOrder) {
        await loadOrders(); // Recargar pedidos
        return updatedOrder;
      }
      throw new Error('No se pudo actualizar el pedido');
    }, false); // No mostrar loading para esta operación
  }, [handleAsync, loadOrders]);

  const deleteOrder = useCallback(async (orderId) => {
    return await handleAsync(async () => {
      const deleted = dataService.deleteOrder(orderId);
      
      if (deleted) {
        await loadOrders(); // Recargar pedidos
        return true;
      }
      throw new Error('No se pudo eliminar el pedido');
    }, false);
  }, [handleAsync, loadOrders]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  return {
    orders,
    stats,
    loading,
    error,
    clearError,
    loadOrders,
    createOrder,
    updateOrderStatus,
    deleteOrder
  };
};

export const useUserProfile = () => {
  const [profile, setProfile] = useState({});
  const { loading, error, clearError, handleAsync } = useDataService();

  const loadProfile = useCallback(async () => {
    await handleAsync(async () => {
      const loadedProfile = dataService.getUserProfile();
      setProfile(loadedProfile || {});
      return loadedProfile;
    });
  }, [handleAsync]);

  const saveProfile = useCallback(async (profileData) => {
    return await handleAsync(async () => {
      const savedProfile = dataService.saveUserProfile(profileData);
      
      if (savedProfile) {
        setProfile(savedProfile);
        return savedProfile;
      }
      throw new Error('No se pudo guardar el perfil');
    });
  }, [handleAsync]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  return {
    profile,
    loading,
    error,
    clearError,
    loadProfile,
    saveProfile
  };
};

export const useCafeterias = () => {
  const [cafeterias, setCafeterias] = useState([]);
  const { loading, error, clearError, handleAsync } = useDataService();

  const loadCafeterias = useCallback(async () => {
    await handleAsync(async () => {
      const loadedCafeterias = dataService.getCafeterias();
      setCafeterias(loadedCafeterias);
      return loadedCafeterias;
    });
  }, [handleAsync]);

  const getCafeteriaById = useCallback((id) => {
    return dataService.getCafeteriaById(id);
  }, []);

  useEffect(() => {
    loadCafeterias();
  }, [loadCafeterias]);

  return {
    cafeterias,
    loading,
    error,
    clearError,
    loadCafeterias,
    getCafeteriaById
  };
};

export const useMenu = (cafeteriaId = null) => {
  const [menuData, setMenuData] = useState({});
  const { loading, error, clearError, handleAsync } = useDataService();

  const loadMenu = useCallback(async () => {
    await handleAsync(async () => {
      const loadedMenuData = dataService.getMenuData();
      setMenuData(loadedMenuData);
      return loadedMenuData;
    });
  }, [handleAsync]);

  const getMenuForCafeteria = useCallback((id) => {
    return dataService.getMenuByCafeteria(id || cafeteriaId);
  }, [cafeteriaId]);

  useEffect(() => {
    loadMenu();
  }, [loadMenu]);

  return {
    menuData,
    loading,
    error,
    clearError,
    loadMenu,
    getMenuForCafeteria,
    currentMenu: cafeteriaId ? getMenuForCafeteria(cafeteriaId) : null
  };
};

export const useCart = () => {
  const [cart, setCart] = useState([]);
  const { loading, error, clearError, handleAsync } = useDataService();

  const loadCart = useCallback(async () => {
    await handleAsync(async () => {
      const loadedCart = dataService.getCart();
      setCart(loadedCart);
      return loadedCart;
    }, false); // Sin loading para esta operación
  }, [handleAsync]);

  const addToCart = useCallback(async (item) => {
    return await handleAsync(async () => {
      const currentCart = dataService.getCart();
      const newCart = [...currentCart, item];
      
      const saved = dataService.saveCart(newCart);
      if (saved) {
        setCart(newCart);
        return item;
      }
      throw new Error('No se pudo agregar el item al carrito');
    }, false);
  }, [handleAsync]);

  const removeFromCart = useCallback(async (index) => {
    return await handleAsync(async () => {
      const currentCart = dataService.getCart();
      const newCart = currentCart.filter((_, i) => i !== index);
      
      const saved = dataService.saveCart(newCart);
      if (saved) {
        setCart(newCart);
        return true;
      }
      throw new Error('No se pudo eliminar el item del carrito');
    }, false);
  }, [handleAsync]);

  const clearCart = useCallback(async () => {
    return await handleAsync(async () => {
      dataService.clearCart();
      setCart([]);
      return true;
    }, false);
  }, [handleAsync]);

  const getCartTotal = useCallback(() => {
    return cart.reduce((total, item) => {
      const precio = item.precio || item.precio_unitario || 0;
      const quantity = item.quantity || 1;
      return total + (precio * quantity);
    }, 0);
  }, [cart]);

  const getCartCount = useCallback(() => {
    return cart.reduce((count, item) => count + (item.quantity || 1), 0);
  }, [cart]);

  useEffect(() => {
    loadCart();
  }, [loadCart]);

  return {
    cart,
    loading,
    error,
    clearError,
    addToCart,
    removeFromCart,
    clearCart,
    getCartTotal,
    getCartCount,
    cartTotal: getCartTotal(),
    cartCount: getCartCount(),
    isEmpty: cart.length === 0
  };
};

// Hook para exportar/importar datos
export const useDataExport = () => {
  const { loading, error, clearError, handleAsync } = useDataService();

  const exportData = useCallback(async () => {
    return await handleAsync(async () => {
      dataService.exportData();
      return true;
    });
  }, [handleAsync]);

  const importData = useCallback(async (file) => {
    return await handleAsync(async () => {
      await dataService.importData(file);
      return true;
    });
  }, [handleAsync]);

  const clearAllData = useCallback(async () => {
    return await handleAsync(async () => {
      if (window.confirm('¿Estás seguro de que deseas eliminar todos los datos? Esta acción no se puede deshacer.')) {
        dataService.clearAllData();
        return true;
      }
      return false;
    }, false);
  }, [handleAsync]);

  return {
    loading,
    error,
    clearError,
    exportData,
    importData,
    clearAllData
  };
};

// Hook para estadísticas
export const useStatistics = (userId = null) => {
  const [stats, setStats] = useState({});
  const { loading, error, clearError, handleAsync } = useDataService();

  const loadStats = useCallback(async () => {
    await handleAsync(async () => {
      if (userId) {
        const userStats = dataService.getUserOrderStats(userId);
        setStats(userStats);
        return userStats;
      } else {
        // Estadísticas generales
        const allOrders = dataService.getOrders();
        const generalStats = {
          totalOrders: allOrders.length,
          totalRevenue: allOrders.reduce((sum, order) => sum + (order.total || 0), 0),
          averageOrderValue: allOrders.length > 0 ? 
            allOrders.reduce((sum, order) => sum + (order.total || 0), 0) / allOrders.length : 0,
          popularCafeteria: null, // Se podría implementar
          busyPeriods: null // Se podría implementar
        };
        setStats(generalStats);
        return generalStats;
      }
    });
  }, [userId, handleAsync]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  return {
    stats,
    loading,
    error,
    clearError,
    loadStats
  };
};