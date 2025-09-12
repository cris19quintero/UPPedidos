    // src/pages/Pedidos.jsx - Basado en el diseño HTML original
    import React, { useState, useEffect } from 'react';
    import Navbar from '../components/Navbar.jsx';
    import '../styles/Pedidos.css';

    function Pedidos() {
    const [pedidosPendientes, setPedidosPendientes] = useState([]);
    const [pedidosExpirados, setPedidosExpirados] = useState([]);

    useEffect(() => {
        // Cargar pedidos del localStorage
        const savedOrders = localStorage.getItem('utpedidos_orders');
        if (savedOrders) {
        const orders = JSON.parse(savedOrders);
        setPedidosPendientes(orders.filter(p => p.estado === 'pendiente'));
        setPedidosExpirados(orders.filter(p => p.estado === 'expirado'));
        }
    }, []);

    const formatTime = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleTimeString('es-ES', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
        });
    };

    const getCafeteriaName = (items) => {
        if (items && items.length > 0) {
        return items[0].cafeteria || 'Cafetería';
        }
        return 'Cafetería';
    };

    const getPaymentMethod = (total) => {
        // Simular método de pago basado en el total para demo
        return total > 5 ? 'Tarjeta Visa' : 'Efectivo';
    };

    const markAsRetirado = (pedidoId, isPendiente) => {
        if (isPendiente) {
        const updatedPendientes = pedidosPendientes.filter(p => p.id !== pedidoId);
        setPedidosPendientes(updatedPendientes);
        
        // Actualizar localStorage
        const allOrders = [...updatedPendientes, ...pedidosExpirados];
        localStorage.setItem('utpedidos_orders', JSON.stringify(allOrders));
        }
    };

    return (
        <div>
        <Navbar />
        
        <main>
            <div className="pedidos-section">
            <h2>Pedidos por retirar</h2>
            
            <div className="pedidos-container">
                {pedidosPendientes.length === 0 ? (
                <div style={{
                    textAlign: 'center', 
                    padding: '2rem', 
                    color: '#666',
                    fontStyle: 'italic'
                }}>
                    No tienes pedidos pendientes.
                </div>
                ) : (
                pedidosPendientes.map((pedido, index) => (
                    <div key={pedido.id || index} className="pedido-item">
                    <img 
                        src="/imagenes/comida-generica.jpg" 
                        alt={pedido.items?.[0]?.name || 'Pedido'} 
                        className="pedido-img"
                        onError={(e) => {
                        e.target.src = '/imagenes/default-food.jpg';
                        }}
                    />
                    
                    <div className="pedido-info">
                        <div className="pedido-title">
                        <span>{pedido.items?.[0]?.name || 'Pedido sin nombre'}</span>
                        <span className="pedido-quantity">
                            x{pedido.items?.reduce((total, item) => total + (item.quantity || 1), 0) || 1}
                        </span>
                        </div>
                        
                        <div className="pedido-desc">
                        {pedido.items?.[0]?.descripcion || 'Sin descripción'}
                        </div>
                        
                        <div className="pedido-cafeteria">
                        <i className="fas fa-store"></i> {getCafeteriaName(pedido.items)}
                        </div>
                        
                        <div className="pedido-hora">
                        <i className="fas fa-clock"></i> Pedido: {formatTime(pedido.fecha)}
                        </div>
                        
                        <div className="pedido-hora">
                        <i className="fas fa-clock"></i> Recogida: {formatTime(pedido.fecha)} - 
                        {new Date(new Date(pedido.fecha).getTime() + 30*60000).toLocaleTimeString('es-ES', { 
                            hour: '2-digit', 
                            minute: '2-digit',
                            hour12: true 
                        })}
                        </div>
                        
                        <div className="pedido-hora">
                        <i className="fas fa-credit-card"></i> {getPaymentMethod(pedido.total)}
                        </div>
                        
                        <div className="pedido-actions">
                        <span className="pedido-status status-pendiente">
                            Pendiente de retirar
                        </span>
                        <button 
                            className="mark-retirado-btn"
                            onClick={() => markAsRetirado(pedido.id, true)}
                        >
                            <i className="fas fa-check"></i> Marcar como retirado
                        </button>
                        </div>
                    </div>
                    </div>
                ))
                )}
            </div>
            </div>

            <div className="pedidos-section">
            <h2>Pedidos expirados</h2>
            
            <div className="pedidos-container">
                {pedidosExpirados.length === 0 ? (
                <div style={{
                    textAlign: 'center', 
                    padding: '2rem', 
                    color: '#666',
                    fontStyle: 'italic'
                }}>
                    No tienes pedidos expirados.
                </div>
                ) : (
                pedidosExpirados.map((pedido, index) => (
                    <div key={pedido.id || index} className="pedido-item">
                    <img 
                        src="/imagenes/comida-generica.jpg" 
                        alt={pedido.items?.[0]?.name || 'Pedido'} 
                        className="pedido-img"
                        onError={(e) => {
                        e.target.src = '/imagenes/default-food.jpg';
                        }}
                    />
                    
                    <div className="pedido-info">
                        <div className="pedido-title">
                        <span>{pedido.items?.[0]?.name || 'Pedido sin nombre'}</span>
                        <span className="pedido-quantity">
                            x{pedido.items?.reduce((total, item) => total + (item.quantity || 1), 0) || 1}
                        </span>
                        </div>
                        
                        <div className="pedido-desc">
                        {pedido.items?.[0]?.descripcion || 'Sin descripción'}
                        </div>
                        
                        <div className="pedido-cafeteria">
                        <i className="fas fa-store"></i> {getCafeteriaName(pedido.items)}
                        </div>
                        
                        <div className="pedido-hora">
                        <i className="fas fa-clock"></i> Pedido: {formatTime(pedido.fecha)}
                        </div>
                        
                        <div className="pedido-actions">
                        <span className="pedido-status status-expirado">
                            Expirado
                        </span>
                        </div>
                    </div>
                    </div>
                ))
                )}
            </div>
            </div>
        </main>
        </div>
    );
    }

    export default Pedidos;