// src/services/sampleOrdersData.js - Datos de muestra para pedidos

export const generateSampleOrders = (userEmail) => {
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
};

export const initializeSampleOrdersIfEmpty = (userEmail) => {
  if (!userEmail) return;

  const existingOrders = localStorage.getItem('utpedidos_orders');
  let orders = [];
  
  if (existingOrders) {
    try {
      orders = JSON.parse(existingOrders);
      const userOrders = orders.filter(order => order.usuario === userEmail);
      
      if (userOrders.length === 0) {
        const sampleOrders = generateSampleOrders(userEmail);
        orders = [...orders, ...sampleOrders];
        localStorage.setItem('utpedidos_orders', JSON.stringify(orders));
        console.log('Datos de muestra agregados para:', userEmail);
      }
    } catch (error) {
      console.error('Error al procesar pedidos existentes:', error);
    }
  } else {
    const sampleOrders = generateSampleOrders(userEmail);
    localStorage.setItem('utpedidos_orders', JSON.stringify(sampleOrders));
    console.log('Datos de muestra inicializados para:', userEmail);
  }
};

export default {
  generateSampleOrders,
  initializeSampleOrdersIfEmpty
};