// src/context/CartContext.jsx - CÓDIGO COMPLETO CORREGIDO
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
  const { isAuthenticated, user } = useAuth();

  // Cargar carrito - MANTENER LÓGICA ORIGINAL
  useEffect(() => {
    if (isAuthenticated) {
      loadCart();
    } else {
      // Cargar del localStorage si no está autenticado
      const savedCart = localStorage.getItem('cart');
      if (savedCart) {
        try {
          const parsedCart = JSON.parse(savedCart);
          setCart(parsedCart);
        } catch (error) {
          console.error('Error al cargar carrito del localStorage:', error);
          setCart([]);
        }
      }
    }
  }, [isAuthenticated]);

  // Actualizar contador cuando cambie el carrito
  useEffect(() => {
    const count = cart.reduce((total, item) => total + (item.cantidad || 1), 0);
    setCartCount(count);
    
    // Guardar en localStorage si no está autenticado
    if (!isAuthenticated) {
      localStorage.setItem('cart', JSON.stringify(cart));
    }
  }, [cart, isAuthenticated]);

  // Cargar carrito desde backend
  const loadCart = async () => {
    try {
      setLoading(true);
      const response = await backendApi.get('/carrito');
      
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

  // Agregar producto al carrito
  const addToCart = async (product) => {
    if (isAuthenticated) {
      // Usuario autenticado: usar carrito persistente
      try {
        setLoading(true);
        setError(null);

        const response = await backendApi.post('/carrito', {
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
    } else {
      // Usuario no autenticado: usar localStorage
      setCart(prevCart => {
        const existingItem = prevCart.find(item => 
          (item.id_producto || item.id) === (product.id_producto || product.id)
        );
        
        if (existingItem) {
          return prevCart.map(item =>
            (item.id_producto || item.id) === (product.id_producto || product.id)
              ? { ...item, cantidad: (item.cantidad || 1) + 1 }
              : item
          );
        } else {
          return [...prevCart, { 
            ...product, 
            cantidad: 1,
            id_producto: product.id_producto || product.id,
            precio_unitario: product.precio_unitario || product.precio
          }];
        }
      });
    }
  };

  // Actualizar cantidad
  const updateCartItem = async (productId, quantity) => {
    if (isAuthenticated) {
      try {
        setLoading(true);
        setError(null);

        const response = await backendApi.put(`/carrito/${productId}`, {
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
    } else {
      // Usuario no autenticado
      if (quantity <= 0) {
        removeFromCart(productId);
        return true;
      }

      setCart(prevCart =>
        prevCart.map(item =>
          (item.id_producto || item.id) === productId
            ? { ...item, cantidad: quantity }
            : item
        )
      );
      return true;
    }
  };

  // Remover producto del carrito
  const removeFromCart = async (productId) => {
    if (isAuthenticated) {
      try {
        setLoading(true);
        setError(null);

        const response = await backendApi.delete(`/carrito/${productId}`);

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
    } else {
      // Usuario no autenticado
      setCart(prevCart => prevCart.filter(item => 
        (item.id_producto || item.id) !== productId
      ));
      return true;
    }
  };

  // Vaciar carrito
  const clearCart = async () => {
    if (isAuthenticated) {
      try {
        setLoading(true);
        setError(null);

        const response = await backendApi.delete('/carrito');

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
    } else {
      // Usuario no autenticado
      setCart([]);
      localStorage.removeItem('cart');
      return true;
    }
  };

  // Calcular total del carrito
  const getCartTotal = () => {
    return cart.reduce((total, item) => {
      return total + (item.subtotal || (item.precio_unitario * item.cantidad) || ((item.precio || 0) * (item.cantidad || 1)));
    }, 0);
  };

  // CREAR PEDIDO - FUNCIONA PARA AMBOS CASOS
  const createOrderFromCart = async (orderData) => {
    try {
      setLoading(true);
      setError(null);

      if (cart.length === 0) {
        throw new Error('El carrito está vacío');
      }

      if (isAuthenticated) {
        // Usuario autenticado: usar carrito persistente
        const response = await backendApi.post('/pedidos/from-cart', {
          metodo_pago: orderData.metodo_pago || 'efectivo',
          observaciones: orderData.observaciones || '',
          tipo_pedido: orderData.tipo_pedido || 'normal'
        });

        if (response.data.success) {
          // Limpiar carrito después de crear el pedido
          await clearCart();
          return response.data.data.pedido;
        } else {
          throw new Error(response.data.message || 'Error al crear pedido');
        }
      } else {
        // Usuario no autenticado: pedido directo
        const items = cart.map(item => ({
          id_producto: item.id_producto || item.id,
          cantidad: item.cantidad || 1
        }));

        const orderPayload = {
          items,
          metodo_pago: orderData.metodo_pago || 'efectivo',
          observaciones: orderData.observaciones || '',
          tipo_pedido: orderData.tipo_pedido || 'normal',
          usuario_info: orderData.usuario_info || {
            nombre: user?.nombre || user?.email || 'Invitado'
          }
        };

        console.log('Enviando pedido directo:', orderPayload);

        const response = await backendApi.post('/pedidos', orderPayload);

        if (response.data.success) {
          // Limpiar carrito después de crear el pedido
          setCart([]);
          localStorage.removeItem('cart');
          return response.data.data;
        } else {
          throw new Error(response.data.message || 'Error al crear pedido');
        }
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

  // Verificar si un producto está en el carrito
  const isInCart = (productId) => {
    return cart.some(item => (item.id_producto || item.id) === productId);
  };

  // Obtener cantidad de un producto en el carrito
  const getProductQuantity = (productId) => {
    const item = cart.find(item => (item.id_producto || item.id) === productId);
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
    createOrderFromCart, // FUNCIÓN CLAVE PARA CARTMODAL
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