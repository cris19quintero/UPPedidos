// src/App.jsx
import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login.jsx'        // Agrega .jsx
import Principal from './pages/Principal.jsx'  // Agrega .jsx
import Menu from './pages/Menu.jsx'           // Agrega .jsx
import Pedidos from './pages/Pedidos.jsx'     // Agrega .jsx
import Perfil from './pages/Perfil.jsx'       // Agrega .jsx
import ProtectedRoute from './components/ProtectedRoute.jsx'  // Agrega .jsx
import './App.css'

function App() {
  return (
    <div className="App">
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/principal" element={<Principal />} />
          <Route path="/menu" element={<Menu />} />
          <Route path="/menu/:cafeteriaId" element={<Menu />} />
          <Route path="/pedidos" element={<Pedidos />} />
          <Route path="/perfil" element={<Perfil />} />
        </Route>
      </Routes>
    </div>
  )
}

export default App