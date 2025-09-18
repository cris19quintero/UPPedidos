// src/pages/Pedidos.jsx - CON API BACKEND
import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar.jsx';
import { orderService } from '../services/apiService';
import '../styles/Pedidos.css';

function Pedidos() {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('todos'); // todos, pendientes, completados, cancelados

  useEffect(() => {
    loadPedidos();
  }, []);

  const loadPedidos = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await orderService.getUserOrders(filter);
      
      if (response.success) {
        setPedidos(response.data.pedidos || []);
      } else {
        setError(response.message || 'Error al cargar pedidos');
      }
    } catch (error) {
      console.error('Error cargando pedidos:', error);
      setError('Error al conectar con el servidor');
    } finally {
      setLoading(false);
    }
  };

  const cancelarPedido = async (pedidoId) => {
    if (!window.confirm('¿Estás seguro de que quieres cancelar este pedido?')) {
      return;
    }

    try {
      const response = await orderService.cancel(pedidoId);
      
      if (response.success) {
        // Recargar pedidos después de cancelar
        await loadPedidos();
        alert('Pedido cancelado exitosamente');
      } else {
        alert(response.message || 'Error al cancelar pedido');
      }
    } catch (error) {
      console.error('Error cancelando pedido:', error);
      alert('Error al cancelar el pedido');
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    return date.toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const getStatusColor = (estado) => {
    switch (estado?.toLowerCase()) {
      case 'pendiente':
        return 'status-pendiente';
      case 'por retirar':
        return 'status-por-retirar';
      case 'retirado':
      case 'finalizado':
        return 'status-completado';
      case 'cancelado':
        return 'status-cancelado';
      case 'expirado':
        return 'status-expirado';
      default:
        return 'status-pendiente';
    }
  };

  const getStatusText = (estado) => {
    switch (estado?.toLowerCase()) {
      case 'pendiente':
        return '🕐 Pendiente';
      case 'por retirar':
        return '🔔 Listo para retirar';
      case 'retirado':
        return '✅ Retirado';
      case 'finalizado':
        return '✅ Finalizado';
      case 'cancelado':
        return '❌ Cancelado';
      case 'expirado':
        return '⏰ Expirado';
      default:
        return estado || 'Sin estado';
    }
  };

  const filteredPedidos = pedidos.filter(pedido => {
    if (filter === 'todos') return true;
    if (filter === 'pendientes') return ['Pendiente', 'Por Retirar'].includes(pedido.estado);
    if (filter === 'completados') return ['Retirado', 'Finalizado'].includes(pedido.estado);
    if (filter === 'cancelados') return ['Cancelado', 'Expirado'].includes(pedido.estado);
    return true;
  });

  if (loading) {
    return (
      <div>
        <Navbar />
        <main className="pedidos-main">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Cargando pedidos...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <Navbar />
        <main className="pedidos-main">
          <div className="error-container">
            <h2>❌ Error</h2>
            <p>{error}</p>
            <button onClick={loadPedidos} className="retry-btn">
              🔄 Reintentar
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      
      <main className="pedidos-main">
        <div className="pedidos-header">
          <h1>📋 Mis Pedidos</h1>
          
          {/* Filtros */}
          <div className="pedidos-filters">
            <button 
              className={`filter-btn ${filter === 'todos' ? 'active' : ''}`}
              onClick={() => setFilter('todos')}
            >
              Todos ({pedidos.length})
            </button>
            <button 
              className={`filter-btn ${filter === 'pendientes' ? 'active' : ''}`}
              onClick={() => setFilter('pendientes')}
            >
              Pendientes ({pedidos.filter(p => ['Pendiente', 'Por Retirar'].includes(p.estado)).length})
            </button>
            <button 
              className={`filter-btn ${filter === 'completados' ? 'active' : ''}`}
              onClick={() => setFilter('completados')}
            >
              Completados ({pedidos.filter(p => ['Retirado', 'Finalizado'].includes(p.estado)).length})
            </button>
            <button 
              className={`filter-btn ${filter === 'cancelados' ? 'active' : ''}`}
              onClick={() => setFilter('cancelados')}
            >
              Cancelados ({pedidos.filter(p => ['Cancelado', 'Expirado'].includes(p.estado)).length})
            </button>
          </div>
        </div>

        {filteredPedidos.length === 0 ? (
          <div className="empty-pedidos">
            <div className="empty-icon">📦</div>
            <h3>No tienes pedidos {filter === 'todos' ? '' : filter}</h3>
            <p>
              {filter === 'todos' 
                ? 'Cuando hagas tu primer pedido, aparecerá aquí.' 
                : `No hay pedidos ${filter} en este momento.`
              }
            </p>
          </div>
        ) : (
          <div className="pedidos-container">
            {filteredPedidos.map((pedido) => (
              <div key={pedido.id || pedido.id_pedido} className="pedido-card">
                {/* Header del pedido */}
                <div className="pedido-header">
                  <div className="pedido-id">
                    <strong>Pedido #{pedido.id_pedido || pedido.numero_orden}</strong>
                  </div>
                  <div className={`pedido-status ${getStatusColor(pedido.estado)}`}>
                    {getStatusText(pedido.estado)}
                  </div>
                </div>

                {/* Información de la cafetería */}
                <div className="pedido-cafeteria">
                  <i className="fas fa-store"></i>
                  <span>{pedido.cafeteria_nombre || pedido.cafeteria_info?.nombre || 'Cafetería'}</span>
                </div>

                {/* Items del pedido */}
                <div className="pedido-items">
                  {pedido.items && pedido.items.length > 0 ? (
                    <div className="items-list">
                      {pedido.items.slice(0, 3).map((item, index) => (
                        <div key={index} className="item-row">
                          <span className="item-name">{item.nombre}</span>
                          <span className="item-quantity">x{item.cantidad}</span>
                          <span className="item-price">${item.subtotal?.toFixed(2)}</span>
                        </div>
                      ))}
                      {pedido.items.length > 3 && (
                        <div className="items-more">
                          +{pedido.items.length - 3} productos más
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="no-items">Sin items</div>
                  )}
                </div>

                {/* Información del pedido */}
                <div className="pedido-details">
                  <div className="detail-row">
                    <i className="fas fa-clock"></i>
                    <span>Pedido: {formatDateTime(pedido.fecha_pedido)}</span>
                  </div>
                  
                  {pedido.fecha_estimada && (
                    <div className="detail-row">
                      <i className="fas fa-hourglass-half"></i>
                      <span>Estimado: {formatDateTime(pedido.fecha_estimada)}</span>
                    </div>
                  )}

                  <div className="detail-row">
                    <i className="fas fa-credit-card"></i>
                    <span>{pedido.metodo_pago || 'Efectivo'}</span>
                  </div>

                  {pedido.observaciones && (
                    <div className="detail-row">
                      <i className="fas fa-comment"></i>
                      <span>{pedido.observaciones}</span>
                    </div>
                  )}
                </div>

                {/* Footer con total y acciones */}
                <div className="pedido-footer">
                  <div className="pedido-total">
                    <strong>Total: ${pedido.total?.toFixed(2) || '0.00'}</strong>
                  </div>
                  
                  <div className="pedido-actions">
                    {['Pendiente', 'Por Retirar'].includes(pedido.estado) && (
                      <button 
                        className="cancel-btn"
                        onClick={() => cancelarPedido(pedido.id || pedido.id_pedido)}
                      >
                        <i className="fas fa-times"></i>
                        Cancelar
                      </button>
                    )}
                    
                    <button className="details-btn">
                      <i className="fas fa-eye"></i>
                      Ver detalles
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Botón para recargar */}
        <div className="pedidos-actions">
          <button onClick={loadPedidos} className="refresh-btn">
            <i className="fas fa-sync-alt"></i>
            Actualizar pedidos
          </button>
        </div>
      </main>
    </div>
  );
}

export default Pedidos;