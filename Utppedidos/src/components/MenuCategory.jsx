import React, { useState } from 'react'
import { useCart } from '../context/CartContext'


function MenuCategory({ categoria, items, cafeteriaId, isOpen = true }) {
  const { addToCart } = useCart()
  const [addingItems, setAddingItems] = useState({})
  const [toast, setToast] = useState({ show: false, message: '' })

  const showToast = (message) => {
    setToast({ show: true, message })
    setTimeout(() => {
      setToast({ show: false, message: '' })
    }, 3000)
  }

  const handleAddToCart = async (item) => {
    if (!isOpen) {
      alert('Esta cafetería está cerrada en este momento.')
      return
    }

    const itemKey = `${cafeteriaId}-${item.id || item.nombre}`
    
    if (addingItems[itemKey]) return
    
    setAddingItems(prev => ({ ...prev, [itemKey]: true }))
    
    try {
      const cafeteriaInfo = dataService.getCafeteriaById(cafeteriaId)
      
      const itemWithExtras = {
        ...item,
        cafeteriaId: cafeteriaId,
        cafeteria: cafeteriaInfo?.nombre || `Cafetería ${cafeteriaId}`,
        categoria: categoria,
        timestamp: new Date().toISOString(),
        quantity: 1,
        precio_unitario: item.precio || 0,
        subtotal: item.precio || 0
      }
      
      await addToCart(itemWithExtras)
      
      // Mostrar toast con el nombre del producto
      showToast(`${item.nombre} añadido al carrito`)
      
      setTimeout(() => {
        setAddingItems(prev => ({ ...prev, [itemKey]: false }))
      }, 1000)
      
    } catch (error) {
      console.error('Error al agregar al carrito:', error)
      showToast('Error al agregar el item al carrito')
      setAddingItems(prev => ({ ...prev, [itemKey]: false }))
    }
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
    <>
      {/* Toast Notification */}
      {toast.show && (
        <div className="toast-notification">
          <div className="toast-content">
            <div className="toast-icon">✓</div>
            <span className="toast-message">{toast.message}</span>
          </div>
        </div>
      )}

      <div className="menu-category">
        <h3>{categoria}</h3>
        <div className="menu-items">
          {items.map((item, index) => {
            const itemKey = `${cafeteriaId}-${item.id || item.nombre}`
            const isAdding = addingItems[itemKey]
            const available = item.disponible !== false && isOpen
            
            return (
              <div 
                key={item.id || index} 
                className={`menu-item ${!available ? 'unavailable' : ''}`}
              >
                <div className="menu-item-image">
                  {item.imagen ? (
                    <img 
                      src={item.imagen} 
                      alt={item.nombre}
                      onError={(e) => {
                        e.target.src = '/imagenes/default-food.jpg'
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
                    <p>{item.descripcion}</p>
                  )}
                  
                  <div className="price-add">
                    <span className="price">${(item.precio || 0).toFixed(2)}</span>
                    
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
            )
          })}
        </div>
      </div>
    </>
  )
}

export default MenuCategory