// src/pages/Menu.jsx - Código completo corregido
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
      imagen: '/imagenes/cafeteria1.png',
      color: '#ff9e80'
    },
    { 
      id: 2, 
      nombre: 'CAFETERÍA #2', 
      edificio: 'Edificio No. 2',
      imagen: '/imagenes/cafeteria2.png',
      color: '#80d8ff'
    },
    { 
      id: 3, 
      nombre: 'CAFETERÍA #3', 
      edificio: 'Edificio No. 3',
      imagen: '/imagenes/cafeteria3.png',
      color: '#8adc9d'
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
              imagen: '/imagenes/desayuno-panameno.jpg',
              disponible: true
            },
            { 
              id: 2,
              nombre: 'Sandwich de Jamón', 
              precio: 3.00, 
              descripcion: 'Pan tostado, jamón de pavo, queso amarillo',
              imagen: '/imagenes/sandwich-jamon.jpg',
              disponible: true
            },
            { 
              id: 3,
              nombre: 'Tostadas Francesas', 
              precio: 3.50, 
              descripcion: 'Con miel de maple y frutas frescas',
              imagen: '/imagenes/tostadas-francesas.jpg',
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
              imagen: '/imagenes/cafe-americano.jpg',
              disponible: true
            },
            { 
              id: 5,
              nombre: 'Café con Leche', 
              precio: 2.00, 
              descripcion: 'Café con leche espumosa',
              imagen: '/imagenes/cafe-leche.jpg',
              disponible: true
            },
            { 
              id: 6,
              nombre: 'Chocolate Caliente', 
              precio: 2.50, 
              descripcion: 'Chocolate cremoso con malvaviscos',
              imagen: '/imagenes/chocolate-caliente.jpg',
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
              imagen: '/imagenes/jugo-naranja.jpg',
              disponible: true
            },
            { 
              id: 8,
              nombre: 'Jugo de Piña', 
              precio: 2.00, 
              descripcion: 'Jugo natural de piña',
              imagen: '/imagenes/jugo-pina.jpg',
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
              imagen: '/imagenes/pollo-guisado.jpg',
              disponible: true
            },
            { 
              id: 10,
              nombre: 'Arroz con Pollo', 
              precio: 6.00, 
              descripcion: 'Arroz amarillo con pollo y vegetales',
              imagen: '/imagenes/arroz-pollo.jpg',
              disponible: true
            },
            { 
              id: 11,
              nombre: 'Pescado Frito', 
              precio: 6.50, 
              descripcion: 'Pescado frito con patacones y ensalada',
              imagen: '/imagenes/pescado-frito.jpg',
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
              imagen: '/imagenes/sopa-pollo.jpg',
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
              imagen: '/imagenes/empanadas-carne.jpg',
              disponible: true
            },
            { 
              id: 14,
              nombre: 'Empanadas de Queso', 
              precio: 2.50, 
              descripcion: 'Empanadas con queso derretido',
              imagen: '/imagenes/empanadas-queso.jpg',
              disponible: true
            },
            { 
              id: 15,
              nombre: 'Pizza Personal', 
              precio: 4.00, 
              descripcion: 'Pizza individual de jamón y queso',
              imagen: '/imagenes/pizza-personal.jpg',
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
              imagen: '/imagenes/flan.jpg',
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
      // Limpiar clase del body cuando no hay cafetería seleccionada
      document.body.className = document.body.className.replace(/cafeteria-\d+/g, '')
    } else if (cafeteriaId) {
      const cafe = cafeterias.find(c => c.id === parseInt(cafeteriaId))
      setSelectedCafeteria(cafe || null)
      
      // Aplicar tema de color según la cafetería seleccionada
      if (cafe) {
        // Remover clases anteriores de cafetería
        document.body.className = document.body.className.replace(/cafeteria-\d+/g, '')
        // Agregar nueva clase de cafetería
        document.body.classList.add(`cafeteria-${cafe.id}`)
      }
    }
    
    setTimeout(() => setLoading(false), 300)
  }, [cafeteriaId])

  // Limpiar clase del body cuando el componente se desmonta
  useEffect(() => {
    return () => {
      document.body.className = document.body.className.replace(/cafeteria-\d+/g, '')
    }
  }, [])

  const handleSelectCafeteria = (cafe) => {
    console.log('Navegando a cafetería:', cafe.id) // Debug log
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

  // Vista de selección de cafeterías - CORREGIDA
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
  const currentMenu = menuData[parseInt(cafeteriaId)]
  
  if (!selectedCafeteria || !currentMenu) {
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