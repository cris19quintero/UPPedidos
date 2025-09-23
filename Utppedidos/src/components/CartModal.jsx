// src/components/CartModal.jsx - PRECIOS CORREGIDOS
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import '../styles/CartModal.css';

function CartModal({ isOpen, onClose }) {
  const { cart, clearCart, removeFromCart, getCartTotal, createOrderFromCart, loading } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderOptions, setOrderOptions] = useState({
    metodo_pago: 'efectivo',
    observaciones: '',
    tipo_pedido: 'normal'
  });

  if (!isOpen) return null;

  const handleCheckout = async () => {
    if (cart.length === 0) return;

    setIsProcessing(true);
    try {
      console.log('Iniciando checkout con datos:', orderOptions);
      console.log('Carrito actual:', cart);
      
      const newOrder = await createOrderFromCart({
        ...orderOptions,
        usuario_info: user || { nombre: 'Invitado' }
      });

      alert(`¡Pedido realizado con éxito!
📧 Confirmación enviada.
📍 Retira en la cafetería.
⏱️ Tiempo estimado: 15-20 min`);

      onClose();
      navigate('/pedidos');
    } catch (error) {
      console.error('Error en checkout:', error);
      alert(`Error al procesar el pedido: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleInputChange = (e) => {
    setOrderOptions({ ...orderOptions, [e.target.name]: e.target.value });
  };

  const getEstimatedTime = () => {
    if (cart.length === 0) return 0;
    const totalTime = cart.reduce((sum, item) => sum + (item.tiempo_preparacion || 10) * (item.cantidad || 1), 0);
    return Math.max(10, Math.min(totalTime, 30));
  };

  const estimatedTime = getEstimatedTime();

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>🛒 Tu Carrito</h2>
          <button className="close-btn" onClick={onClose}>×</button>
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
                  <div key={item.id_item || item.id_carrito || index} className="cart-item">
                    <div className="cart-item-info">
                      <div className="cart-item-name">{item.nombre}</div>
                      <div className="cart-item-price">
                        ${(item.precio_unitario || item.precio || 0).toFixed(2)}
                        {item.cantidad && item.cantidad > 1 && 
                          ` x ${item.cantidad} = $${((item.precio_unitario || item.precio || 0) * item.cantidad).toFixed(2)}`
                        }
                      </div>
                      {item.descripcion && <div className="cart-item-description">{item.descripcion}</div>}
                      <div className="cart-item-meta">
                        <span className="item-category">{item.categoria || 'Sin categoría'}</span>
                        {item.tiempo_preparacion && <span className="item-time">⏱️ {item.tiempo_preparacion}min</span>}
                      </div>
                    </div>
                    <button 
                      className="cart-item-remove"
                      onClick={() => removeFromCart(item.id_producto)}
                      disabled={isProcessing}
                    >
                      🗑️
                    </button>
                  </div>
                ))}
              </div>

              <div className="cart-total">
                <div className="cart-summary">
                  <p><strong>Total de items:</strong> {cart.length}</p>
                  <p><strong>Cantidad total:</strong> {cart.reduce((sum, item) => sum + (item.cantidad || 1), 0)}</p>
                  {orderOptions.tipo_pedido === 'express' && <p><strong>Cargo express:</strong> $1.00</p>}
                  <p className="total-price"><strong>Total a pagar: ${(getCartTotal() + (orderOptions.tipo_pedido === 'express' ? 1 : 0)).toFixed(2)}</strong></p>
                  <p className="estimated-time"><strong>⏱️ Tiempo estimado: {estimatedTime} minutos</strong></p>
                </div>
              </div>

              <div className="order-options">
                <div className="option-group">
                  <label htmlFor="metodo_pago">Método de pago:</label>
                  <select id="metodo_pago" name="metodo_pago" value={orderOptions.metodo_pago} onChange={handleInputChange} disabled={isProcessing}>
                    <option value="efectivo">💵 Efectivo</option>
                    <option value="tarjeta">💳 Tarjeta</option>
                    <option value="transferencia">📱 Transferencia</option>
                  </select>
                </div>

                <div className="option-group">
                  <label htmlFor="tipo_pedido">Tipo de pedido:</label>
                  <select id="tipo_pedido" name="tipo_pedido" value={orderOptions.tipo_pedido} onChange={handleInputChange} disabled={isProcessing}>
                    <option value="normal">🍽️ Normal</option>
                    <option value="express">⚡Para llevar (+$1.00)</option>
                  </select>
                </div>

                <div className="option-group">
                  <label htmlFor="observaciones">Observaciones (opcional):</label>
                  <textarea id="observaciones" name="observaciones" value={orderOptions.observaciones} onChange={handleInputChange} rows="2" disabled={isProcessing} placeholder="Ej: Sin cebolla, extra salsa..." />
                </div>
              </div>
            </>
          )}
        </div>

        <div className="modal-footer">
          {cart.length > 0 && (
            <>
              <button onClick={clearCart} className="btn btn-secondary" disabled={isProcessing}>🗑️ Vaciar carrito</button>
              <button onClick={handleCheckout} className={`checkout-btn ${isProcessing ? 'processing' : ''}`} disabled={isProcessing || loading}>
                {isProcessing || loading ? <>Procesando...</> : <>💳 Realizar Pedido</>}
              </button>
            </>
          )}
          <button onClick={onClose} className="btn btn-secondary" disabled={isProcessing}>
            {cart.length === 0 ? '🛍️ Ir a comprar' : 'Cerrar'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default CartModal;