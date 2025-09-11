// src/components/MenuCategory.jsx
import React, { useState } from 'react'
import { useCart } from '../context/CartContext'

function MenuCategory({ categoria, items, cafeteriaId }) {
  const { addToCart } = useCart()
  const [addingItems, setAddingItems] = useState({})

  const handleAddToCart = async (item) => {
    const itemKey = `${cafeteriaId}-${item.id || item.nombre}`
    
    // Evitar múltiples clics
    if (addingItems[itemKey]) return
    
    setAddingItems(prev => ({ ...prev, [itemKey]: true }))
    
    try {
      // Agregar información adicional al item
      const itemWithExtras = {
        ...item,
        cafeteriaId: cafeteriaId,
        categoria: categoria,
        timestamp: new Date().toISOString(),
        quantity: 1
      }
      
      addToCart(itemWithExtras)
      
      // Feedback visual
      setTimeout(() => {
        setAddingItems(prev => ({ ...prev, [itemKey]: false }))
      }, 1000)
      
    } catch (error) {
      console.error('Error al agregar al carrito:', error)
      setAddingItems(prev => ({ ...prev, [itemKey]: false }))
    }
  }

  const isItemAvailable = (item) => {
    return item.disponible !== false
  }

  if (!items || items.length === 0) {
    return (
      <div className="menu-category">
        <h3>{categoria}</h3>
        <div className="no-items">
          <p>No hay productos disponibles en esta categoría por el momento.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="menu-category">
      <h3>{categoria}</h3>
      <div className="menu-items">
        {items.map((item, index) => {
          const itemKey = `${cafeteriaId}-${item.id || item.nombre}`
          const isAdding = addingItems[itemKey]
          const available = isItemAvailable(item)
          
          return (
            <div 
              key={item.id || index} 
              className={`menu-item ${!available ? 'unavailable' : ''}`}
            >
              {/* Imagen del producto (opcional) */}
              {item.imagen && (
                <div className="menu-item-image">
                  <img 
                    src={item.imagen} 
                    alt={item.nombre}
                    onError={(e) => {
                      e.target.style.display = 'none'
                    }}
                  />
                </div>
              )}
              
              <div className="menu-item-details">
                <h4>{item.nombre}</h4>
                {item.descripcion && (
                  <p className="item-description">{item.descripcion}</p>
                )}
                
                {!available && (
                  <div className="unavailable-badge">
                    No disponible temporalmente
                  </div>
                )}
                
                <div className="price-add">
                  <span className="price">
                    ${item.precio ? item.precio.toFixed(2) : '0.00'}
                  </span>
                  
                  <button 
                    className={`add-to-cart-btn ${isAdding ? 'adding' : ''}`}
                    onClick={() => handleAddToCart(item)}
                    disabled={!available || isAdding}
                    title={
                      !available 
                        ? 'Producto no disponible' 
                        : isAdding 
                          ? 'Agregando...' 
                          : 'Agregar al carrito'
                    }
                  >
                    {isAdding ? (
                      <>
                        <span className="btn-spinner"></span>
                        Agregando...
                      </>
                    ) : !available ? (
                      '❌ No disponible'
                    ) : (
                      '🛒 Agregar al carrito'
                    )}
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default MenuCategory