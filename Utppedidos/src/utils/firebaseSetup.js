// ================================================================
// FIREBASE SETUP - PREPARADO PARA BACKEND API
// ================================================================

// src/utils/firebaseSetup.js
import { 
  collection, 
  doc, 
  setDoc, 
  addDoc, 
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from '../config/firebase.js';

// ================================================================
// DATOS ESTÁTICOS (SE PRELLENAN UNA SOLA VEZ)
// ================================================================

// Solo productos y cafeterías - datos que no cambiarán frecuentemente
const cafeteriasEstaticas = [
  {
    id_cafeteria: 1,
    nombre: 'Cafetería Edificio 1',
    direccion: 'Edificio 1, Planta Baja',
    edificio: 'Edificio 1',
    imagen: '/imagenes/cafeteria1.png',
    ubicacion: {
      lat: 9.0348,
      lng: -79.5453
    },
    horarios: {
      desayuno: { inicio: '07:00', fin: '09:30' },
      almuerzo: { inicio: '11:45', fin: '13:45' },
      cena: { inicio: '16:30', fin: '19:00' }
    },
    activa: true,
    telefono: '+507 123-4567',
    email: 'cafeteria1@utp.ac.pa',
    administrador: 'Administrador 1',
    fechaCreacion: serverTimestamp()
  },
  {
    id_cafeteria: 2,
    nombre: 'Cafetería Central',
    direccion: 'Edificio Central, 2do Piso',
    edificio: 'Cafetería Central',
    imagen: '/imagenes/cafeteria2.png',
    ubicacion: {
      lat: 9.0349,
      lng: -79.5454
    },
    horarios: {
      desayuno: { inicio: '07:00', fin: '09:30' },
      almuerzo: { inicio: '11:45', fin: '13:45' },
      cena: { inicio: '16:30', fin: '19:00' }
    },
    activa: true,
    telefono: '+507 123-4568',
    email: 'cafeteriacentral@utp.ac.pa',
    administrador: 'Administrador 2',
    fechaCreacion: serverTimestamp()
  },
  {
    id_cafeteria: 3,
    nombre: 'Cafetería Edificio 3',
    direccion: 'Edificio 3, Planta Baja',
    edificio: 'Edificio 3',
    imagen: '/imagenes/cafeteria3.png',
    ubicacion: {
      lat: 9.0350,
      lng: -79.5455
    },
    horarios: {
      desayuno: { inicio: '07:30', fin: '10:00' },
      almuerzo: { inicio: '12:00', fin: '14:00' },
      cena: { inicio: '17:00', fin: '19:30' }
    },
    activa: true,
    telefono: '+507 123-4569',
    email: 'cafeteria3@utp.ac.pa',
    administrador: 'Administrador 3',
    fechaCreacion: serverTimestamp()
  }
];

// Productos estáticos - menú base que se puede actualizar desde admin
const productosEstaticos = {
  1: [
    {
      id_producto: 1,
      id_cafeteria: 1,
      nombre: 'Desayuno Panameño',
      descripcion: 'Huevos, tortilla, queso, café',
      precio: 4.50,
      horario: 'Desayuno',
      categoria: 'Desayunos',
      activo: true,
      imagen: '/imagenes/desayuno-panameno.jpg',
      ingredientes: ['huevos', 'tortilla', 'queso', 'café'],
      tiempo_preparacion: 15,
      disponible: true,
      fechaCreacion: serverTimestamp()
    },
    {
      id_producto: 2,
      id_cafeteria: 1,
      nombre: 'Sandwich Jamón y Queso',
      descripcion: 'Pan tostado con jamón y queso',
      precio: 3.00,
      horario: 'Desayuno',
      categoria: 'Desayunos',
      activo: true,
      imagen: '/imagenes/sandwich-jamon.jpg',
      ingredientes: ['pan', 'jamón', 'queso'],
      tiempo_preparacion: 8,
      disponible: true,
      fechaCreacion: serverTimestamp()
    },
    {
      id_producto: 3,
      id_cafeteria: 1,
      nombre: 'Bowl de Avena con Frutas',
      descripcion: 'Avena, frutas frescas, miel',
      precio: 2.75,
      horario: 'Desayuno',
      categoria: 'Desayunos',
      activo: true,
      imagen: '/imagenes/bowl-avena.jpg',
      ingredientes: ['avena', 'frutas', 'miel'],
      tiempo_preparacion: 10,
      disponible: true,
      fechaCreacion: serverTimestamp()
    },
    {
      id_producto: 4,
      id_cafeteria: 1,
      nombre: 'Pollo Guisado con Arroz',
      descripcion: 'Pollo guisado, arroz, ensalada',
      precio: 5.50,
      horario: 'Almuerzo',
      categoria: 'Almuerzos',
      activo: true,
      imagen: '/imagenes/pollo-guisado.jpg',
      ingredientes: ['pollo', 'arroz', 'vegetales'],
      tiempo_preparacion: 20,
      disponible: true,
      fechaCreacion: serverTimestamp()
    },
    {
      id_producto: 5,
      id_cafeteria: 1,
      nombre: 'Sopa de Pollo',
      descripcion: 'Sopa casera con pollo y vegetales',
      precio: 3.25,
      horario: 'Cena',
      categoria: 'Cenas',
      activo: true,
      imagen: '/imagenes/sopa-pollo.jpg',
      ingredientes: ['pollo', 'vegetales', 'pasta'],
      tiempo_preparacion: 12,
      disponible: true,
      fechaCreacion: serverTimestamp()
    }
  ],
  2: [
    {
      id_producto: 6,
      id_cafeteria: 2,
      nombre: 'Pancakes con Miel',
      descripcion: 'Stack de pancakes con miel',
      precio: 3.50,
      horario: 'Desayuno',
      categoria: 'Desayunos',
      activo: true,
      imagen: '/imagenes/pancakes.jpg',
      ingredientes: ['harina', 'huevos', 'leche', 'miel'],
      tiempo_preparacion: 12,
      disponible: true,
      fechaCreacion: serverTimestamp()
    },
    {
      id_producto: 7,
      id_cafeteria: 2,
      nombre: 'Sancocho de Gallina',
      descripcion: 'Sancocho tradicional panameño',
      precio: 6.50,
      horario: 'Almuerzo',
      categoria: 'Almuerzos',
      activo: true,
      imagen: '/imagenes/sancocho.jpg',
      ingredientes: ['gallina', 'yuca', 'ñame', 'mazorca'],
      tiempo_preparacion: 25,
      disponible: true,
      fechaCreacion: serverTimestamp()
    },
    {
      id_producto: 8,
      id_cafeteria: 2,
      nombre: 'Hamburguesa Clásica',
      descripcion: 'Hamburguesa con papas fritas',
      precio: 4.50,
      horario: 'Cena',
      categoria: 'Cenas',
      activo: true,
      imagen: '/imagenes/hamburguesa.jpg',
      ingredientes: ['carne', 'pan', 'vegetales', 'papas'],
      tiempo_preparacion: 15,
      disponible: true,
      fechaCreacion: serverTimestamp()
    }
  ],
  3: [
    {
      id_producto: 9,
      id_cafeteria: 3,
      nombre: 'Tostadas Con Tocino',
      descripcion: 'Huevos revueltos, tostadas y tocino con jugo de naranja',
      precio: 1.80,
      horario: 'Desayuno',
      categoria: 'Desayunos',
      activo: true,
      imagen: '/imagenes/tostadas-tocino.jpg',
      ingredientes: ['huevos', 'tostadas', 'tocino', 'jugo'],
      tiempo_preparacion: 10,
      disponible: true,
      fechaCreacion: serverTimestamp()
    },
    {
      id_producto: 10,
      id_cafeteria: 3,
      nombre: 'Arroz Con Pollo',
      descripcion: 'Arroz con pollo en plancha, frijoles, ensalada y plátanos fritos',
      precio: 1.75,
      horario: 'Almuerzo',
      categoria: 'Almuerzos',
      activo: true,
      imagen: '/imagenes/arroz-pollo.jpg',
      ingredientes: ['arroz', 'pollo', 'frijoles', 'ensalada', 'plátano'],
      tiempo_preparacion: 18,
      disponible: true,
      fechaCreacion: serverTimestamp()
    },
    {
      id_producto: 11,
      id_cafeteria: 3,
      nombre: 'Arroz con carne',
      descripcion: 'Arroz blanco, frijoles, carne y ensalada de vegetales',
      precio: 1.00,
      horario: 'Cena',
      categoria: 'Cenas',
      activo: true,
      imagen: '/imagenes/arroz-carne.jpg',
      ingredientes: ['arroz', 'frijoles', 'carne', 'ensalada'],
      tiempo_preparacion: 16,
      disponible: true,
      fechaCreacion: serverTimestamp()
    }
  ]
};

// ================================================================
// FUNCIONES PARA CREAR SOLO DATOS ESTÁTICOS
// ================================================================

async function createCafeteriasEstaticas() {
  console.log('🏢 Creando cafeterías estáticas...');
  
  try {
    const batch = writeBatch(db);
    
    for (const cafeteria of cafeteriasEstaticas) {
      const cafeteriaRef = doc(db, 'cafeterias', `cafeteria_${cafeteria.id_cafeteria}`);
      batch.set(cafeteriaRef, cafeteria);
    }
    
    await batch.commit();
    console.log('✅ Cafeterías estáticas creadas');
  } catch (error) {
    console.error('❌ Error creando cafeterías:', error);
  }
}

async function createProductosEstaticos() {
  console.log('🍽️ Creando productos estáticos...');
  
  try {
    for (const [cafeteriaId, productos] of Object.entries(productosEstaticos)) {
      console.log(`   Creando productos para cafetería ${cafeteriaId}...`);
      
      for (const producto of productos) {
        await addDoc(collection(db, 'productos'), producto);
      }
    }
    console.log('✅ Productos estáticos creados');
  } catch (error) {
    console.error('❌ Error creando productos:', error);
  }
}

// ================================================================
// FUNCIONES PARA CREAR ESTRUCTURA VACÍA (LISTAS PARA API)
// ================================================================

async function createEmptyCollections() {
  console.log('📋 Creando colecciones vacías para API...');
  
  try {
    // Crear documentos de estructura/ejemplo que el backend puede usar como referencia
    
    // Estructura de usuarios (documento ejemplo)
    const userStructure = {
      _isExample: true,
      _description: 'Estructura para usuarios - Backend debe crear usuarios reales aquí',
      id_usuario: 'number',
      nombre: 'string',
      apellido: 'string',
      correo: 'string - unique',
      facultad: 'string',
      telefono: 'string',
      edificio_habitual: 'string (Edificio 1|Cafetería Central|Edificio 3)',
      activo: 'boolean',
      fecha_registro: 'timestamp',
      rol: 'string (estudiante|admin)',
      cedula: 'string',
      carrera: 'string',
      semestre: 'number',
      estadisticas: {
        totalPedidos: 'number',
        totalGastado: 'number', 
        cafeteriaFavorita: 'string'
      }
    };
    await setDoc(doc(db, 'usuarios', '_structure_example'), userStructure);

    // Crear colección de pedidos con documento temporal
    const pedidoPlaceholder = {
      _isTemporary: true,
      _instruction: 'Este documento se creó para inicializar la colección. Se puede eliminar.',
      _structure_example: {
        id_pedido: 'auto-generated',
        id_usuario: 'string (referencia a usuarios)',
        id_cafeteria: 'number',
        fecha_pedido: 'timestamp',
        estado: 'string (Pendiente|Por Retirar|Retirado|Finalizado|Cancelado|Expirado)',
        total: 'number',
        notas: 'string (opcional)',
        items: [
          {
            id_producto: 'number',
            nombre: 'string',
            precio_unitario: 'number',
            cantidad: 'number',
            subtotal: 'number'
          }
        ],
        metodo_pago: 'string (efectivo|tarjeta|transferencia)',
        tipo_pedido: 'string (normal|express)',
        observaciones: 'string (opcional)'
      }
    };
    await setDoc(doc(db, 'pedidos', '_init_collection'), pedidoPlaceholder);

    // Crear colección de carrito con documento temporal
    const carritoPlaceholder = {
      _isTemporary: true,
      _instruction: 'Este documento se creó para inicializar la colección. Se puede eliminar.',
      _structure_example: {
        id_carrito: 'auto-generated',
        id_usuario: 'string (referencia a usuarios)',
        id_cafeteria: 'number',
        fecha_creacion: 'timestamp',
        activo: 'boolean',
        items: [
          {
            id_producto: 'number',
            cantidad: 'number',
            precio_unitario: 'number',
            subtotal: 'number'
          }
        ],
        total: 'number'
      }
    };
    await setDoc(doc(db, 'carritos', '_init_collection'), carritoPlaceholder);

    console.log('✅ Colecciones inicializadas correctamente');
    console.log('📌 Las colecciones ahora existen y están listas para recibir datos reales');
    console.log('🗑️ Los documentos "_init_collection" se pueden eliminar después del primer uso');
  } catch (error) {
    console.error('❌ Error creando colecciones:', error);
  }
}

// ================================================================
// API SERVICE PARA COMUNICACIÓN CON BACKEND
// ================================================================

class BackendAPIService {
  constructor(baseURL = 'http://localhost:5000/api') {
    this.baseURL = baseURL;
  }

  async request(endpoint, options = {}) {
    try {
      const url = `${this.baseURL}${endpoint}`;
      const config = {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      };

      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error);
      throw error;
    }
  }

  // Métodos para usuarios
  async createUser(userData) {
    return this.request('/usuarios', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  }

  async getUserById(userId) {
    return this.request(`/usuarios/${userId}`);
  }

  async updateUser(userId, userData) {
    return this.request(`/usuarios/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(userData)
    });
  }

  // Métodos para pedidos
  async createPedido(pedidoData) {
    return this.request('/pedidos', {
      method: 'POST',
      body: JSON.stringify(pedidoData)
    });
  }

  async getPedidosByUser(userId) {
    return this.request(`/pedidos/usuario/${userId}`);
  }

  async updatePedidoStatus(pedidoId, status) {
    return this.request(`/pedidos/${pedidoId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ estado: status })
    });
  }

  // Métodos para carrito
  async addToCarrito(carritoData) {
    return this.request('/carrito', {
      method: 'POST',
      body: JSON.stringify(carritoData)
    });
  }

  async getCarritoByUser(userId) {
    return this.request(`/carrito/usuario/${userId}`);
  }

  async clearCarrito(userId) {
    return this.request(`/carrito/usuario/${userId}`, {
      method: 'DELETE'
    });
  }

  // Métodos para productos (lectura)
  async getProductosByCafeteria(cafeteriaId) {
    return this.request(`/productos/cafeteria/${cafeteriaId}`);
  }

  async getProductosByHorario(horario) {
    return this.request(`/productos/horario/${horario}`);
  }
}

// Instancia del servicio API
export const backendAPI = new BackendAPIService();

// ================================================================
// FUNCIÓN PRINCIPAL - SOLO CREA DATOS ESTÁTICOS
// ================================================================

export async function setupFirebaseDatabase() {
  console.log('🚀 Configurando base de datos (solo datos estáticos)...');
  
  try {
    await createCafeteriasEstaticas();
    await createProductosEstaticos();
    await createEmptyCollections();
    
    console.log('🎉 ¡Base de datos configurada para backend!');
    console.log('📊 Lo que se creó:');
    console.log('   ✅ 3 Cafeterías con información completa');
    console.log('   ✅ 11 Productos distribuidos por cafetería');
    console.log('   ✅ Estructuras vacías para usuarios, pedidos y carritos');
    console.log('   ✅ API service configurado para backend');
    console.log('');
    console.log('🔗 Endpoints del backend esperados:');
    console.log('   POST /api/usuarios - Crear usuario');
    console.log('   GET  /api/usuarios/:id - Obtener usuario');
    console.log('   POST /api/pedidos - Crear pedido');
    console.log('   GET  /api/pedidos/usuario/:userId - Obtener pedidos de usuario');
    console.log('   POST /api/carrito - Agregar al carrito');
    console.log('   GET  /api/productos/cafeteria/:id - Obtener productos');
    
    alert('¡Base de datos configurada para backend!\n\nSolo se crearon productos y cafeterías.\nLos usuarios y pedidos se manejarán vía API.');
    
  } catch (error) {
    console.error('❌ Error en la configuración:', error);
    alert('Error configurando la base de datos: ' + error.message);
  }
}

export async function testFirebaseConnection() {
  try {
    const cafeteriasRef = collection(db, 'cafeterias');
    console.log('🔍 Conexión con Firebase establecida correctamente');
    return true;
  } catch (error) {
    console.error('❌ Error conectando con Firebase:', error);
    return false;
  }
}