// src/context/CartContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);

  // --- Funciones para reemplazar dataService ---
  const loadCartFromStorage = () => {
    try {
      const saved = localStorage.getItem('utpedidos_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  };

  const saveCartToStorage = (cartData) => {
    localStorage.setItem('utpedidos_cart', JSON.stringify(cartData));
  };

  const clearCartStorage = () => {
    localStorage.removeItem('utpedidos_cart');
  };

  const getUserProfile = () => {
    // Aquí podrías tomar el usuario de AuthContext
    return { email: 'usuario_anonimo' };
  };
  // --- fin reemplazo dataService ---

  // Cargar carrito al iniciar
  useEffect(() => {
    const savedCart = loadCartFromStorage();
    if (savedCart.length > 0) setCart(savedCart);
  }, []);

  // Guardar carrito cada vez que cambie
  useEffect(() => {
    saveCartToStorage(cart);
  }, [cart]);

  // --- Resto de funciones (addToCart, removeFromCart, etc.) ---
  const addToCart = async (item) => {
    setLoading(true);
    try {
      const enhancedItem = {
        ...item,
        id_carrito: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        fecha_agregado: new Date().toISOString(),
        quantity: item.quantity || 1,
        precio_unitario: item.precio,
        subtotal: (item.precio || 0) * (item.quantity || 1)
      };

      const newCart = [...cart, enhancedItem];
      setCart(newCart);

      await new Promise(resolve => setTimeout(resolve, 200)); // feedback
      return enhancedItem;
    } finally {
      setLoading(false);
    }
  };

  const removeFromCart = (index) => {
    const newCart = cart.filter((_, i) => i !== index);
    setCart(newCart);
  };

  const clearCart = () => {
    setCart([]);
    clearCartStorage();
  };

  const getCartSummary = () => {
    const total = cart.reduce((acc, i) => acc + (i.precio_unitario * i.quantity), 0);
    return { total, count: cart.length, isEmpty: cart.length === 0 };
  };

  const createOrderFromCart = async (additionalData = {}) => {
    if (cart.length === 0) throw new Error('El carrito está vacío');
    setLoading(true);
    try {
      const summary = getCartSummary();
      const currentUser = getUserProfile();

      const orderData = {
        items: [...cart],
        total: summary.total,
        usuario: currentUser.email,
        metodo_pago: additionalData.metodo_pago || 'efectivo',
        observaciones: additionalData.observaciones || '',
        tipo_pedido: additionalData.tipo_pedido || 'normal',
        fecha: new Date().toISOString()
      };

      // Guardar pedido en localStorage como ejemplo
      const orders = JSON.parse(localStorage.getItem('utpedidos_orders') || '[]');
      orders.push(orderData);
      localStorage.setItem('utpedidos_orders', JSON.stringify(orders));

      clearCart();
      return orderData;
    } finally {
      setLoading(false);
    }
  };

  return (
    <CartContext.Provider value={{
      cart,
      loading,
      addToCart,
      removeFromCart,
      clearCart,
      getCartSummary,
      createOrderFromCart
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart debe ser usado dentro de CartProvider');
  return context;
};
