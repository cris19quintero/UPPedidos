// src/context/CartContext.jsx - RUTAS CORREGIDAS PARA /carrito
import React, { createContext, useState, useContext, useEffect } from 'react';
import backendApi from '../services/backendApi';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart debe ser usado dentro de CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const [cartCount, setCartCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { isAuthenticated } = useAuth();

  // Cargar carrito cuando el usuario esté autenticado
  useEffect(() => {
    if (isAuthenticated) {
      loadCart();
    } else {
      setCart([]);
      setCartCount(0);
    }
  }, [isAuthenticated]);

  // Actualizar contador cuando cambie el carrito
  useEffect(() => {
    const count = cart.reduce((total, item) => total + (item.cantidad || 1), 0);
    setCartCount(count);
  }, [cart]);

  // Cargar carrito desde backend - USANDO /carrito
  const loadCart = async () => {
    try {
      setLoading(true);
      const response = await backendApi.get('/carrito'); // ← CAMBIADO DE /cart A /carrito
      
      if (response.data.success) {
        const cartData = response.data.data;
        setCart(cartData.items || []);
        setError(null);
      }
    } catch (error) {
      console.error('Error cargando carrito:', error);
      setError('Error al cargar el carrito');
      setCart([]);
    } finally {
      setLoading(false);
    }
  };

  // Agregar producto al carrito - USANDO /carrito
  const addToCart = async (product) => {
    try {
      setLoading(true);
      setError(null);

      const response = await backendApi.post('/carrito', { // ← CAMBIADO DE /cart A /carrito
        id_producto: product.id || product.id_producto,
        cantidad: product.quantity || 1
      });

      if (response.data.success) {
        await loadCart(); // Recargar carrito actualizado
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Error al agregar al carrito');
      }
    } catch (error) {
      console.error('Error agregando al carrito:', error);
      const message = error.response?.data?.message || error.message || 'Error al agregar producto';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  // Actualizar cantidad de producto en carrito - USANDO /carrito
  const updateCartItem = async (productId, quantity) => {
    try {
      setLoading(true);
      setError(null);

      const response = await backendApi.put(`/carrito/${productId}`, { // ← CAMBIADO DE /cart A /carrito
        cantidad: quantity
      });

      if (response.data.success) {
        await loadCart();
        return true;
      } else {
        throw new Error(response.data.message || 'Error al actualizar cantidad');
      }
    } catch (error) {
      console.error('Error actualizando carrito:', error);
      const message = error.response?.data?.message || 'Error al actualizar cantidad';
      setError(message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Remover producto del carrito - USANDO /carrito
  const removeFromCart = async (productId) => {
    try {
      setLoading(true);
      setError(null);

      const response = await backendApi.delete(`/carrito/${productId}`); // ← CAMBIADO DE /cart A /carrito

      if (response.data.success) {
        await loadCart();
        return true;
      } else {
        throw new Error(response.data.message || 'Error al remover producto');
      }
    } catch (error) {
      console.error('Error removiendo del carrito:', error);
      const message = error.response?.data?.message || 'Error al remover producto';
      setError(message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Vaciar carrito completamente - USANDO /carrito
  const clearCart = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await backendApi.delete('/carrito'); // ← CAMBIADO DE /cart A /carrito

      if (response.data.success) {
        setCart([]);
        setCartCount(0);
        return true;
      } else {
        throw new Error(response.data.message || 'Error al vaciar carrito');
      }
    } catch (error) {
      console.error('Error vaciando carrito:', error);
      const message = error.response?.data?.message || 'Error al vaciar carrito';
      setError(message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Calcular total del carrito
  const getCartTotal = () => {
    return cart.reduce((total, item) => {
      return total + (item.subtotal || (item.precio_unitario * item.cantidad));
    }, 0);
  };

  // Obtener resumen del carrito
  const getCartSummary = () => {
    const total = getCartTotal();
    const itemCount = cart.length;
    const totalQuantity = cart.reduce((sum, item) => sum + (item.cantidad || 1), 0);

    return {
      total,
      itemCount,
      totalQuantity,
      isEmpty: cart.length === 0
    };
  };

  // Crear pedido desde carrito
  const createOrderFromCart = async (orderData) => {
    try {
      setLoading(true);
      setError(null);

      if (cart.length === 0) {
        throw new Error('El carrito está vacío');
      }

      const response = await backendApi.post('/pedidos', {
        metodo_pago: orderData.metodo_pago || 'efectivo',
        observaciones: orderData.observaciones || '',
        tipo_pedido: orderData.tipo_pedido || 'normal'
      });

      if (response.data.success) {
        // Limpiar carrito después de crear el pedido
        setCart([]);
        setCartCount(0);
        return response.data.data.pedido;
      } else {
        throw new Error(response.data.message || 'Error al crear pedido');
      }
    } catch (error) {
      console.error('Error creando pedido:', error);
      const message = error.response?.data?.message || error.message || 'Error al crear pedido';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  // Verificar si un producto está en el carrito
  const isInCart = (productId) => {
    return cart.some(item => item.id_producto === productId);
  };

  // Obtener cantidad de un producto en el carrito
  const getProductQuantity = (productId) => {
    const item = cart.find(item => item.id_producto === productId);
    return item ? item.cantidad : 0;
  };

  const value = {
    cart,
    cartCount,
    loading,
    error,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    getCartTotal,
    getCartSummary,
    createOrderFromCart,
    isInCart,
    getProductQuantity,
    loadCart
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};