// src/components/MenuCategory.jsx - SOLO API BACKEND
import React, { useState } from 'react';
import { useCart } from '../context/CartContext';

function MenuCategory({ categoria, items, cafeteriaId, isOpen = true }) {
  const { addToCart } = useCart();
  const [addingItems, setAddingItems] = useState({});
  const [toast, setToast] = useState({ show: false, message: '' });

  const showToast = (message) => {
    setToast({ show: true, message });
    setTimeout(() => {
      setToast({ show: false, message: '' });
    }, 3000);
  };

  const handleAddToCart = async (item) => {
    if (!isOpen) {
      showToast('Esta cafetería está cerrada en este momento.');
      return;
    }

    const itemKey = `${cafeteriaId}-${item.id || item.id_producto}`;
    
    if (addingItems[itemKey]) return;
    
    setAddingItems(prev => ({ ...prev, [itemKey]: true }));
    
    try {
      // Preparar datos del producto para el backend
      const productData = {
        id: item.id || item.id_producto,
        id_producto: item.id || item.id_producto,
        quantity: 1
      };
      
      await addToCart(productData);
      
      // Mostrar toast de éxito
      showToast(`✅ ${item.nombre} añadido al carrito`);
      
    } catch (error) {
      console.error('Error al agregar al carrito:', error);
      showToast(`❌ Error: ${error.message}`);
    } finally {
      // Remover estado de loading después de un delay
      setTimeout(() => {
        setAddingItems(prev => ({ ...prev, [itemKey]: false }));
      }, 1000);
    }
  };

  if (!items || items.length === 0) {
    return (
      <div className="menu-category">
        <h3>{categoria}</h3>
        <div className="no-items">
          <p>No hay productos disponibles en esta categoría por el momento.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Toast Notification */}
      {toast.show && (
        <div className="toast-notification">
          <div className="toast-content">
            <span className="toast-message">{toast.message}</span>
          </div>
        </div>
      )}

      <div className="menu-category">
        <h3>{categoria}</h3>
        <div className="menu-items">
          {items.map((item, index) => {
            const itemKey = `${cafeteriaId}-${item.id || item.id_producto}`;
            const isAdding = addingItems[itemKey];
            const available = (item.activo !== false && item.disponible !== false) && isOpen;
            
            return (
              <div 
                key={item.id || item.id_producto || index} 
                className={`menu-item ${!available ? 'unavailable' : ''}`}
              >
                <div className="menu-item-image">
                  {item.imagen ? (
                    <img 
                      src={item.imagen} 
                      alt={item.nombre}
                      onError={(e) => {
                        e.target.src = '/imagenes/default-food.jpg';
                      }}
                    />
                  ) : (
                    <div className="placeholder-image">
                      🍽️
                    </div>
                  )}
                </div>
                
                <div className="menu-item-details">
                  <h4>{item.nombre}</h4>
                  
                  {item.descripcion && (
                    <p className="item-description">{item.descripcion}</p>
                  )}
                  
                  {/* Información adicional */}
                  <div className="item-info">
                    {item.tiempo_preparacion && (
                      <span className="prep-time">⏱️ {item.tiempo_preparacion}min</span>
                    )}
                    {item.calorias && (
                      <span className="calories">🔥 {item.calorias} cal</span>
                    )}
                    {item.vegetariano && (
                      <span className="vegetarian">🌱 Vegetariano</span>
                    )}
                  </div>

                  {/* Ingredientes (si están disponibles) */}
                  {item.ingredientes && item.ingredientes.length > 0 && (
                    <div className="ingredients">
                      <small>
                        {Array.isArray(item.ingredientes) 
                          ? item.ingredientes.join(', ')
                          : item.ingredientes
                        }
                      </small>
                    </div>
                  )}
                  
                  <div className="price-add">
                    <span className="price">
                      ${(item.precio || 0).toFixed(2)}
                    </span>
                    
                    <button 
                      className={`add-to-cart-btn ${isAdding ? 'adding' : ''} ${!available ? 'disabled' : ''}`}
                      onClick={() => handleAddToCart(item)}
                      disabled={!available || isAdding}
                    >
                      {isAdding ? (
                        <>
                          <span className="btn-spinner"></span>
                          Agregando...
                        </>
                      ) : !available ? (
                        'No disponible'
                      ) : (
                        <>
                          <i className="fas fa-plus"></i> Agregar
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

export default MenuCategory;