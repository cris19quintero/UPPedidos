// src/components/Navbar.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import '../styles/Navbar.css';

function Navbar() {
  const { user } = useAuth();
  const { cartItems } = useCart();

  // Obtener nombre de usuario
  const getUserName = () => {
    if (user && user.email) {
      const userNameFromEmail = user.email.split('@')[0];
      const formattedName = userNameFromEmail
        .split('.')
        .map(part => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
      return formattedName;
    }
    return 'Usuario';
  };

  // Calcular total de items en carrito
  const cartCount = cartItems ? cartItems.reduce((total, item) => total + item.quantity, 0) : 0;

  const handleCartClick = () => {
    // Aquí puedes agregar la lógica para abrir el modal del carrito
    console.log('Abrir carrito');
  };

  return (
    <>
      <header className="navbar">
        <div className="logo-container">
          <img src="/imagenes/logo.png" className="logo" alt="logo" />
          <h1 id="welcome-text">Bienvenido, {getUserName()}</h1>
        </div>
        <div className="nav-buttons">
          <Link to="/perfil" className="nav-button" title="Mi Perfil">
            <div className="icon-container">
              <i className="fas fa-user"></i>
            </div>
          </Link>
          <Link to="/pedidos" className="nav-button" title="Mis Pedidos">
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
    </>
  );
}

export default Navbar;