// src/services/dataService.js
// Servicio centralizado para manejar toda la persistencia de datos

class DataService {
  constructor() {
    this.storageKeys = {
      ORDERS: 'utpedidos_orders',
      USER_PROFILE: 'utpedidos_user_profile',
      CART: 'utpedidos_cart',
      AUTH_USER: 'user',
      EMAIL: 'utpedidos_email',
      CAFETERIAS: 'utpedidos_cafeterias',
      MENU_DATA: 'utpedidos_menu_data'
    };
    
    // Inicializar datos por defecto si no existen
    this.initializeDefaultData();
  }

  // Función para generar datos de muestra de pedidos
  generateSampleOrders(userEmail) {
    if (!userEmail) return [];

    const now = new Date();
    const sampleOrders = [
      // Pedidos recientes (pendientes/en proceso)
      {
        id: Date.now() - 1000,
        numero_orden: `UTP-${(Date.now() - 1000).toString().slice(-6)}`,
        usuario: userEmail,
        estado: 'pendiente',
        total: 12.50,
        fecha: new Date(now.getTime() - 30 * 60 * 1000).toISOString(),
        cafeteriaId: 1,
        cafeteria_info: {
          id: 1,
          nombre: 'CAFETERÍA #1',
          edificio: 'Edificio No. 1'
        },
        items: [
          {
            nombre: 'Desayuno Panameño',
            precio: 4.50,
            quantity: 1,
            descripcion: 'Huevos revueltos, tortilla, queso fresco y café',
            categoria: 'Desayunos'
          },
          {
            nombre: 'Café Americano',
            precio: 1.50,
            quantity: 2,
            descripcion: 'Café negro recién preparado',
            categoria: 'Bebidas Calientes'
          },
          {
            nombre: 'Tostadas Francesas',
            precio: 3.50,
            quantity: 2,
            descripcion: 'Con miel de maple y frutas frescas',
            categoria: 'Desayunos'
          }
        ],
        metodo_pago: 'efectivo',
        observaciones: 'Sin azúcar en el café'
      },
      {
        id: Date.now() - 2000,
        numero_orden: `UTP-${(Date.now() - 2000).toString().slice(-6)}`,
        usuario: userEmail,
        estado: 'en_proceso',
        total: 8.00,
        fecha: new Date(now.getTime() - 45 * 60 * 1000).toISOString(),
        cafeteriaId: 2,
        cafeteria_info: {
          id: 2,
          nombre: 'CAFETERÍA #2',
          edificio: 'Central'
        },
        items: [
          {
            nombre: 'Sandwich de Jamón',
            precio: 3.00,
            quantity: 2,
            descripcion: 'Pan tostado, jamón de pavo, queso amarillo',
            categoria: 'Desayunos'
          },
          {
            nombre: 'Café con Leche',
            precio: 2.00,
            quantity: 1,
            descripcion: 'Café con leche espumosa',
            categoria: 'Bebidas Calientes'
          }
        ],
        metodo_pago: 'tarjeta',
        observaciones: ''
      },

      // Pedidos completados
      {
        id: Date.now() - 3000,
        numero_orden: `UTP-${(Date.now() - 3000).toString().slice(-6)}`,
        usuario: userEmail,
        estado: 'completado',
        total: 15.75,
        fecha: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        fecha_completado: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000 + 20 * 60 * 1000).toISOString(),
        cafeteriaId: 1,
        cafeteria_info: {
          id: 1,
          nombre: 'CAFETERÍA #1',
          edificio: 'Edificio No. 1'
        },
        items: [
          {
            nombre: 'Pollo Guisado',
            precio: 5.50,
            quantity: 1,
            descripcion: 'Pollo guisado con arroz blanco y ensalada mixta',
            categoria: 'Almuerzos'
          },
          {
            nombre: 'Arroz con Pollo',
            precio: 6.00,
            quantity: 1,
            descripcion: 'Arroz amarillo con pollo y vegetales',
            categoria: 'Almuerzos'
          },
          {
            nombre: 'Café Americano',
            precio: 1.50,
            quantity: 3,
            descripcion: 'Café negro recién preparado',
            categoria: 'Bebidas Calientes'
          }
        ],
        metodo_pago: 'tarjeta',
        observaciones: 'Extra arroz'
      },
      {
        id: Date.now() - 4000,
        numero_orden: `UTP-${(Date.now() - 4000).toString().slice(-6)}`,
        usuario: userEmail,
        estado: 'completado',
        total: 7.25,
        fecha: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        fecha_completado: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000 + 15 * 60 * 1000).toISOString(),
        cafeteriaId: 3,
        cafeteria_info: {
          id: 3,
          nombre: 'CAFETERÍA #3',
          edificio: 'Edificio No. 3'
        },
        items: [
          {
            nombre: 'Empanadas de Carne',
            precio: 2.50,
            quantity: 2,
            descripcion: 'Empanadas crujientes rellenas de carne',
            categoria: 'Cenas Ligeras'
          },
          {
            nombre: 'Café con Leche',
            precio: 2.00,
            quantity: 1,
            descripcion: 'Café con leche espumosa',
            categoria: 'Bebidas Calientes'
          }
        ],
        metodo_pago: 'efectivo',
        observaciones: 'Para llevar'
      },
      {
        id: Date.now() - 5000,
        numero_orden: `UTP-${(Date.now() - 5000).toString().slice(-6)}`,
        usuario: userEmail,
        estado: 'completado',
        total: 18.50,
        fecha: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        fecha_completado: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000 + 25 * 60 * 1000).toISOString(),
        cafeteriaId: 2,
        cafeteria_info: {
          id: 2,
          nombre: 'CAFETERÍA #2',
          edificio: 'Central'
        },
        items: [
          {
            nombre: 'Desayuno Panameño',
            precio: 4.50,
            quantity: 2,
            descripcion: 'Huevos revueltos, tortilla, queso fresco y café',
            categoria: 'Desayunos'
          },
          {
            nombre: 'Tostadas Francesas',
            precio: 3.50,
            quantity: 2,
            descripcion: 'Con miel de maple y frutas frescas',
            categoria: 'Desayunos'
          },
          {
            nombre: 'Café Americano',
            precio: 1.50,
            quantity: 4,
            descripcion: 'Café negro recién preparado',
            categoria: 'Bebidas Calientes'
          }
        ],
        metodo_pago: 'transferencia',
        observaciones: 'Pedido familiar'
      }
    ];

    return sampleOrders;
  }

  // Función para inicializar datos de muestra si no existen
  initializeSampleOrdersIfEmpty(userEmail) {
    if (!userEmail) return;

    const existingOrders = localStorage.getItem('utpedidos_orders');
    let orders = [];
    
    if (existingOrders) {
      try {
        orders = JSON.parse(existingOrders);
        const userOrders = orders.filter(order => order.usuario === userEmail);
        
        if (userOrders.length === 0) {
          const sampleOrders = this.generateSampleOrders(userEmail);
          orders = [...orders, ...sampleOrders];
          localStorage.setItem('utpedidos_orders', JSON.stringify(orders));
          console.log('Datos de muestra agregados para:', userEmail);
        }
      } catch (error) {
        console.error('Error al procesar pedidos existentes:', error);
      }
    } else {
      const sampleOrders = this.generateSampleOrders(userEmail);
      localStorage.setItem('utpedidos_orders', JSON.stringify(sampleOrders));
      console.log('Datos de muestra inicializados para:', userEmail);
    }
  }

  // Inicializar datos por defecto
  initializeDefaultData() {
    // Datos de cafeterías
    if (!this.getCafeterias()) {
      const defaultCafeterias = [
        { 
          id: 1, 
          nombre: 'CAFETERÍA #1', 
          edificio: 'Edificio No. 1',
          imagen: '/imagenes/cafeteria1.png',
          color: '#ff9e80',
          horarios: {
            desayuno: '7:00 AM - 9:30 AM',
            almuerzo: '11:45 AM - 1:45 PM',
            cena: '4:30 PM - 7:00 PM'
          },
          activa: true
        },
        { 
          id: 2, 
          nombre: 'CAFETERÍA #2', 
          edificio: 'Central',
          imagen: '/imagenes/cafeteria2.png',
          color: '#80d8ff',
          horarios: {
            desayuno: '7:00 AM - 9:30 AM',
            almuerzo: '11:45 AM - 1:45 PM',
            cena: '4:30 PM - 7:00 PM'
          },
          activa: true
        },
        { 
          id: 3, 
          nombre: 'CAFETERÍA #3', 
          edificio: 'Edificio No. 3',
          imagen: '/imagenes/cafeteria3.png',
          color: '#8adc9d',
          horarios: {
            desayuno: '7:00 AM - 9:30 AM',
            almuerzo: '11:45 AM - 1:45 PM',
            cena: '4:30 PM - 7:00 PM'
          },
          activa: true
        }
      ];
      this.saveCafeterias(defaultCafeterias);
    }

    // Datos del menú
    if (!this.getMenuData()) {
      const defaultMenuData = {
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
                  disponible: true,
                  categoria: 'Desayunos',
                  ingredientes: ['huevos', 'tortilla', 'queso', 'café'],
                  tiempo_preparacion: 15
                },
                { 
                  id: 2,
                  nombre: 'Sandwich de Jamón', 
                  precio: 3.00, 
                  descripcion: 'Pan tostado, jamón de pavo, queso amarillo',
                  imagen: '/imagenes/sandwich-jamon.jpg',
                  disponible: true,
                  categoria: 'Desayunos',
                  ingredientes: ['pan', 'jamón', 'queso'],
                  tiempo_preparacion: 8
                },
                { 
                  id: 3,
                  nombre: 'Tostadas Francesas', 
                  precio: 3.50, 
                  descripcion: 'Con miel de maple y frutas frescas',
                  imagen: '/imagenes/tostadas-francesas.jpg',
                  disponible: true,
                  categoria: 'Desayunos',
                  ingredientes: ['pan', 'huevos', 'miel', 'frutas'],
                  tiempo_preparacion: 12
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
                  disponible: true,
                  categoria: 'Bebidas Calientes',
                  ingredientes: ['café'],
                  tiempo_preparacion: 3
                },
                { 
                  id: 5,
                  nombre: 'Café con Leche', 
                  precio: 2.00, 
                  descripcion: 'Café con leche espumosa',
                  imagen: '/imagenes/cafe-leche.jpg',
                  disponible: true,
                  categoria: 'Bebidas Calientes',
                  ingredientes: ['café', 'leche'],
                  tiempo_preparacion: 5
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
                  disponible: true,
                  categoria: 'Almuerzos',
                  ingredientes: ['pollo', 'arroz', 'vegetales'],
                  tiempo_preparacion: 20
                },
                { 
                  id: 10,
                  nombre: 'Arroz con Pollo', 
                  precio: 6.00, 
                  descripcion: 'Arroz amarillo con pollo y vegetales',
                  imagen: '/imagenes/arroz-pollo.jpg',
                  disponible: true,
                  categoria: 'Almuerzos',
                  ingredientes: ['arroz', 'pollo', 'vegetales'],
                  tiempo_preparacion: 25
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
                  disponible: true,
                  categoria: 'Cenas Ligeras',
                  ingredientes: ['masa', 'carne', 'condimentos'],
                  tiempo_preparacion: 10
                }
              ] 
            }
          ]
        }
      };
      this.saveMenuData(defaultMenuData);
    }
  }

  // ========== MÉTODOS GENÉRICOS DE ALMACENAMIENTO ==========
  
  saveToStorage(key, data) {
    try {
      const jsonData = JSON.stringify(data);
      localStorage.setItem(key, jsonData);
      console.log(`Datos guardados en ${key}:`, data);
      return true;
    } catch (error) {
      console.error(`Error al guardar en ${key}:`, error);
      return false;
    }
  }

  getFromStorage(key, defaultValue = null) {
    try {
      const jsonData = localStorage.getItem(key);
      if (jsonData) {
        const parsedData = JSON.parse(jsonData);
        console.log(`Datos cargados de ${key}:`, parsedData);
        return parsedData;
      }
      return defaultValue;
    } catch (error) {
      console.error(`Error al cargar de ${key}:`, error);
      return defaultValue;
    }
  }

  removeFromStorage(key) {
    try {
      localStorage.removeItem(key);
      console.log(`Datos eliminados de ${key}`);
      return true;
    } catch (error) {
      console.error(`Error al eliminar ${key}:`, error);
      return false;
    }
  }

  // ========== GESTIÓN DE PEDIDOS ==========
  
  saveOrder(orderData) {
    const orders = this.getOrders();
    const newOrder = {
      id: Date.now(),
      ...orderData,
      fecha: new Date().toISOString(),
      estado: orderData.estado || 'pendiente',
      numero_orden: `UTP-${Date.now().toString().slice(-6)}`,
      cafeteria_info: this.getCafeteriaById(orderData.cafeteriaId) || null
    };
    
    orders.push(newOrder);
    
    if (this.saveToStorage(this.storageKeys.ORDERS, orders)) {
      console.log('Pedido guardado exitosamente:', newOrder);
      return newOrder;
    }
    return null;
  }

  getOrders(userId = null) {
    const orders = this.getFromStorage(this.storageKeys.ORDERS, []);
    
    if (userId) {
      return orders.filter(order => order.usuario === userId);
    }
    
    return orders;
  }

  getOrderById(orderId) {
    const orders = this.getOrders();
    return orders.find(order => order.id === orderId);
  }

  updateOrderStatus(orderId, newStatus) {
    const orders = this.getOrders();
    const orderIndex = orders.findIndex(order => order.id === orderId);
    
    if (orderIndex !== -1) {
      orders[orderIndex].estado = newStatus;
      orders[orderIndex].fecha_actualizacion = new Date().toISOString();
      
      if (newStatus === 'completado') {
        orders[orderIndex].fecha_completado = new Date().toISOString();
      }
      
      if (this.saveToStorage(this.storageKeys.ORDERS, orders)) {
        console.log(`Estado del pedido ${orderId} actualizado a: ${newStatus}`);
        return orders[orderIndex];
      }
    }
    return null;
  }

  deleteOrder(orderId) {
    const orders = this.getOrders();
    const filteredOrders = orders.filter(order => order.id !== orderId);
    
    if (filteredOrders.length < orders.length) {
      this.saveToStorage(this.storageKeys.ORDERS, filteredOrders);
      console.log(`Pedido ${orderId} eliminado`);
      return true;
    }
    return false;
  }

  // ========== GESTIÓN DE PERFIL DE USUARIO ==========
  
  saveUserProfile(profileData) {
    const currentUser = this.getFromStorage(this.storageKeys.AUTH_USER);
    if (currentUser) {
      const updatedProfile = {
        ...currentUser,
        ...profileData,
        fecha_actualizacion: new Date().toISOString()
      };
      
      // Guardar en ambos lugares para mantener consistencia
      this.saveToStorage(this.storageKeys.AUTH_USER, updatedProfile);
      this.saveToStorage(this.storageKeys.USER_PROFILE, updatedProfile);
      
      console.log('Perfil de usuario actualizado:', updatedProfile);
      return updatedProfile;
    }
    return null;
  }

  getUserProfile() {
    return this.getFromStorage(this.storageKeys.USER_PROFILE) || 
           this.getFromStorage(this.storageKeys.AUTH_USER);
  }

  // ========== GESTIÓN DEL CARRITO ==========
  
  saveCart(cartItems) {
    const cartData = {
      items: cartItems,
      fecha_actualizacion: new Date().toISOString(),
      total_items: cartItems.length
    };
    
    return this.saveToStorage(this.storageKeys.CART, cartData);
  }

  getCart() {
    const cartData = this.getFromStorage(this.storageKeys.CART, { items: [] });
    return cartData.items || [];
  }

  clearCart() {
    this.removeFromStorage(this.storageKeys.CART);
    console.log('Carrito limpiado');
  }

  // ========== GESTIÓN DE CAFETERÍAS ==========
  
  getCafeterias() {
    return this.getFromStorage(this.storageKeys.CAFETERIAS, []);
  }

  getCafeteriaById(id) {
    const cafeterias = this.getCafeterias();
    return cafeterias.find(cafe => cafe.id === parseInt(id));
  }

  saveCafeterias(cafeteriasData) {
    return this.saveToStorage(this.storageKeys.CAFETERIAS, cafeteriasData);
  }

  // ========== GESTIÓN DE MENÚS ==========
  
  getMenuData() {
    return this.getFromStorage(this.storageKeys.MENU_DATA, {});
  }

  getMenuByCafeteria(cafeteriaId) {
    const menuData = this.getMenuData();
    return menuData[cafeteriaId] || null;
  }

  saveMenuData(menuData) {
    return this.saveToStorage(this.storageKeys.MENU_DATA, menuData);
  }

  // ========== MÉTODOS DE ESTADÍSTICAS ==========
  
  getUserOrderStats(userEmail) {
    const orders = this.getOrders(userEmail);
    
    return {
      total_pedidos: orders.length,
      pedidos_completados: orders.filter(o => o.estado === 'completado').length,
      pedidos_pendientes: orders.filter(o => o.estado === 'pendiente').length,
      total_gastado: orders
        .filter(o => o.estado === 'completado')
        .reduce((sum, order) => sum + (order.total || 0), 0),
      cafeteria_favorita: this.getFavoriteCafeteria(orders),
      ultimo_pedido: orders.length > 0 ? orders[orders.length - 1] : null
    };
  }

  getFavoriteCafeteria(orders) {
    if (orders.length === 0) return null;
    
    const cafeteriaCount = {};
    orders.forEach(order => {
      const cafeteriaId = order.cafeteriaId || 'desconocida';
      cafeteriaCount[cafeteriaId] = (cafeteriaCount[cafeteriaId] || 0) + 1;
    });
    
    const favoriteCafeteriaId = Object.keys(cafeteriaCount)
      .reduce((a, b) => cafeteriaCount[a] > cafeteriaCount[b] ? a : b);
    
    return this.getCafeteriaById(favoriteCafeteriaId);
  }

  // ========== MÉTODO DE LIMPIEZA ==========
  
  clearAllData() {
    Object.values(this.storageKeys).forEach(key => {
      this.removeFromStorage(key);
    });
    console.log('Todos los datos han sido limpiados');
  }

  // ========== MÉTODO DE EXPORTACIÓN/IMPORTACIÓN ==========
  
  exportData() {
    const allData = {};
    Object.entries(this.storageKeys).forEach(([name, key]) => {
      allData[name] = this.getFromStorage(key);
    });
    
    const dataBlob = new Blob([JSON.stringify(allData, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `utpedidos-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
    console.log('Datos exportados exitosamente');
  }

  importData(jsonFile) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedData = JSON.parse(e.target.result);
          
          Object.entries(importedData).forEach(([name, data]) => {
            if (this.storageKeys[name] && data) {
              this.saveToStorage(this.storageKeys[name], data);
            }
          });
          
          console.log('Datos importados exitosamente');
          resolve(true);
        } catch (error) {
          console.error('Error al importar datos:', error);
          reject(error);
        }
      };
      reader.readAsText(jsonFile);
    });
  }
}

// Crear instancia singleton
const dataService = new DataService();

export default dataService;