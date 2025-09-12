// src/context/CartContext.jsx - Actualizado para usar dataService
import React, { createContext, useState, useContext, useEffect } from 'react';
import dataService from '../services/dataService';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);

  // Cargar carrito al inicializar
  useEffect(() => {
    const savedCart = dataService.getCart();
    if (savedCart.length > 0) {
      setCart(savedCart);
      console.log('🛒 Carrito cargado:', savedCart);
    }
  }, []);

  // Guardar carrito cada vez que cambie
  useEffect(() => {
    if (cart.length >= 0) { // Incluir carrito vacío
      dataService.saveCart(cart);
    }
  }, [cart]);

  const addToCart = async (item) => {
    setLoading(true);
    try {
      // Agregar información adicional al item
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
      
      console.log('➕ Item agregado al carrito:', enhancedItem);
      
      // Simular un pequeño delay para feedback visual
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return enhancedItem;
    } catch (error) {
      console.error('❌ Error al agregar item al carrito:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const removeFromCart = (index) => {
    try {
      const itemToRemove = cart[index];
      const newCart = cart.filter((_, i) => i !== index);
      setCart(newCart);
      
      console.log('➖ Item removido del carrito:', itemToRemove);
      return itemToRemove;
    } catch (error) {
      console.error('❌ Error al remover item del carrito:', error);
    }
  };

  const removeItemById = (itemId) => {
    try {
      const newCart = cart.filter(item => item.id_carrito !== itemId);
      setCart(newCart);
      console.log('🗑️ Item removido por ID:', itemId);
    } catch (error) {
      console.error('❌ Error al remover item por ID:', error);
    }
  };

  const updateQuantity = (index, newQuantity) => {
    try {
      if (newQuantity <= 0) {
        removeFromCart(index);
        return;
      }

      const newCart = [...cart];
      newCart[index] = {
        ...newCart[index],
        quantity: newQuantity,
        subtotal: newCart[index].precio_unitario * newQuantity,
        fecha_actualizacion: new Date().toISOString()
      };
      
      setCart(newCart);
      console.log('🔄 Cantidad actualizada:', newCart[index]);
    } catch (error) {
      console.error('❌ Error al actualizar cantidad:', error);
    }
  };

  const clearCart = () => {
    try {
      setCart([]);
      dataService.clearCart();
      console.log('🧹 Carrito limpiado completamente');
    } catch (error) {
      console.error('❌ Error al limpiar carrito:', error);
    }
  };

  const getCartTotal = () => {
    try {
      return cart.reduce((total, item) => {
        const precio = item.precio || item.precio_unitario || 0;
        const quantity = item.quantity || 1;
        return total + (precio * quantity);
      }, 0);
    } catch (error) {
      console.error('❌ Error al calcular total:', error);
      return 0;
    }
  };

  const getCartCount = () => {
    try {
      return cart.reduce((count, item) => count + (item.quantity || 1), 0);
    } catch (error) {
      console.error('❌ Error al contar items:', error);
      return 0;
    }
  };

  const getUniqueItemsCount = () => {
    return cart.length;
  };

  const getCartSummary = () => {
    try {
      const total = getCartTotal();
      const itemCount = getCartCount();
      const uniqueItems = getUniqueItemsCount();
      
      // Agrupar items por categoría
      const categories = cart.reduce((acc, item) => {
        const categoria = item.categoria || 'Sin categoría';
        acc[categoria] = (acc[categoria] || 0) + (item.quantity || 1);
        return acc;
      }, {});

      // Agrupar items por cafetería
      const cafeterias = cart.reduce((acc, item) => {
        const cafeteriaId = item.cafeteriaId || 'desconocida';
        if (!acc[cafeteriaId]) {
          acc[cafeteriaId] = {
            items: [],
            total: 0,
            count: 0
          };
        }
        acc[cafeteriaId].items.push(item);
        acc[cafeteriaId].total += (item.precio || 0) * (item.quantity || 1);
        acc[cafeteriaId].count += (item.quantity || 1);
        return acc;
      }, {});

      return {
        total,
        itemCount,
        uniqueItems,
        categories,
        cafeterias,
        isEmpty: cart.length === 0
      };
    } catch (error) {
      console.error('❌ Error al generar resumen:', error);
      return {
        total: 0,
        itemCount: 0,
        uniqueItems: 0,
        categories: {},
        cafeterias: {},
        isEmpty: true
      };
    }
  };

  const createOrderFromCart = async (additionalData = {}) => {
    if (cart.length === 0) {
      throw new Error('El carrito está vacío');
    }

    setLoading(true);
    try {
      const summary = getCartSummary();
      const currentUser = dataService.getUserProfile();
      
      const orderData = {
        items: [...cart],
        total: summary.total,
        usuario: currentUser?.email || 'usuario_anonimo',
        cafeteriaId: Object.keys(summary.cafeterias)[0] || null, // Primera cafetería encontrada
        resumen: summary,
        metodo_pago: additionalData.metodo_pago || 'efectivo',
        observaciones: additionalData.observaciones || '',
        tipo_pedido: additionalData.tipo_pedido || 'normal',
        ...additionalData
      };

      // Guardar el pedido usando dataService
      const newOrder = dataService.saveOrder(orderData);
      
      if (newOrder) {
        // Limpiar carrito después de crear el pedido
        clearCart();
        
        console.log('🎉 Pedido creado exitosamente:', newOrder);
        return newOrder;
      } else {
        throw new Error('No se pudo crear el pedido');
      }
    } catch (error) {
      console.error('❌ Error al crear pedido:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    // Estado
    cart,
    loading,
    
    // Métodos básicos
    addToCart,
    removeFromCart,
    removeItemById,
    updateQuantity,
    clearCart,
    
    // Cálculos
    getCartTotal,
    getCartCount,
    getUniqueItemsCount,
    getCartSummary,
    
    // Pedidos
    createOrderFromCart,
    
    // Propiedades derivadas para compatibilidad
    cartCount: getCartCount(),
    cartTotal: getCartTotal(),
    isEmpty: cart.length === 0
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart debe ser usado dentro de CartProvider');
  }
  return context;
};