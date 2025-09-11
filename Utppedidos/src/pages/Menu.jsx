// src/pages/Menu.jsx
import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import MenuCategory from '../components/MenuCategory'
import CartModal from '../components/CartModal'
import '../styles/Menu.css'

function Menu() {
  const { cafeteriaId } = useParams()
  const navigate = useNavigate()
  const [showCart, setShowCart] = useState(false)
  const [selectedCafeteria, setSelectedCafeteria] = useState(null)
  const [loading, setLoading] = useState(true)

  const cafeterias = [
    { 
      id: 1, 
      nombre: 'CAFETERÍA #1', 
      edificio: 'Edificio No. 1',
      imagen: '/images/cafeteria1.png',
      color: '#e3f2fd'
    },
    { 
      id: 2, 
      nombre: 'CAFETERÍA #2', 
      edificio: 'Edificio No. 2',
      imagen: '/images/cafeteria2.png',
      color: '#f3e5f5'
    },
    { 
      id: 3, 
      nombre: 'CAFETERÍA #3', 
      edificio: 'Edificio No. 3',
      imagen: '/images/cafeteria3.png',
      color: '#e8f5e8'
    },
  ]

  const menuData = {
    1: {
      categorias: [
        { 
          categoria: 'Desayunos', 
          items: [
            { 
              id: 1,
              nombre: 'Desayuno Panameño', 
              precio: 4.50, 
              descripcion: 'Huevos revueltos, tortilla, queso fresco y café',
              imagen: '/images/desayuno-panameno.jpg',
              disponible: true
            },
            { 
              id: 2,
              nombre: 'Sandwich de Jamón', 
              precio: 3.00, 
              descripcion: 'Pan tostado, jamón de pavo, queso amarillo',
              imagen: '/images/sandwich-jamon.jpg',
              disponible: true
            },
            { 
              id: 3,
              nombre: 'Tostadas Francesas', 
              precio: 3.50, 
              descripcion: 'Con miel de maple y frutas frescas',
              imagen: '/images/tostadas-francesas.jpg',
              disponible: true
            }
          ] 
        },
        { 
          categoria: 'Bebidas Calientes', 
          items: [
            { 
              id: 4,
              nombre: 'Café Americano', 
              precio: 1.50, 
              descripcion: 'Café negro recién preparado',
              imagen: '/images/cafe-americano.jpg',
              disponible: true
            },
            { 
              id: 5,
              nombre: 'Café con Leche', 
              precio: 2.00, 
              descripcion: 'Café con leche espumosa',
              imagen: '/images/cafe-leche.jpg',
              disponible: true
            },
            { 
              id: 6,
              nombre: 'Chocolate Caliente', 
              precio: 2.50, 
              descripcion: 'Chocolate cremoso con malvaviscos',
              imagen: '/images/chocolate-caliente.jpg',
              disponible: true
            }
          ] 
        },
        { 
          categoria: 'Jugos y Refrescos', 
          items: [
            { 
              id: 7,
              nombre: 'Jugo de Naranja', 
              precio: 2.00, 
              descripcion: 'Jugo natural de naranja fresca',
              imagen: '/images/jugo-naranja.jpg',
              disponible: true
            },
            { 
              id: 8,
              nombre: 'Jugo de Piña', 
              precio: 2.00, 
              descripcion: 'Jugo natural de piña',
              imagen: '/images/jugo-pina.jpg',
              disponible: true
            }
          ] 
        }
      ]
    },
    2: {
      categorias: [
        { 
          categoria: 'Almuerzos', 
          items: [
            { 
              id: 9,
              nombre: 'Pollo Guisado', 
              precio: 5.50, 
              descripcion: 'Pollo guisado con arroz blanco y ensalada mixta',
              imagen: '/images/pollo-guisado.jpg',
              disponible: true
            },
            { 
              id: 10,
              nombre: 'Arroz con Pollo', 
              precio: 6.00, 
              descripcion: 'Arroz amarillo con pollo y vegetales',
              imagen: '/images/arroz-pollo.jpg',
              disponible: true
            },
            { 
              id: 11,
              nombre: 'Pescado Frito', 
              precio: 6.50, 
              descripcion: 'Pescado frito con patacones y ensalada',
              imagen: '/images/pescado-frito.jpg',
              disponible: true
            }
          ] 
        },
        { 
          categoria: 'Sopas', 
          items: [
            { 
              id: 12,
              nombre: 'Sopa de Pollo', 
              precio: 3.50, 
              descripcion: 'Sopa tradicional con vegetales',
              imagen: '/images/sopa-pollo.jpg',
              disponible: true
            }
          ] 
        }
      ]
    },
    3: {
      categorias: [
        { 
          categoria: 'Cenas Ligeras', 
          items: [
            { 
              id: 13,
              nombre: 'Empanadas de Carne', 
              precio: 2.50, 
              descripcion: 'Empanadas crujientes rellenas de carne',
              imagen: '/images/empanadas-carne.jpg',
              disponible: true
            },
            { 
              id: 14,
              nombre: 'Empanadas de Queso', 
              precio: 2.50, 
              descripcion: 'Empanadas con queso derretido',
              imagen: '/images/empanadas-queso.jpg',
              disponible: true
            },
            { 
              id: 15,
              nombre: 'Pizza Personal', 
              precio: 4.00, 
              descripcion: 'Pizza individual de jamón y queso',
              imagen: '/images/pizza-personal.jpg',
              disponible: true
            }
          ] 
        },
        { 
          categoria: 'Postres', 
          items: [
            { 
              id: 16,
              nombre: 'Flan Casero', 
              precio: 2.00, 
              descripcion: 'Flan tradicional con caramelo',
              imagen: '/images/flan.jpg',
              disponible: true
            }
          ] 
        }
      ]
    }
  }

  useEffect(() => {
    setLoading(true)
    
    if (!cafeteriaId && cafeterias.length > 0) {
      setSelectedCafeteria(null)
    } else if (cafeteriaId) {
      const cafe = cafeterias.find(c => c.id === parseInt(cafeteriaId))
      setSelectedCafeteria(cafe || null)
    }
    
    setTimeout(() => setLoading(false), 300) // Simular carga
  }, [cafeteriaId])

  const handleSelectCafeteria = (cafe) => {
    navigate(`/menu/${cafe.id}`)
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
        <div className="menu-main">
          <div className="selection-header">
            <h1>¡Bienvenido a UTPedidos!</h1>
            <h2 className="selection-title">
              Para ordenar, selecciona la cafetería de tu preferencia
            </h2>
          </div>
          
          <div className="cafeterias-selection-container">
            {cafeterias.map(cafe => (
              <div 
                key={cafe.id} 
                className={`cafeteria-selection-card cafe-${cafe.id}`}
                style={{ backgroundColor: cafe.color }}
                onClick={() => handleSelectCafeteria(cafe)}
              >
                <div className="card-content">
                  <div className="card-icon">
                    <img 
                      src={cafe.imagen} 
                      alt={cafe.nombre}
                      onError={(e) => {
                        e.target.src = '/images/cafeteria-default.png'
                      }}
                    />
                  </div>
                  <h3>{cafe.nombre}</h3>
                  <p>{cafe.edificio}</p>
                  <div className="card-arrow">→</div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="info-section">
            <h3>Horarios de Atención</h3>
            <div className="horarios-grid">
              <div className="horario-item">
                <strong>Desayuno:</strong> 7:00 AM - 9:30 AM
              </div>
              <div className="horario-item">
                <strong>Almuerzo:</strong> 11:45 AM - 1:45 PM
              </div>
              <div className="horario-item">
                <strong>Cena:</strong> 4:30 PM - 7:00 PM
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Vista del menú específico de cafetería
  const currentMenu = menuData[cafeteriaId]
  
  if (!selectedCafeteria || !currentMenu) {
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
        
        <div className="menu-content">
          {currentMenu.categorias.map((categoria, index) => (
            <MenuCategory 
              key={`${cafeteriaId}-${index}`}
              categoria={categoria.categoria}
              items={categoria.items}
              cafeteriaId={cafeteriaId}
            />
          ))}
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