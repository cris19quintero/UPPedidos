// src/pages/Perfil.jsx - Limpio para Backend API
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
        correo: '',
        telefono: '',
        facultad: '',
        edificio_habitual: '',
        carrera: '',
        semestre: '',
        cedula: ''
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
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (user?.uid) {
            loadUserData();
        }
    }, [user]);

    const loadUserData = async () => {
        setLoading(true);
        setError(null);

        try {
            // Cargar datos desde backend API
            const userData = await backendAPI.getUserById(user.uid);
            if (userData) {
                setFormData({
                    nombre: userData.nombre || '',
                    apellido: userData.apellido || '',
                    correo: userData.correo || user.email || '',
                    telefono: userData.telefono || '',
                    facultad: userData.facultad || '',
                    edificio_habitual: userData.edificio_habitual || '',
                    carrera: userData.carrera || '',
                    semestre: userData.semestre || '',
                    cedula: userData.cedula || ''
                });

                if (userData.estadisticas) {
                    setOrderStats(userData.estadisticas);
                }
            }

            // Cargar pedidos del usuario
            await loadUserOrders(user.uid);
        } catch (error) {
            console.error('Error cargando datos de usuario:', error);
            setError('Error cargando los datos del perfil');
        } finally {
            setLoading(false);
        }
    };

    const loadUserOrders = async (userId) => {
        try {
            const pedidos = await backendAPI.getPedidosByUser(userId);
            
            if (pedidos && Array.isArray(pedidos)) {
                const recientes = pedidos
                    .filter(p => ['Pendiente', 'Por Retirar'].includes(p.estado))
                    .slice(0, 5);
                
                const completados = pedidos
                    .filter(p => ['Retirado', 'Finalizado'].includes(p.estado))
                    .slice(0, 10);

                setRecentOrders(recientes);
                setCompletedOrders(completados);

                const stats = {
                    total_pedidos: pedidos.length,
                    pedidos_completados: completados.length,
                    pedidos_pendientes: recientes.length,
                    total_gastado: completados.reduce((sum, p) => sum + (p.total || 0), 0),
                    ultimo_pedido: pedidos.length > 0 ? pedidos[0] : null,
                    cafeteria_favorita: getCafeteriaFavorita(pedidos)
                };
                
                setOrderStats(stats);
            }
        } catch (error) {
            console.error('No se pudieron cargar pedidos desde API:', error.message);
            setError('Error cargando los pedidos del usuario');
        }
    };

    const getCafeteriaFavorita = (pedidos) => {
        if (!pedidos || pedidos.length === 0) return null;
        
        const conteo = {};
        pedidos.forEach(pedido => {
            const cafeteriaId = pedido.id_cafeteria;
            conteo[cafeteriaId] = (conteo[cafeteriaId] || 0) + 1;
        });
        
        const favorita = Object.keys(conteo).reduce((a, b) => 
            conteo[a] > conteo[b] ? a : b
        );
        
        const cafeteriaNames = {
            1: 'Cafetería Edificio 1',
            2: 'Cafetería Central', 
            3: 'Cafetería Edificio 3'
        };
        
        return { nombre: cafeteriaNames[favorita] || `Cafetería ${favorita}` };
    };

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError(null);

        const userData = {
            ...formData,
            uid: user.uid,
            activo: true,
            fecha_actualizacion: new Date().toISOString(),
            estadisticas: orderStats
        };

        try {
            try {
                await backendAPI.updateUser(user.uid, userData);
                alert('¡Perfil actualizado correctamente!');
            } catch (apiError) {
                if (apiError.message.includes('404') || apiError.message.includes('not found')) {
                    await backendAPI.createUser(userData);
                    alert('¡Perfil creado correctamente!');
                } else {
                    throw apiError;
                }
            }
        } catch (error) {
            console.error('Error guardando perfil:', error);
            setError('Error al guardar el perfil. Verifique su conexión.');
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = () => {
        if (window.confirm('¿Estás seguro de que deseas cerrar sesión?')) {
            logout();
            navigate('/login');
        }
    };

    const handleMarkAsCompleted = async (orderId) => {
        try {
            await backendAPI.updatePedidoStatus(orderId, 'Finalizado');
            alert(`Pedido #${orderId} marcado como finalizado`);
            await loadUserOrders(user.uid);
        } catch (error) {
            console.error('Error actualizando pedido:', error);
            alert('Error al actualizar el pedido. Verifique su conexión.');
        }
    };

    const getInitials = () => {
        if (formData.nombre && formData.apellido) {
            return (formData.nombre.charAt(0) + formData.apellido.charAt(0)).toUpperCase();
        } else if (formData.correo) {
            return formData.correo.charAt(0).toUpperCase();
        }
        return 'U';
    };

    const getFullName = () => {
        if (formData.nombre && formData.apellido) {
            return `${formData.nombre} ${formData.apellido}`;
        } else if (formData.nombre) {
            return formData.nombre;
        } else if (formData.correo) {
            const emailName = formData.correo.split('@')[0];
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
            'Pendiente': '🕐',
            'Por Retirar': '✅',
            'Retirado': '📦',
            'Finalizado': '🎉',
            'Cancelado': '❌',
            'Expirado': '⏰'
        };
        return icons[status] || '❓';
    };

    const getStatusText = (status) => {
        const texts = {
            'Pendiente': 'Pendiente',
            'Por Retirar': 'Listo para retirar',
            'Retirado': 'Retirado',
            'Finalizado': 'Finalizado',
            'Cancelado': 'Cancelado',
            'Expirado': 'Expirado'
        };
        return texts[status] || status;
    };

    if (loading) {
        return (
            <div>
                <Navbar />
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>Cargando perfil...</p>
                </div>
            </div>
        );
    }

    return (
        <div>
            <Navbar />
            
            <button className="back-button" onClick={() => navigate('/menu')}>
                <i className="fas fa-arrow-left"></i> Volver a cafeterías
            </button>

            <main>
                <div className="profile-container">
                    {error && <div className="error-message"><i className="fas fa-exclamation-triangle"></i>{error}</div>}

                    <div className="profile-header">
                        <div className="profile-avatar">{getInitials()}</div>
                        <div className="profile-info">
                            <h2>{getFullName()}</h2>
                            <p>{formData.correo}</p>
                            {formData.carrera && <p className="career-info">{formData.carrera} - Semestre {formData.semestre}</p>}
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

                    <form onSubmit={handleSubmit} className="profile-form">
                        {/* Nombre y Apellido */}
                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="nombre">Nombre *</label>
                                <input type="text" id="nombre" name="nombre" value={formData.nombre} onChange={handleInputChange} required />
                            </div>
                            <div className="form-group">
                                <label htmlFor="apellido">Apellido *</label>
                                <input type="text" id="apellido" name="apellido" value={formData.apellido} onChange={handleInputChange} required />
                            </div>
                        </div>

                        {/* Correo y Teléfono */}
                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="correo">Correo electrónico</label>
                                <input type="email" id="correo" name="correo" value={formData.correo} readOnly className="readonly-input" />
                            </div>
                            <div className="form-group">
                                <label htmlFor="telefono">Teléfono</label>
                                <input type="tel" id="telefono" name="telefono" value={formData.telefono} onChange={handleInputChange} />
                            </div>
                        </div>

                        {/* Semestre y Cédula */}
                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="semestre">Semestre</label>
                                <select id="semestre" name="semestre" value={formData.semestre} onChange={handleInputChange}>
                                    <option value="">Selecciona tu semestre</option>
                                    {[...Array(12)].map((_, i) => <option key={i+1} value={i+1}>{i+1}° Semestre</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label htmlFor="cedula">Cédula</label>
                                <input type="text" id="cedula" name="cedula" value={formData.cedula} onChange={handleInputChange} />
                            </div>
                        </div>

                        {/* Facultad y Edificio */}
                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="facultad">Facultad</label>
                                <select id="facultad" name="facultad" value={formData.facultad} onChange={handleInputChange}>
                                    <option value="">Selecciona tu facultad</option>
                                    <option value="FCT">FCT</option>
                                    <option value="FIC">FIC</option>
                                    <option value="FIE">FIE</option>
                                    <option value="FII">FII</option>
                                    <option value="FIM">FIM</option>
                                    <option value="FISC">FISC</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label htmlFor="edificio_habitual">Edificio habitual</label>
                                <select id="edificio_habitual" name="edificio_habitual" value={formData.edificio_habitual} onChange={handleInputChange}>
                                    <option value="">Selecciona un edificio</option>
                                    <option value="Edificio 1">Edificio 1</option>
                                    <option value="Cafetería Central">Central</option>
                                    <option value="Edificio 3">Edificio 3</option>
                                </select>
                            </div>
                        </div>

                        {/* Carrera */}
                        <div className="form-group">
                            <label htmlFor="carrera">Carrera</label>
                            <input type="text" id="carrera" name="carrera" value={formData.carrera} onChange={handleInputChange} />
                        </div>

                        <div className="form-actions">
                            <button type="button" onClick={handleLogout} className="btn btn-secondary" disabled={saving}>Cerrar sesión</button>
                            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Guardando...' : 'Guardar cambios'}</button>
                        </div>
                    </form>

                    {/* Pedidos recientes */}
                    <div className="order-history">
                        <h3>Pedidos recientes ({recentOrders.length})</h3>
                        <div className="orders-container">
                            {recentOrders.length === 0 ? (
                                <div className="no-orders">
                                    <div className="no-orders-icon">🛒</div>
                                    <p>No tienes pedidos pendientes.</p>
                                    <button className="btn btn-primary" onClick={() => navigate('/menu')}>Ver Menú</button>
                                </div>
                            ) : recentOrders.map(order => (
                                <div key={order.id} className="order-card recent">
                                    <div className="order-header">
                                        <div><strong>Pedido #{order.id}</strong> <span className="order-status">{getStatusIcon(order.estado)} {getStatusText(order.estado)}</span></div>
                                        <span className="order-price">${(order.total || 0).toFixed(2)}</span>
                                    </div>
                                    <div className="order-details">
                                        <p><strong>Fecha:</strong> {formatDate(order.fecha_pedido || order.fecha)}</p>
                                        <p><strong>Cafetería:</strong> Cafetería {order.id_cafeteria}</p>
                                        <p><strong>Items:</strong> {order.items?.length || 0}</p>
                                        {order.items && order.items.length > 0 && (
                                            <details className="order-items-details">
                                                <summary>Ver items ({order.items.length})</summary>
                                                <ul>
                                                    {order.items.map((item, idx) => <li key={idx}>{item.nombre} - ${(item.precio_unitario || item.precio || 0).toFixed(2)}{item.cantidad > 1 ? ` (x${item.cantidad})` : ''}</li>)}
                                                </ul>
                                            </details>
                                        )}
                                        {order.estado === 'Pendiente' && <button onClick={() => handleMarkAsCompleted(order.id)} className="btn btn-success btn-sm">Marcar como finalizado</button>}
                                    </div>
                                </div>
                            ))}
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
                                </div>
                            ) : completedOrders.map(order => (
                                <div key={order.id} className="order-card completed">
                                    <div className="completed-header">
                                        <div className="completed-info">
                                            <strong>Pedido #{order.id_pedido || order.numero_orden || order.id}</strong>
                                            <span className="completion-date">Completado: {formatDate(order.fecha_actualizacion || order.fecha)}</span>
                                        </div>
                                        <span className="order-price completed-price">${(order.total || 0).toFixed(2)}</span>
                                    </div>
                                    <div className="completed-details">
                                        <div className="items-summary">
                                            {order.items && order.items.length > 0 ? (
                                                <>
                                                    <p><strong>Items:</strong> {order.items.map(item => `${item.nombre} (x${item.cantidad || 1})`).join(', ')}</p>
                                                    <p><strong>Cafetería:</strong> Cafetería {order.id_cafeteria}</p>
                                                    {order.metodo_pago && <p><strong>Método de pago:</strong> {order.metodo_pago}</p>}
                                                </>
                                            ) : <p>Sin detalles de items disponibles</p>}
                                        </div>
                                        <div className="completion-status">
                                            <span className="status-badge"><i className="fas fa-check-circle"></i>{getStatusText(order.estado)}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default Perfil;
