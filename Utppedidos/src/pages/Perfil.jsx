// src/pages/Perfil.jsx - Versión limpia y corregida
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import dataService from '../services/dataService';
import { initializeSampleOrdersIfEmpty } from '../services/sampleOrdersData';
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

    const [orderStats, setOrderStats] = useState({
        total_pedidos: 0,
        pedidos_completados: 0,
        pedidos_pendientes: 0,
        total_gastado: 0,
        cafeteria_favorita: null,
        ultimo_pedido: null
    });

    const [recentOrders, setRecentOrders] = useState([]);
    const [completedOrders, setCompletedOrders] = useState([]);
    const [isExporting, setIsExporting] = useState(false);

    useEffect(() => {
        loadUserData();
        loadOrderData();
    }, [user]);

    const loadUserData = () => {
        const profile = dataService.getUserProfile();
        if (profile) {
            setFormData({
                nombre: profile.nombre || '',
                apellido: profile.apellido || '',
                email: profile.email || profile.correo_electronico || '',
                telefono: profile.telefono || '',
                facultad: profile.facultad || '',
                edificio: profile.edificio || ''
            });
        } else if (user) {
            setFormData({
                nombre: user.nombre || '',
                apellido: user.apellido || '',
                email: user.email || user.correo_electronico || '',
                telefono: user.telefono || '',
                facultad: user.facultad || '',
                edificio: user.edificio || ''
            });
        }
    };

    const loadOrderData = () => {
        try {
            const userEmail = user?.email || formData.email;
            if (userEmail) {
                dataService.initializeSampleOrdersIfEmpty(userEmail);
                
                const stats = dataService.getUserOrderStats(userEmail);
                setOrderStats(stats);

                const allOrders = dataService.getOrders(userEmail);
                
                const recent = allOrders
                    .filter(order => order.estado === 'pendiente' || order.estado === 'en_proceso')
                    .slice(-5)
                    .reverse();
                
                const completed = allOrders
                    .filter(order => order.estado === 'completado' || order.estado === 'retirado')
                    .slice(-10)
                    .reverse();

                setRecentOrders(recent);
                setCompletedOrders(completed);

                console.log('Estadísticas cargadas:', stats);
                console.log('Pedidos recientes:', recent);
                console.log('Pedidos completados:', completed);
            }
        } catch (error) {
            console.error('Error al cargar datos de pedidos:', error);
        }
    };

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        try {
            const updatedProfile = dataService.saveUserProfile(formData);
            
            if (updatedProfile) {
                alert('Perfil actualizado correctamente');
                console.log('Perfil actualizado:', updatedProfile);
            } else {
                alert('Error al actualizar el perfil');
            }
        } catch (error) {
            console.error('Error al guardar perfil:', error);
            alert('Error al actualizar el perfil: ' + error.message);
        }
    };

    const handleLogout = () => {
        if (window.confirm('¿Estás seguro de que deseas cerrar sesión?')) {
            logout();
            navigate('/login');
        }
    };

    const handleExportData = async () => {
        setIsExporting(true);
        try {
            dataService.exportData();
            alert('Tus datos han sido exportados exitosamente');
        } catch (error) {
            console.error('Error al exportar datos:', error);
            alert('Error al exportar datos: ' + error.message);
        } finally {
            setIsExporting(false);
        }
    };

    const handleMarkAsCompleted = (orderId) => {
        try {
            const updatedOrder = dataService.updateOrderStatus(orderId, 'completado');
            if (updatedOrder) {
                alert(`Pedido #${updatedOrder.numero_orden} marcado como completado`);
                loadOrderData();
            }
        } catch (error) {
            console.error('Error al actualizar pedido:', error);
            alert('Error al actualizar el pedido');
        }
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
        } else if (formData.email) {
            const emailName = formData.email.split('@')[0];
            return emailName.split('.').map(part => 
                part.charAt(0).toUpperCase() + part.slice(1)
            ).join(' ');
        }
        return 'Usuario';
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusIcon = (status) => {
        const icons = {
            'pendiente': '🕐',
            'en_proceso': '👨‍🍳',
            'listo': '✅',
            'completado': '🎉',
            'retirado': '📦',
            'cancelado': '❌',
            'expirado': '⏰'
        };
        return icons[status] || '❓';
    };

    const getStatusText = (status) => {
        const texts = {
            'pendiente': 'Pendiente',
            'en_proceso': 'En proceso',
            'listo': 'Listo para retirar',
            'completado': 'Completado',
            'retirado': 'Retirado',
            'cancelado': 'Cancelado',
            'expirado': 'Expirado'
        };
        return texts[status] || status;
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
                    {/* Header del perfil con estadísticas */}
                    <div className="profile-header">
                        <div className="profile-avatar">
                            {getInitials()}
                        </div>
                        <div className="profile-info">
                            <h2>{getFullName()}</h2>
                            <p>{formData.email}</p>
                            
                            {/* Estadísticas rápidas */}
                            <div className="quick-stats">
                                <div className="stat-item">
                                    <span className="stat-number">{orderStats.total_pedidos}</span>
                                    <span className="stat-label">Pedidos totales</span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-number">${orderStats.total_gastado.toFixed(2)}</span>
                                    <span className="stat-label">Total gastado</span>
                                </div>
                                {orderStats.cafeteria_favorita && (
                                    <div className="stat-item">
                                        <span className="stat-number">{orderStats.cafeteria_favorita.nombre}</span>
                                        <span className="stat-label">Cafetería favorita</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    
                    {/* Formulario de perfil */}
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
                            <select
                                id="facultad"
                                name="facultad"
                                value={formData.facultad}
                                onChange={handleInputChange}
                            >
                                <option value="">Selecciona tu facultad</option>
                                <option value="ingenieria">Facultad de Ingeniería</option>
                                <option value="medicina">Facultad de Medicina</option>
                                <option value="economia">Facultad de Economía</option>
                                <option value="derecho">Facultad de Derecho</option>
                                <option value="educacion">Facultad de Educación</option>
                                <option value="humanidades">Facultad de Humanidades</option>
                            </select>
                        </div>
                        
                        <div className="form-group">
                            <label htmlFor="edificio">Edificio actual</label>
                            <select
                                id="edificio"
                                name="edificio"
                                value={formData.edificio}
                                onChange={handleInputChange}
                            >
                                <option value="">Selecciona un edificio</option>
                                <option value="edificio1">Edificio No. 1</option>
                                <option value="central">Central</option>
                                <option value="edificio3">Edificio No. 3</option>
                                <option value="biblioteca">Biblioteca</option>
                            </select>
                        </div>
                        
                        <div className="form-actions">
                            <button 
                                type="button" 
                                onClick={handleExportData}
                                className="btn btn-info"
                                disabled={isExporting}
                            >
                                {isExporting ? 'Exportando...' : 'Exportar mis datos'}
                            </button>
                            
                            <button type="button" onClick={handleLogout} className="btn btn-secondary">
                                Cerrar sesión
                            </button>
                            
                            <button type="submit" className="btn btn-primary">
                                Guardar cambios
                            </button>
                        </div>
                    </form>
                    
                    {/* Historial de pedidos recientes */}
                    <div className="order-history">
                        <h3>Pedidos recientes ({recentOrders.length})</h3>
                        <div className="orders-container">
                            {recentOrders.length === 0 ? (
                                <div className="no-orders">
                                    <div className="no-orders-icon">🛒</div>
                                    <p>No tienes pedidos pendientes.</p>
                                    <p className="no-orders-subtitle">¡Haz tu primer pedido desde el menú!</p>
                                    <button 
                                        className="btn btn-primary"
                                        onClick={() => navigate('/menu')}
                                    >
                                        Ver Menú
                                    </button>
                                </div>
                            ) : (
                                recentOrders.map((order) => (
                                    <div key={order.id} className="order-card recent">
                                        <div className="order-header">
                                            <div>
                                                <strong>Pedido #{order.numero_orden || order.id}</strong>
                                                <span className="order-status">
                                                    {getStatusIcon(order.estado)} {getStatusText(order.estado)}
                                                </span>
                                            </div>
                                            <span className="order-price">${(order.total || 0).toFixed(2)}</span>
                                        </div>
                                        
                                        <div className="order-details">
                                            <p><strong>Fecha:</strong> {formatDate(order.fecha)}</p>
                                            {order.cafeteria_info && (
                                                <p><strong>Cafetería:</strong> {order.cafeteria_info.nombre}</p>
                                            )}
                                            <p><strong>Items:</strong> {order.items?.length || 0}</p>
                                            
                                            {order.items && order.items.length > 0 && (
                                                <details className="order-items-details">
                                                    <summary>Ver items ({order.items.length})</summary>
                                                    <ul>
                                                        {order.items.map((item, itemIndex) => (
                                                            <li key={itemIndex}>
                                                                {item.nombre} - ${(item.precio || 0).toFixed(2)}
                                                                {item.quantity > 1 && ` (x${item.quantity})`}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </details>
                                            )}
                                            
                                            {order.estado === 'pendiente' && (
                                                <button 
                                                    onClick={() => handleMarkAsCompleted(order.id)}
                                                    className="btn btn-success btn-sm"
                                                >
                                                    Marcar como completado
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Pedidos completados */}
                    <div className="completed-orders-section">
                        <h3>Pedidos completados ({completedOrders.length})</h3>
                        <div className="completed-orders-container">
                            {completedOrders.length === 0 ? (
                                <div className="no-orders">
                                    <div className="no-orders-icon">📦</div>
                                    <p>No tienes pedidos completados aún.</p>
                                    <p className="no-orders-subtitle">Tus pedidos completados aparecerán aquí.</p>
                                </div>
                            ) : (
                                completedOrders.map((order) => (
                                    <div key={order.id} className="order-card completed">
                                        <div className="completed-header">
                                            <div className="completed-info">
                                                <strong>Pedido #{order.numero_orden || order.id}</strong>
                                                <span className="completion-date">
                                                    Completado: {formatDate(order.fecha_completado || order.fecha_actualizacion || order.fecha)}
                                                </span>
                                            </div>
                                            <span className="order-price completed-price">
                                                ${(order.total || 0).toFixed(2)}
                                            </span>
                                        </div>
                                        
                                        <div className="completed-details">
                                            <div className="items-summary">
                                                {order.items && order.items.length > 0 ? (
                                                    <>
                                                        <p><strong>Items:</strong> {order.items.map(item => 
                                                            `${item.nombre} (x${item.quantity || 1})`
                                                        ).join(', ')}</p>
                                                        <p><strong>Cafetería:</strong> {order.cafeteria_info?.nombre || 'N/A'}</p>
                                                        {order.metodo_pago && (
                                                            <p><strong>Método de pago:</strong> {order.metodo_pago}</p>
                                                        )}
                                                    </>
                                                ) : (
                                                    <p>Sin detalles de items disponibles</p>
                                                )}
                                            </div>
                                            
                                            <div className="completion-status">
                                                <span className="status-badge">
                                                    <i className="fas fa-check-circle"></i>
                                                    Completado
                                                </span>
                                            </div>
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