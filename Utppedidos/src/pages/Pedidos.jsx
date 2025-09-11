    // src/pages/Pedidos.jsx
    import React, { useState, useEffect } from 'react';
    import Navbar from '../components/Navbar.jsx';
    import '../styles/Pedidos.css';

    function Pedidos() {
    const [pedidosPendientes, setPedidosPendientes] = useState([]);
    const [pedidosExpirados, setPedidosExpirados] = useState([]);

    useEffect(() => {
        // Cargar pedidos del localStorage o API
        const savedOrders = localStorage.getItem('utpedidos_orders');
        if (savedOrders) {
        const orders = JSON.parse(savedOrders);
        setPedidosPendientes(orders.filter(p => p.estado === 'pendiente'));
        setPedidosExpirados(orders.filter(p => p.estado === 'expirado'));
        }
    }, []);

    return (
        <div>
        <Navbar />
        <main className="pedidos-main">
            <h2>Mis Pedidos</h2>
            
            <section className="pedidos-section">
            <h3>Pedidos por retirar</h3>
            <div className="pedidos-container">
                {pedidosPendientes.length === 0 ? (
                <p>No tienes pedidos pendientes.</p>
                ) : (
                pedidosPendientes.map((pedido, index) => (
                    <div key={index} className="pedido-item">
                    <p>Pedido #{pedido.id}</p>
                    <p>Total: ${pedido.total}</p>
                    <p>Estado: {pedido.estado}</p>
                    </div>
                ))
                )}
            </div>
            </section>

            <section className="pedidos-section">
            <h3>Pedidos expirados</h3>
            <div className="pedidos-container">
                {pedidosExpirados.length === 0 ? (
                <p>No tienes pedidos expirados.</p>
                ) : (
                pedidosExpirados.map((pedido, index) => (
                    <div key={index} className="pedido-item">
                    <p>Pedido #{pedido.id}</p>
                    <p>Total: ${pedido.total}</p>
                    <p>Estado: {pedido.estado}</p>
                    </div>
                ))
                )}
            </div>
            </section>
        </main>
        </div>
    );
    }

    export default Pedidos;