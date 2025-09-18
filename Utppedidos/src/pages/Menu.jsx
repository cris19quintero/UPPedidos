// src/pages/Menu.jsx - VERSIÓN COMPLETA CORREGIDA
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
  const [connectionStatus, setConnectionStatus] = useState('checking')

  // Datos estáticos de cafeterías
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

  // Función para verificar si el backend está funcionando
  const checkBackendConnection = async () => {
    try {
      console.log('🔍 VERIFICANDO CONEXIÓN AL BACKEND...')
      
      // Importar backendApi dinámicamente para usar la misma configuración
      const { default: backendApi } = await import('../services/backendApi')
      const response = await backendApi.get('/health')
      
      console.log('✅ BACKEND RESPONDE:', response.data)
      setConnectionStatus('connected')
      return true
      
    } catch (error) {
      console.error('❌ NO SE PUEDE CONECTAR AL BACKEND:', error.message)
      
      if (error.code === 'ERR_NETWORK' || error.message.includes('Network Error')) {
        console.error('Error de red - Backend no disponible')
        setConnectionStatus('disconnected')
      } else {
        console.error('Error del backend:', error.response?.status, error.response?.data)
        setConnectionStatus('backend_error')
      }
      return false
    }
  }

  // Cargar datos del menú - VERSION MEJORADA
  const loadMenuData = async (cafeteriaIdToLoad) => {
    try {
      console.log('='.repeat(50))
      console.log('🔍 INICIANDO CARGA DE MENÚ')
      console.log('Cafetería ID:', cafeteriaIdToLoad)
      console.log('Timestamp:', new Date().toISOString())
      console.log('='.repeat(50))
      
      setLoading(true)
      setError(null)
      
      // PASO 1: Verificar conexión al backend
      console.log('📡 PASO 1: Verificando backend...')
      const backendConnected = await checkBackendConnection()
      
      if (!backendConnected) {
        console.log('❌ BACKEND NO DISPONIBLE - MODO OFFLINE')
        setError('No se puede conectar al servidor. Por favor, intenta más tarde.')
        setConnectionStatus('disconnected')
        
        // Mostrar menú vacío en modo offline
        setMenuData({
          categorias: [],
          total_items: 0,
          isFromFallback: true,
          fallbackReason: 'Backend no disponible'
        })
        return
      }
      
      // PASO 2: Intentar cargar desde API
      console.log('📡 PASO 2: Llamando a la API...')
      console.log('URL que se va a llamar: /menu/cafeteria/' + cafeteriaIdToLoad)
      
      try {
        const response = await menuService.getByCafeteria(cafeteriaIdToLoad)
        
        console.log('📡 RESPUESTA COMPLETA DEL BACKEND:')
        console.log(JSON.stringify(response, null, 2))
        
        // PASO 3: Analizar respuesta
        if (response && response.success) {
          if (response.data && response.data.categorias && response.data.categorias.length > 0) {
            console.log('✅ DATOS REALES DEL BACKEND RECIBIDOS')
            console.log('Categorías:', response.data.categorias.length)
            console.log('Total items:', response.data.total_items)
            
            setMenuData({
              ...response.data,
              isFromFallback: false,
              loadedFrom: 'backend'
            })
            setConnectionStatus('connected')
            setError(null)
            
          } else {
            console.log('⚠️ BACKEND RESPONDE PERO SIN DATOS')
            console.log('Response.data:', response.data)
            
            setError('No hay productos disponibles para esta cafetería en este momento')
            setConnectionStatus('connected')
            
            // Mostrar menú vacío del backend
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
          console.log('❌ BACKEND RESPONDE PERO CON ERROR')
          console.log('Response:', response)
          throw new Error(response?.message || 'Respuesta inválida del backend')
        }
      } catch (apiError) {
        console.error('❌ ERROR EN LLAMADA A LA API:', apiError)
        throw apiError
      }
      
    } catch (error) {
      console.log('❌ ERROR EN CARGA DE MENÚ:')
      console.error('Tipo de error:', error.name)
      console.error('Mensaje:', error.message)
      console.error('Stack:', error.stack)
      
      if (error.message.includes('fetch') || error.message.includes('Network')) {
        console.log('🔌 ERROR DE CONEXIÓN - BACKEND NO DISPONIBLE')
        setError('No se puede conectar al servidor')
        setConnectionStatus('disconnected')
      } else {
        console.log('⚠️ ERROR DE API - BACKEND DISPONIBLE PERO CON PROBLEMAS')
        setError(`Error del servidor: ${error.message}`)
        setConnectionStatus('backend_error')
      }
      
      // Usar datos vacíos en caso de error
      console.log('🔄 MOSTRANDO MENÚ VACÍO')
      setMenuData({ 
        categorias: [], 
        total_items: 0,
        isFromFallback: true,
        fallbackReason: error.message
      })
      
    } finally {
      setLoading(false)
      console.log('='.repeat(50))
      console.log('🏁 CARGA DE MENÚ FINALIZADA')
      console.log('='.repeat(50))
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
    console.log('Navegando a cafetería:', cafe.id)
    navigate(`/menu/${cafe.id}`)
  }

  const handleRetry = () => {
    if (cafeteriaId) {
      console.log('🔄 REINTENTANDO CARGA...')
      loadMenuData(cafeteriaId)
    }
  }

  // Componente de estado de conexión
  const ConnectionStatus = () => {
    const getStatusInfo = () => {
      switch (connectionStatus) {
        case 'checking':
          return { text: 'Verificando conexión...', color: '#ffa500', icon: '🔄' }
        case 'connected':
          return menuData?.isFromFallback 
            ? { text: 'Usando datos locales', color: '#ff9800', icon: '📦' }
            : { text: 'Conectado al servidor', color: '#4caf50', icon: '✅' }
        case 'disconnected':
          return { text: 'Sin conexión al servidor', color: '#f44336', icon: '❌' }
        case 'backend_error':
          return { text: 'Error en el servidor', color: '#ff9800', icon: '⚠️' }
        default:
          return { text: 'Estado desconocido', color: '#9e9e9e', icon: '❓' }
      }
    }

    const status = getStatusInfo()
    
    return (
      <div style={{
        background: status.color,
        color: 'white',
        padding: '8px 16px',
        borderRadius: '4px',
        margin: '10px 0',
        textAlign: 'center',
        fontSize: '14px'
      }}>
        {status.icon} {status.text}
        {menuData?.isFromFallback && menuData?.fallbackReason && (
          <div style={{ fontSize: '12px', marginTop: '4px', opacity: 0.9 }}>
            Razón: {menuData.fallbackReason}
          </div>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div>
        <Navbar />
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Cargando menú...</p>
          <ConnectionStatus />
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
          <ConnectionStatus />
          
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
          <p>ID de cafetería: {cafeteriaId}</p>
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

  // Vista normal del menú o menú vacío
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
        
        <ConnectionStatus />
        
        {error && (
          <div className="error-message-box">
            <p>{error}</p>
            <button onClick={handleRetry} className="retry-btn-small">
              🔄 Reintentar
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
              <h2>🍽️ Menú no disponible</h2>
              <p>{menuData?.mensaje || 'Esta cafetería no tiene productos disponibles en este momento.'}</p>
              <button onClick={handleRetry} className="retry-btn">
                🔄 Reintentar
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