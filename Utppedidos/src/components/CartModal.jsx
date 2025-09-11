// src/components/CartModal.jsx
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'

function CartModal({ isOpen, onClose }) {
  const { cart, clearCart, removeFromCart, getCartTotal } = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [isProcessing, setIsProcessing] = useState(false)

  if (!isOpen) return null

  const handleCheckout = async () => {
    if (cart.length === 0) return

    setIsProcessing(true)
    
    try {
      // Simular procesamiento del pedido
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Crear el pedido
      const newOrder = {
        id: Date.now(),
        items: [...cart],
        total: getCartTotal(),
        estado: 'pendiente',
        fecha: new Date().toISOString(),
        usuario: user.email
      }
      
      // Guardar en localStorage (simulando backend)
      const existingOrders = JSON.parse(localStorage.getItem('utpedidos_orders') || '[]')
      existingOrders.push(newOrder)
      localStorage.setItem('utpedidos_orders', JSON.stringify(existingOrders))
      
      // Limpiar carrito
      clearCart()
      
      // Mostrar mensaje de éxito y redirigir
      alert('¡Pedido realizado con éxito! Puedes ver el estado en la sección de Pedidos.')
      onClose()
      navigate('/pedidos')
      
    } catch (error) {
      console.error('Error al procesar pedido:', error)
      alert('Hubo un error al procesar tu pedido. Por favor intenta de nuevo.')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>🛒 Tu Carrito</h2>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>
        
        <div className="modal-body">
          {cart.length === 0 ? (
            <div className="cart-empty">
              <p>🛒 Tu carrito está vacío</p>
              <p>¡Agrega algunos deliciosos productos desde el menú!</p>
            </div>
          ) : (
            <>
              <div className="cart-items">
                {cart.map((item, index) => (
                  <div key={index} className="cart-item">
                    <div className="cart-item-info">
                      <div className="cart-item-name">{item.nombre}</div>
                      <div className="cart-item-price">
                        ${item.precio.toFixed(2)} 
                        {item.quantity && item.quantity > 1 && 
                          ` x ${item.quantity}`
                        }
                      </div>
                      {item.descripcion && (
                        <div className="cart-item-description">
                          {item.descripcion}
                        </div>
                      )}
                    </div>
                    <button 
                      className="cart-item-remove"
                      onClick={() => removeFromCart(index)}
                      title="Eliminar del carrito"
                    >
                      🗑️
                    </button>
                  </div>
                ))}
              </div>
              
              <div className="cart-total">
                <div className="cart-summary">
                  <p><strong>Total de items:</strong> {cart.length}</p>
                  <p className="total-price">
                    <strong>Total a pagar: ${getCartTotal().toFixed(2)}</strong>
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
        
        <div className="modal-footer">
          {cart.length > 0 && (
            <>
              <button 
                onClick={clearCart}
                className="btn btn-secondary"
                disabled={isProcessing}
              >
                🗑️ Vaciar carrito
              </button>
              
              <button 
                onClick={handleCheckout}
                className={`checkout-btn ${isProcessing ? 'processing' : ''}`}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <span className="loading-spinner"></span>
                    Procesando...
                  </>
                ) : (
                  <>
                    💳 Realizar Pedido
                  </>
                )}
              </button>
            </>
          )}
          
          <button 
            onClick={onClose}
            className="btn btn-secondary"
            disabled={isProcessing}
          >
            {cart.length === 0 ? '🛍️ Ir a comprar' : 'Cerrar'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default CartModal