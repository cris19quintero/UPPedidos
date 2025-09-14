// src/App.jsx - Actualizado
import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login.jsx'
import Principal from './pages/Principal.jsx'
import Menu from './pages/Menu.jsx'
import Pedidos from './pages/Pedidos.jsx'
import Perfil from './pages/Perfil.jsx'
import FirebaseSetup from './pages/FirebaseSetup.jsx'  // Nueva página
import ProtectedRoute from './components/ProtectedRoute.jsx'
import './App.css'

function App() {
  return (
    <div className="App">
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/setup" element={<FirebaseSetup />} />  {/* Nueva ruta */}
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