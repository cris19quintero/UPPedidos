    // src/pages/Perfil.jsx
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
        localStorage.setItem('user', JSON.stringify({ ...user, ...formData }));
        alert('Perfil actualizado correctamente');
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div>
        <Navbar />
        <div className="profile-container">
            <h2>Mi Perfil</h2>
            
            <form onSubmit={handleSubmit} className="profile-form">
            <div className="form-group">
                <label>Nombre</label>
                <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleInputChange}
                />
            </div>
            
            <div className="form-group">
                <label>Apellido</label>
                <input
                type="text"
                name="apellido"
                value={formData.apellido}
                onChange={handleInputChange}
                />
            </div>
            
            <div className="form-group">
                <label>Email</label>
                <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                readOnly
                />
            </div>
            
            <div className="form-group">
                <label>Teléfono</label>
                <input
                type="tel"
                name="telefono"
                value={formData.telefono}
                onChange={handleInputChange}
                />
            </div>
            
            <div className="form-group">
                <label>Facultad</label>
                <input
                type="text"
                name="facultad"
                value={formData.facultad}
                onChange={handleInputChange}
                />
            </div>
            
            <div className="form-group">
                <label>Edificio habitual</label>
                <input
                type="text"
                name="edificio"
                value={formData.edificio}
                onChange={handleInputChange}
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
        </div>
        </div>
    );
    }

    export default Perfil;