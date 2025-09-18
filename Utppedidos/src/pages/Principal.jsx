// src/pages/Principal.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import '../styles/Principal.css';

function Principal() {
  const [showNotification, setShowNotification] = useState(true);
  const [userName, setUserName] = useState('Usuario');
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      if (user.nombre && user.apellido) {
        // 👤 Nombre y apellido reales del backend
        setUserName(`${user.nombre} ${user.apellido}`);
      } else if (user.nombre) {
        // 👤 Solo nombre
        setUserName(user.nombre);
      } else if (user.email) {
        // 📧 Fallback: generar nombre a partir del email
        const userNameFromEmail = user.email.split('@')[0];
        const formattedName = userNameFromEmail
          .split('.')
          .map(part => part.charAt(0).toUpperCase() + part.slice(1))
          .join(' ');
        setUserName(formattedName);
      }
    } else {
      // 🔄 Fallback si no hay user en contexto: usar localStorage o sessionStorage
      const email = localStorage.getItem('utpedidos_email') || sessionStorage.getItem('utpedidos_email');
      if (email) {
        const userNameFromEmail = email.split('@')[0];
        const formattedName = userNameFromEmail
          .split('.')
          .map(part => part.charAt(0).toUpperCase() + part.slice(1))
          .join(' ');
        setUserName(formattedName);
      }
    }

    // Ocultar la notificación después de 4 segundos
    const timer = setTimeout(() => {
      setShowNotification(false);
    }, 4000);

    return () => clearTimeout(timer);
  }, [user]);

  const handleContinue = () => {
    // Navegar a la página de menú
    navigate('/menu');
  };

  return (
    <div>
      <div className="container">
        {/* Notificación de inicio de sesión exitoso */}
        {showNotification && (
          <div className="notification success">
            Inicio de sesión exitoso. ¡Bienvenido a UTPedidos!
          </div>
        )}

        <header>
          <div className="welcome-section">
            <h1>¡Bienvenido!</h1>
          </div>
          <div className="user-section">
            {/* Aquí ahora se verá el nombre real del usuario */}
            <span>{userName}</span>
          </div>
        </header>

        <div className="food-gallery">
          <div className="food-item">
            <img src="/imagenes/desayuno.png" alt="Desayuno tradicional" />
          </div>
          <div className="food-item">
            <img src="/imagenes/almuerzo.png" alt="Almuerzo saludable" />
          </div>
          <div className="food-item">
            <img src="/imagenes/cena.png" alt="Cena equilibrada" />
          </div>
        </div>

        <section className="schedules">
          <h2>Horarios disponibles</h2>
          
          <div className="schedule-container">
            <div className="meal-schedule">
              <h3>Desayuno</h3>
              <div className="time-block">
                <p>7:00 am</p>
                <p>-</p>
                <p>9:30 am</p>
              </div>
            </div>
            
            <div className="meal-schedule">
              <h3>Almuerzo</h3>
              <div className="time-block">
                <p>11:45 am</p>
                <p>-</p>
                <p>1:45 pm</p>
              </div>
            </div>
            
            <div className="meal-schedule">
              <h3>Cena</h3>
              <div className="time-block">
                <p>4:30 pm</p>
                <p>-</p>
                <p>7:00 pm</p>
              </div>
            </div>
          </div>
          
          <button className="continue-btn" onClick={handleContinue}>
            Continuar
          </button>
        </section>
      </div>
    </div>
  );
}

export default Principal;
