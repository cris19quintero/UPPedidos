// src/pages/Perfil.jsx - INTEGRADO CON BACKEND API
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import '../styles/Perfil.css';


// Configuración de la API
const API_BASE_URL = 'http://localhost:3001/api';
function Perfil() {
    const { user, logout, getAuthToken } = useAuth();
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
        ticket_promedio: 0,
        cafeteria_favorita: null
    });

    const [recentOrders, setRecentOrders] = useState([]);
    const [completedOrders, setCompletedOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState('');

    useEffect(() => {
        if (user) {
            loadUserData();
        }
    }, [user]);

    // Función para hacer llamadas autenticadas a la API
    const apiCall = async (endpoint, options = {}) => {
        const token = getAuthToken();
        
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        };

        const finalOptions = {
            ...defaultOptions,
            ...options,
            headers: {
                ...defaultOptions.headers,
                ...options.headers
            }
        };

        const response = await fetch(`${API_BASE_URL}${endpoint}`, finalOptions);
        
        if (!response.ok) {
            if (response.status === 401) {
                logout();
                navigate('/login');
                throw new Error('Sesión expirada');
            }
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `HTTP ${response.status}`);
        }

        return response.json();
    };

    const loadUserData = async () => {
        setLoading(true);
        setError(null);

        try {
            // Cargar datos del perfil del usuario
            const profileResponse = await apiCall('/users/profile');
            
            if (profileResponse.success && profileResponse.data) {
                const userData = profileResponse.data;
                
                setFormData({
                    nombre: userData.nombre || '',
                    apellido: userData.apellido || '',
                    correo: userData.correo || '',
                    telefono: userData.telefono || '',
                    facultad: userData.facultad || '',
                    edificio_habitual: userData.edificio_habitual || '',
                    carrera: userData.carrera || '',
                    semestre: userData.semestre || '',
                    cedula: userData.cedula || ''
                });

                // Estadísticas del usuario
                if (userData.estadisticas) {
                    setOrderStats(userData.estadisticas);
                }
            }

            // Cargar pedidos del usuario
            await loadUserOrders();
            
        } catch (error) {
            console.error('Error cargando datos de usuario:', error);
            setError('Error cargando los datos del perfil: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const loadUserOrders = async () => {
        try {
            // Cargar pedidos con filtros
            const ordersResponse = await apiCall('/users/orders?limit=20');
            
            if (ordersResponse.success && ordersResponse.data) {
                const pedidos = ordersResponse.data;
                
                // Separar pedidos por estado
                const recientes = pedidos.filter(p => 
                    ['Pendiente', 'Por Retirar', 'En Preparación'].includes(p.estado)
                ).slice(0, 5);
                
                const completados = pedidos.filter(p => 
                    ['Retirado', 'Finalizado'].includes(p.estado)
                ).slice(0, 10);

                setRecentOrders(recientes);
                setCompletedOrders(completados);
            }

            // Cargar estadísticas detalladas
            const statsResponse = await apiCall('/users/stats');
            if (statsResponse.success && statsResponse.data) {
                setOrderStats(statsResponse.data.general || {});
            }
            
        } catch (error) {
            console.error('Error cargando pedidos:', error);
            // No mostrar error aquí, ya que no es crítico
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        
        // Limpiar mensajes al modificar
        if (error) setError(null);
        if (success) setSuccess('');
    };

    const validateForm = () => {
        const errors = [];
        
        if (!formData.nombre.trim()) {
            errors.push('El nombre es obligatorio');
        }
        
        if (!formData.apellido.trim()) {
            errors.push('El apellido es obligatorio');
        }
        
        if (formData.telefono && !/^\+?507[-\s]?\d{4}[-\s]?\d{4}$/.test(formData.telefono.replace(/\s/g, ''))) {
            errors.push('Formato de teléfono inválido para Panamá');
        }
        
        if (formData.cedula && !/^\d{1,2}-\d{1,4}-\d{1,6}$/.test(formData.cedula)) {
            errors.push('Formato de cédula inválido (ej: 8-123-456)');
        }
        
        if (formData.semestre && (formData.semestre < 1 || formData.semestre > 12)) {
            errors.push('El semestre debe estar entre 1 y 12');
        }
        
        return errors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        setSuccess('');

        // Validar formulario
        const validationErrors = validateForm();
        if (validationErrors.length > 0) {
            setError(validationErrors.join(', '));
            setSaving(false);
            return;
        }

        try {
            const updateData = {
                nombre: formData.nombre.trim(),
                apellido: formData.apellido.trim(),
                telefono: formData.telefono ? formData.telefono.replace(/\s/g, '') : null,
                facultad: formData.facultad || null,
                edificio_habitual: formData.edificio_habitual || null,
                carrera: formData.carrera || null,
                semestre: formData.semestre ? parseInt(formData.semestre) : null,
                cedula: formData.cedula || null
            };

            const response = await apiCall('/users/profile', {
                method: 'PUT',
                body: JSON.stringify(updateData)
            });

            if (response.success) {
                setSuccess('¡Perfil actualizado correctamente!');
                // Actualizar datos en el contexto de autenticación si es necesario
                setTimeout(() => setSuccess(''), 3000);
            } else {
                setError(response.message || 'Error al actualizar el perfil');
            }
            
        } catch (error) {
            console.error('Error guardando perfil:', error);
            setError('Error al guardar el perfil: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = async () => {
        if (window.confirm('¿Estás seguro de que deseas cerrar sesión?')) {
            try {
                // Llamar al endpoint de logout del backend
                await apiCall('/auth/logout', { method: 'POST' });
            } catch (error) {
                console.error('Error en logout:', error);
                // Continuar con logout local aunque falle el backend
            } finally {
                logout();
                navigate('/login');
            }
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
        
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            return 'Fecha inválida';
        }
    };

    const getStatusIcon = (status) => {
        const icons = {
            'Pendiente': '🕐',
            'En Preparación': '👨‍🍳',
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
            'En Preparación': 'En preparación',
            'Por Retirar': 'Listo para retirar',
            'Retirado': 'Retirado',
            'Finalizado': 'Finalizado',
            'Cancelado': 'Cancelado',
            'Expirado': 'Expirado'
        };
        return texts[status] || status;
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('es-PA', {
            style: 'currency',
            currency: 'USD'
        }).format(amount || 0);
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
                    {error && (
                        <div className="error-message">
                            <i className="fas fa-exclamation-triangle"></i>
                            {error}
                        </div>
                    )}
                    
                    {success && (
                        <div className="success-message">
                            <i className="fas fa-check-circle"></i>
                            {success}
                        </div>
                    )}

                    <div className="profile-header">
                        <div className="profile-avatar">{getInitials()}</div>
                        <div className="profile-info">
                            <h2>{getFullName()}</h2>
                            <p>{formData.correo}</p>
                            {formData.carrera && (
                                <p className="career-info">
                                    {formData.carrera}
                                    {formData.semestre && ` - Semestre ${formData.semestre}`}
                                </p>
                            )}
                            <div className="quick-stats">
                                <div className="stat-item">
                                    <span className="stat-number">{orderStats.total_pedidos || 0}</span>
                                    <span className="stat-label">Pedidos totales</span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-number">{formatCurrency(orderStats.total_gastado)}</span>
                                    <span className="stat-label">Total gastado</span>
                                </div>
                                {orderStats.ticket_promedio > 0 && (
                                    <div className="stat-item">
                                        <span className="stat-number">{formatCurrency(orderStats.ticket_promedio)}</span>
                                        <span className="stat-label">Ticket promedio</span>
                                    </div>
                                )}
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
                        <h3>Información Personal</h3>
                        
                        {/* Nombre y Apellido */}
                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="nombre">Nombre *</label>
                                <input 
                                    type="text" 
                                    id="nombre" 
                                    name="nombre" 
                                    value={formData.nombre} 
                                    onChange={handleInputChange} 
                                    required 
                                    disabled={saving}
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="apellido">Apellido *</label>
                                <input 
                                    type="text" 
                                    id="apellido" 
                                    name="apellido" 
                                    value={formData.apellido} 
                                    onChange={handleInputChange} 
                                    required 
                                    disabled={saving}
                                />
                            </div>
                        </div>

                        {/* Correo y Teléfono */}
                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="correo">Correo electrónico</label>
                                <input 
                                    type="email" 
                                    id="correo" 
                                    name="correo" 
                                    value={formData.correo} 
                                    readOnly 
                                    className="readonly-input" 
                                    title="El correo no se puede modificar"
                                />
                                <small className="help-text">El correo no se puede modificar</small>
                            </div>
                            <div className="form-group">
                                <label htmlFor="telefono">Teléfono</label>
                                <input 
                                    type="tel" 
                                    id="telefono" 
                                    name="telefono" 
                                    value={formData.telefono} 
                                    onChange={handleInputChange} 
                                    placeholder="+507 1234-5678"
                                    disabled={saving}
                                />
                                <small className="help-text">Formato: +507 1234-5678</small>
                            </div>
                        </div>

                        {/* Semestre y Cédula */}
                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="semestre">Semestre</label>
                                <select 
                                    id="semestre" 
                                    name="semestre" 
                                    value={formData.semestre} 
                                    onChange={handleInputChange}
                                    disabled={saving}
                                >
                                    <option value="">Selecciona tu semestre</option>
                                    {[...Array(12)].map((_, i) => (
                                        <option key={i+1} value={i+1}>{i+1}° Semestre</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label htmlFor="cedula">Cédula</label>
                                <input 
                                    type="text" 
                                    id="cedula" 
                                    name="cedula" 
                                    value={formData.cedula} 
                                    onChange={handleInputChange} 
                                    placeholder="8-123-456"
                                    disabled={saving}
                                />
                                <small className="help-text">Formato: 8-123-456</small>
                            </div>
                        </div>

                        {/* Facultad y Edificio */}
                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="facultad">Facultad</label>
                                <select 
                                    id="facultad" 
                                    name="facultad" 
                                    value={formData.facultad} 
                                    onChange={handleInputChange}
                                    disabled={saving}
                                >
                            <option value="">Selecciona tu facultad</option>
  <option value="FCT - Facultad de Ciencias y Tecnología">Facultad de Ciencias y Tecnología</option>
  <option value="FIC - Facultad de Ingeniería Civil">Facultad de Ingeniería Civil</option>
  <option value="FIE - Facultad de Ingeniería Eléctrica">Facultad de Ingeniería Eléctrica</option>
  <option value="FII - Facultad de Ingeniería Industrial">Facultad de Ingeniería Industrial</option>
  <option value="FIM - Facultad de Ingeniería Mecánica">Facultad de Ingeniería Mecánica</option>
  <option value="FISC - Facultad de Ingeniería de Sistemas Computacionales">Facultad de Ingeniería de Sistemas Computacionales</option>
  <option value="Otra">Otra</option>
</select>
                            </div>
                            <div className="form-group">
                                <label htmlFor="edificio_habitual">Edificio habitual</label>
                                <select 
                                    id="edificio_habitual" 
                                    name="edificio_habitual" 
                                    value={formData.edificio_habitual} 
                                    onChange={handleInputChange}
                                    disabled={saving}
                                >
                                    <option value="">Selecciona un edificio</option>
                                    <option value="Edificio 1">Edificio 1</option>
                                    <option value="Edificio 2">Edificio 2</option>
                                    <option value="Edificio 3">Edificio 3</option>
                                    <option value="Cafetería Central">Cafetería Central</option>
                                    <option value="Biblioteca">Biblioteca</option>
                                </select>
                            </div>
                        </div>

                        {/* Carrera */}
                        <div className="form-group">
                            <label htmlFor="carrera">Carrera/Especialización</label>
                            <input 
                                type="text" 
                                id="carrera" 
                                name="carrera" 
                                value={formData.carrera} 
                                onChange={handleInputChange} 
                                placeholder="Ej: Ingeniería de Software"
                                disabled={saving}
                            />
                        </div>

                        <div className="form-actions">
                            <button 
                                type="button" 
                                onClick={handleLogout} 
                                className="btn btn-secondary" 
                                disabled={saving}
                            >
                                Cerrar sesión
                            </button>
                            <button 
                                type="submit" 
                                className="btn btn-primary" 
                                disabled={saving}
                            >
                                {saving ? 'Guardando...' : 'Guardar cambios'}
                            </button>
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
                                    <button className="btn btn-primary" onClick={() => navigate('/menu')}>
                                        Ver Menú
                                    </button>
                                </div>
                            ) : recentOrders.map(order => (
                                <div key={order.id} className="order-card recent">
                                    <div className="order-header">
                                        <div>
                                            <strong>Pedido #{order.id}</strong>
                                            <span className="order-status">
                                                {getStatusIcon(order.estado)} {getStatusText(order.estado)}
                                            </span>
                                        </div>
                                        <span className="order-price">{formatCurrency(order.total)}</span>
                                    </div>
                                    <div className="order-details">
                                        <p><strong>Fecha:</strong> {formatDate(order.fecha_pedido)}</p>
                                        {order.cafeteria_info ? (
                                            <p><strong>Cafetería:</strong> {order.cafeteria_info.nombre}</p>
                                        ) : (
                                            <p><strong>Cafetería:</strong> Cafetería #{order.id_cafeteria}</p>
                                        )}
                                        <p><strong>Items:</strong> {order.items?.length || 0}</p>
                                        {order.items && order.items.length > 0 && (
                                            <details className="order-items-details">
                                                <summary>Ver items ({order.items.length})</summary>
                                                <ul>
                                                    {order.items.map((item, idx) => (
                                                        <li key={idx}>
                                                            {item.nombre} - {formatCurrency(item.precio_unitario)}
                                                            {item.cantidad > 1 ? ` (x${item.cantidad})` : ''}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </details>
                                        )}
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
                                            <strong>Pedido #{order.id}</strong>
                                            <span className="completion-date">
                                                Completado: {formatDate(order.fecha_entrega || order.fecha_pedido)}
                                            </span>
                                        </div>
                                        <span className="order-price completed-price">
                                            {formatCurrency(order.total)}
                                        </span>
                                    </div>
                                    <div className="completed-details">
                                        <div className="items-summary">
                                            {order.items && order.items.length > 0 ? (
                                                <>
                                                    <p><strong>Items:</strong> {order.items.map(item => 
                                                        `${item.nombre} (x${item.cantidad || 1})`
                                                    ).join(', ')}</p>
                                                    {order.cafeteria_info ? (
                                                        <p><strong>Cafetería:</strong> {order.cafeteria_info.nombre}</p>
                                                    ) : (
                                                        <p><strong>Cafetería:</strong> Cafetería #{order.id_cafeteria}</p>
                                                    )}
                                                </>
                                            ) : (
                                                <p>Sin detalles de items disponibles</p>
                                            )}
                                        </div>
                                        <div className="completion-status">
                                            <span className="status-badge">
                                                <i className="fas fa-check-circle"></i>
                                                {getStatusText(order.estado)}
                                            </span>
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