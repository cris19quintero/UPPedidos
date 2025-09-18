// src/components/Navbar.jsx
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import CartModal from './CartModal';
import '../styles/Navbar.css';

function Navbar() {
  const { user } = useAuth();
  const { cartCount } = useCart();
  const [isCartModalOpen, setIsCartModalOpen] = useState(false);
  const location = useLocation();

  // Obtener nombre de usuario
  const getUserName = () => {
    if (user && user.nombre && user.apellido) {
      return `${user.nombre} ${user.apellido}`;
    }
    if (user && user.nombre) {
      return user.nombre;
    }
    if (user && user.email) {
      const userNameFromEmail = user.email.split('@')[0];
      return userNameFromEmail
        .split('.')
        .map(part => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
    }
    return 'Usuario';
  };

  const handleCartClick = () => setIsCartModalOpen(true);
  const closeCartModal = () => setIsCartModalOpen(false);

  const isActive = (path) => {
    if (path === '/menu') {
      return location.pathname === '/menu' || location.pathname.startsWith('/menu/');
    }
    return location.pathname === path;
  };

  return (
    <>
      <header className="navbar">
        <div className="logo-container">
          <img src="/imagenes/logo.png" className="logo" alt="logo" />
          <h1 id="welcome-text">Bienvenido, {getUserName()}</h1>
        </div>
        <div className="nav-buttons">
          <Link to="/menu" className={`nav-button ${isActive('/menu') ? 'active' : ''}`} title="Inicio">
            <div className="icon-container">
              <i className="fas fa-home"></i>
            </div>
          </Link>
          <Link to="/perfil" className={`nav-button ${isActive('/perfil') ? 'active' : ''}`} title="Mi Perfil">
            <div className="icon-container">
              <i className="fas fa-user"></i>
            </div>
          </Link>
          <Link to="/pedidos" className={`nav-button ${isActive('/pedidos') ? 'active' : ''}`} title="Mis Pedidos">
            <div className="icon-container">
              <i className="fas fa-bag-shopping"></i>
            </div>
          </Link>
          <button className="nav-button" id="cart-btn" title="Carrito" onClick={handleCartClick}>
            <div className="icon-container">
              <i className="fas fa-shopping-cart"></i>
              <span className="cart-badge" id="cart-count">{cartCount}</span>
            </div>
          </button>
        </div>
      </header>
      <div className="separator"></div>

      {/* Modal del carrito */}
      <CartModal isOpen={isCartModalOpen} onClose={closeCartModal} />
    </>
  );
}

export default Navbar;
