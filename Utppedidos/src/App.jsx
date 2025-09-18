// src/App.jsx - CORREGIDO SIN FIREBASE
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Páginas
import Login from './pages/Login.jsx';
import Principal from './pages/Principal.jsx';
import Menu from './pages/Menu.jsx';
import Pedidos from './pages/Pedidos.jsx';
import Perfil from './pages/Perfil.jsx';

// Componentes
import ProtectedRoute from './components/ProtectedRoute.jsx';

// Estilos
import './App.css';

function App() {
  const { loading } = useAuth();

  // Mostrar loading mientras verifica autenticación
  if (loading) {
    return (
      <div className="loading-app">
        <div className="loading-spinner"></div>
        <p>Cargando aplicación...</p>
      </div>
    );
  }

  return (
    <div className="App">
      <Routes>
        {/* Ruta pública */}
        <Route path="/login" element={<Login />} />
        
        {/* Redirect inicial */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        
        {/* Rutas protegidas */}
        <Route element={<ProtectedRoute />}>
          <Route path="/principal" element={<Principal />} />
          <Route path="/menu" element={<Menu />} />
          <Route path="/menu/:cafeteriaId" element={<Menu />} />
          <Route path="/pedidos" element={<Pedidos />} />
          <Route path="/perfil" element={<Perfil />} />
        </Route>

        {/* Catch all - redirect a login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </div>
  );
}

export default App;