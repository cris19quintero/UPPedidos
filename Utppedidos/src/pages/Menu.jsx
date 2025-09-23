// src/pages/Menu.jsx - VERSIÓN LIMPIA PARA PRODUCCIÓN
import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import MenuCategory from '../components/MenuCategory'
import CartModal from '../components/CartModal'
import { menuService } from '../services/apiService'
import '../styles/Menu.css'

function Menu() {
  const { cafeteriaId } = useParams()
  const navigate = useNavigate()
  const [showCart, setShowCart] = useState(false)
  const [selectedCafeteria, setSelectedCafeteria] = useState(null)
  const [loading, setLoading] = useState(true)
  const [menuData, setMenuData] = useState(null)
  const [error, setError] = useState(null)

  // Datos de cafeterías
  const cafeterias = [
    { 
      id: '1', 
      nombre: 'CAFETERÍA #1', 
      edificio: 'Edificio No. 1',
      imagen: '/imagenes/cafeteria1.png',
      color: '#ff9e80'
    },
    { 
      id: '2', 
      nombre: 'CAFETERÍA #2', 
      edificio: 'Edificio No. 2',
      imagen: '/imagenes/cafeteria2.png',
      color: '#80d8ff'
    },
    { 
      id: '3', 
      nombre: 'CAFETERÍA #3', 
      edificio: 'Edificio No. 3',
      imagen: '/imagenes/cafeteria3.png',
      color: '#8adc9d'
    },
  ]

  // Cargar datos del menú
  const loadMenuData = async (cafeteriaIdToLoad) => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await menuService.getByCafeteria(cafeteriaIdToLoad)
        
      if (response && response.success) {
        if (response.data && response.data.categorias && response.data.categorias.length > 0) {
          setMenuData({
            ...response.data,
            isFromFallback: false,
            loadedFrom: 'backend'
          })
          setError(null)
        } else {
          setError('No hay productos disponibles para esta cafetería en este momento')
          setMenuData({
            categorias: [],
            total_items: 0,
            cafeteriaId: cafeteriaIdToLoad,
            isFromFallback: false,
            loadedFrom: 'backend_empty',
            mensaje: response.data?.mensaje || 'Sin productos disponibles'
          })
        }
      } else {
        throw new Error('Error al cargar el menú')
      }
      
    } catch (error) {
      setError('No se pudo cargar el menú. Intenta nuevamente.')
      setMenuData({ 
        categorias: [], 
        total_items: 0,
        isFromFallback: true,
        fallbackReason: 'Error de conexión'
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!cafeteriaId && cafeterias.length > 0) {
      setSelectedCafeteria(null)
      setMenuData(null)
      setLoading(false)
      document.body.className = document.body.className.replace(/cafeteria-\d+/g, '')
    } else if (cafeteriaId) {
      const cafe = cafeterias.find(c => c.id === cafeteriaId)
      setSelectedCafeteria(cafe || null)
      
      if (cafe) {
        document.body.classList.add(`cafeteria-${cafe.id}`)
        loadMenuData(cafeteriaId)
      } else {
        setLoading(false)
      }
    }
  }, [cafeteriaId])

  useEffect(() => {
    return () => {
      document.body.className = document.body.className.replace(/cafeteria-\d+/g, '')
    }
  }, [])

  const handleSelectCafeteria = (cafe) => {
    navigate(`/menu/${cafe.id}`)
  }

  const handleRetry = () => {
    if (cafeteriaId) {
      loadMenuData(cafeteriaId)
    }
  }

  if (loading) {
    return (
      <div>
        <Navbar />
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Cargando menú...</p>
        </div>
      </div>
    )
  }

  // Vista de selección de cafeterías
  if (!cafeteriaId) {
    return (
      <div>
        <Navbar />
        <main>
          <h2 className="selection-title">Para ordenar, haz clic en la cafetería de tu preferencia</h2>
          
          <div id="cafeterias-view">
            <div className="cafeterias-container">
              {cafeterias.map(cafe => (
                <div 
                  key={cafe.id} 
                  className={`cafeteria-card cafe-${cafe.id}`}
                  onClick={() => handleSelectCafeteria(cafe)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="cafeteria-image">
                    <img 
                      src={cafe.imagen} 
                      alt={cafe.nombre}
                      onError={(e) => {
                        e.target.src = '/imagenes/cafeteria-default.png'
                      }}
                    />
                  </div>
                  <div className="cafeteria-info">
                    <h3>{cafe.nombre}</h3>
                    <p>{cafe.edificio}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    )
  }

  // Vista del menú específico de cafetería
  if (!selectedCafeteria) {
    return (
      <div>
        <Navbar />
        <div className="error-container">
          <h2>Cafetería no encontrada</h2>
          <button 
            className="back-button"
            onClick={() => navigate('/menu')}
          >
            ← Volver a cafeterías
          </button>
        </div>
      </div>
    )
  }

  // Vista normal del menú
  return (
    <div>
      <Navbar />
      <div className="menu-view">
        <div className="menu-header">
          <button 
            className="back-button"
            onClick={() => navigate('/menu')}
          >
            ← Volver a cafeterías
          </button>
          
          <div className="cafeteria-info">
            <h1>Menú {selectedCafeteria.nombre}</h1>
            <p>{selectedCafeteria.edificio}</p>
          </div>

          <button 
            className="cart-toggle-btn"
            onClick={() => setShowCart(true)}
          >
            Ver Carrito
          </button>
        </div>
        
        {error && (
          <div className="error-message-box">
            <p>{error}</p>
            <button onClick={handleRetry} className="retry-btn-small">
              Reintentar
            </button>
          </div>
        )}
        
        <div className="menu-content">
          {menuData && menuData.categorias && menuData.categorias.length > 0 ? (
            menuData.categorias.map((categoria, index) => (
              <MenuCategory 
                key={`${cafeteriaId}-${categoria.categoria}-${index}`}
                categoria={categoria.categoria}
                items={categoria.items}
                cafeteriaId={cafeteriaId}
                isOpen={true}
              />
            ))
          ) : (
            <div className="empty-menu">
              <h2>Menú no disponible</h2>
              <p>{menuData?.mensaje || 'Esta cafetería no tiene productos disponibles en este momento.'}</p>
              <button onClick={handleRetry} className="retry-btn">
                Reintentar
              </button>
            </div>
          )}
        </div>
      </div>
      
      {showCart && (
        <CartModal 
          isOpen={showCart} 
          onClose={() => setShowCart(false)} 
        />
      )}
    </div>
  )
}

export default Menu