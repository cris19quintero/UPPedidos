// src/pages/Perfil.jsx - Actualizado con diseño del HTML original
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import '../styles/Perfil.css';

function Perfil() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    
    const [formData, setFormData] = useState({
        nombre: '',
        apellido: '',
        email: '',
        telefono: '',
        facultad: '',
        edificio: ''
    });

    const [orders, setOrders] = useState([]);

    useEffect(() => {
        if (user) {
            setFormData({
                nombre: user.nombre || '',
                apellido: user.apellido || '',
                email: user.email || '',
                telefono: user.telefono || '',
                facultad: user.facultad || '',
                edificio: user.edificio || ''
            });
        }

        // Cargar historial de pedidos
        const savedOrders = localStorage.getItem('utpedidos_orders');
        if (savedOrders) {
            setOrders(JSON.parse(savedOrders));
        }
    }, [user]);

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // Guardar cambios
        const updatedUser = { ...user, ...formData };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        alert('Perfil actualizado correctamente');
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const getInitials = () => {
        if (formData.nombre && formData.apellido) {
            return (formData.nombre.charAt(0) + formData.apellido.charAt(0)).toUpperCase();
        } else if (formData.email) {
            return formData.email.charAt(0).toUpperCase();
        }
        return 'U';
    };

    const getFullName = () => {
        if (formData.nombre && formData.apellido) {
            return `${formData.nombre} ${formData.apellido}`;
        } else if (formData.nombre) {
            return formData.nombre;
        }
        return 'Usuario';
    };

    return (
        <div>
            <Navbar />
            
            <button 
                className="back-button" 
                onClick={() => navigate('/menu')}
            >
                <i className="fas fa-arrow-left"></i> Volver a cafeterías
            </button>

            <main>
                <div className="profile-container">
                    <div className="profile-header">
                        <div className="profile-avatar">
                            {getInitials()}
                        </div>
                        <div className="profile-info">
                            <h2>{getFullName()}</h2>
                            <p>{formData.email}</p>
                        </div>
                    </div>
                    
                    <form onSubmit={handleSubmit} className="profile-form">
                        <div className="form-group">
                            <label htmlFor="nombre">Nombre</label>
                            <input
                                type="text"
                                id="nombre"
                                name="nombre"
                                value={formData.nombre}
                                onChange={handleInputChange}
                                placeholder="Tu nombre"
                            />
                        </div>
                        
                        <div className="form-group">
                            <label htmlFor="apellido">Apellido</label>
                            <input
                                type="text"
                                id="apellido"
                                name="apellido"
                                value={formData.apellido}
                                onChange={handleInputChange}
                                placeholder="Tu apellido"
                            />
                        </div>
                        
                        <div className="form-group">
                            <label htmlFor="email">Correo electrónico</label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                placeholder="tu.correo@utp.ac.pa"
                                readOnly
                            />
                        </div>
                        
                        <div className="form-group">
                            <label htmlFor="telefono">Teléfono</label>
                            <input
                                type="tel"
                                id="telefono"
                                name="telefono"
                                value={formData.telefono}
                                onChange={handleInputChange}
                                placeholder="6XXX-XXXX"
                            />
                        </div>
                        
                        <div className="form-group">
                            <label htmlFor="facultad">Facultad</label>
                            <input
                                type="text"
                                id="facultad"
                                name="facultad"
                                value={formData.facultad}
                                onChange={handleInputChange}
                                placeholder="Tu facultad"
                            />
                        </div>
                        
                        <div className="form-group">
                            <label htmlFor="edificio">Edificio habitual</label>
                            <input
                                type="text"
                                id="edificio"
                                name="edificio"
                                value={formData.edificio}
                                onChange={handleInputChange}
                                placeholder="Edificio donde sueles estar"
                            />
                        </div>
                        
                        <div className="form-actions">
                            <button type="button" onClick={handleLogout} className="btn btn-secondary">
                                Cerrar sesión
                            </button>
                            <button type="submit" className="btn btn-primary">
                                Guardar cambios
                            </button>
                        </div>
                    </form>
                    
                    <div className="order-history">
                        <h3>Historial de pedidos recientes</h3>
                        <div className="orders-container">
                            {orders.length === 0 ? (
                                <p className="no-orders">No tienes pedidos registrados aún.</p>
                            ) : (
                                orders.slice(-3).reverse().map((order, index) => (
                                    <div key={order.id || index} className="order-card recent">
                                        <div className="order-header">
                                            <strong>Pedido #{order.id}</strong>
                                            <span className="order-price">${order.total ? order.total.toFixed(2) : '0.00'}</span>
                                        </div>
                                        <div className="order-details">
                                            <p><strong>Estado:</strong> <span className={`status-${order.estado}`}>{order.estado || 'Pendiente'}</span></p>
                                            <p><strong>Fecha:</strong> {order.fecha ? new Date(order.fecha).toLocaleDateString() : 'N/A'}</p>
                                            {order.items && order.items.length > 0 && (
                                                <details className="order-items-details">
                                                    <summary>Ver items ({order.items.length})</summary>
                                                    <ul>
                                                        {order.items.map((item, itemIndex) => (
                                                            <li key={itemIndex}>
                                                                {item.name || item.nombre} - ${(item.price || item.precio || 0).toFixed(2)}
                                                                {item.quantity > 1 && ` (x${item.quantity})`}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </details>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="completed-orders-section">
                        <h3>Pedidos Realizados</h3>
                        <div className="completed-orders-container">
                            {completedOrders.length === 0 ? (
                                <p className="no-orders">No tienes pedidos completados aún.</p>
                            ) : (
                                completedOrders.slice(-5).reverse().map((order, index) => (
                                    <div key={`completed-${order.id || index}`} className="order-card completed">
                                        <div className="completed-header">
                                            <div className="completed-info">
                                                <strong>Pedido #{order.id}</strong>
                                                <span className="completion-date">
                                                    Completado: {order.fechaCompletado ? 
                                                        new Date(order.fechaCompletado).toLocaleDateString() : 
                                                        new Date(order.fecha).toLocaleDateString()
                                                    }
                                                </span>
                                            </div>
                                            <span className="order-price completed-price">${order.total ? order.total.toFixed(2) : '0.00'}</span>
                                        </div>
                                        
                                        <div className="completed-details">
                                            {order.items && order.items.length > 0 ? (
                                                <>
                                                    <p><strong>Items:</strong> {order.items.map(item => 
                                                        `${item.name || item.nombre} (x${item.quantity || 1})`
                                                    ).join(', ')}</p>
                                                    <p><strong>Cafetería:</strong> {order.items[0].cafeteria || 'N/A'}</p>
                                                </>
                                            ) : (
                                                <p>Sin detalles de items</p>
                                            )}
                                            <span className="status-badge">
                                                <i className="fas fa-check-circle"></i>
                                                Completado
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default Perfil;