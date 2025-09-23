// populate-products-fixed.js - MIGRAR TODO A 'productos'
// Ejecuta con: node populate-products-fixed.js

const admin = require('firebase-admin');

// Inicializar Firebase
if (!admin.apps.length) {
  const serviceAccount = require('./serviceAccountKey.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: "utppedidos-2d630",
  });
}

const db = admin.firestore();

// Productos correctos para todas las cafeterías
const productosData = {
  '1': [
    {
      nombre: 'Desayuno Típico Panameño',
      descripcion: 'Huevos revueltos con tortilla, queso blanco y café',
      precio: 4.50,
      categoria: 'Desayunos',
      horario: 'desayuno',
      imagen: '/imagenes/desayuno-tipico.jpg',
      tiempo_preparacion: 15,
      ingredientes: ['huevos', 'tortilla', 'queso blanco', 'café'],
      calorias: 450,
      vegetariano: true,
      activo: true,
      disponible: true,
      id_cafeteria: '1'
    },
    {
      nombre: 'Arroz con Pollo',
      descripcion: 'Arroz amarillo con pollo guisado y vegetales',
      precio: 5.50,
      categoria: 'Almuerzos',
      horario: 'almuerzo',
      imagen: '/imagenes/arroz-pollo.jpg',
      tiempo_preparacion: 20,
      ingredientes: ['arroz', 'pollo', 'zanahoria', 'apio', 'condimentos'],
      calorias: 520,
      vegetariano: false,
      activo: true,
      disponible: true,
      id_cafeteria: '1'
    },
    {
      nombre: 'Sancocho de Gallina',
      descripcion: 'Sopa tradicional con gallina, ñame, yuca y mazorca',
      precio: 6.00,
      categoria: 'Almuerzos',
      horario: 'almuerzo',
      imagen: '/imagenes/sancocho.jpg',
      tiempo_preparacion: 25,
      ingredientes: ['gallina', 'ñame', 'yuca', 'mazorca', 'culantro'],
      calorias: 480,
      vegetariano: false,
      activo: true,
      disponible: true,
      id_cafeteria: '1'
    },
    {
      nombre: 'Café Americano',
      descripcion: 'Café negro recién preparado',
      precio: 1.50,
      categoria: 'Bebidas',
      horario: 'todo_dia',
      imagen: '/imagenes/cafe-americano.jpg',
      tiempo_preparacion: 3,
      ingredientes: ['café'],
      calorias: 5,
      vegetariano: true,
      activo: true,
      disponible: true,
      id_cafeteria: '1'
    }
  ],
  '2': [
    {
      nombre: 'Sandwich de Pollo',
      descripcion: 'Pan integral con pollo a la plancha, lechuga y tomate',
      precio: 3.75,
      categoria: 'Sandwiches',
      horario: 'todo_dia',
      imagen: '/imagenes/sandwich-pollo.jpg',
      tiempo_preparacion: 10,
      ingredientes: ['pan integral', 'pollo', 'lechuga', 'tomate', 'mayonesa'],
      calorias: 350,
      vegetariano: false,
      activo: true,
      disponible: true,
      id_cafeteria: '2'
    },
    {
      nombre: 'Sandwich de Atún',
      descripcion: 'Pan blanco con atún, mayonesa y vegetales frescos',
      precio: 3.50,
      categoria: 'Sandwiches',
      horario: 'todo_dia',
      imagen: '/imagenes/sandwich-atun.jpg',
      tiempo_preparacion: 8,
      ingredientes: ['pan', 'atún', 'mayonesa', 'lechuga', 'tomate'],
      calorias: 320,
      vegetariano: false,
      activo: true,
      disponible: true,
      id_cafeteria: '2'
    },
    {
      nombre: 'Sandwich Vegetariano',
      descripcion: 'Pan integral con vegetales frescos, queso y aguacate',
      precio: 3.00,
      categoria: 'Sandwiches',
      horario: 'todo_dia',
      imagen: '/imagenes/sandwich-vegetariano.jpg',
      tiempo_preparacion: 8,
      ingredientes: ['pan integral', 'queso', 'lechuga', 'tomate', 'pepino', 'aguacate'],
      calorias: 280,
      vegetariano: true,
      activo: true,
      disponible: true,
      id_cafeteria: '2'
    },
    {
      nombre: 'Empanadas de Carne',
      descripcion: 'Empanadas fritas rellenas de carne molida sazonada',
      precio: 2.50,
      categoria: 'Desayunos',
      horario: 'desayuno',
      imagen: '/imagenes/empanadas-carne.jpg',
      tiempo_preparacion: 5,
      ingredientes: ['masa', 'carne molida', 'cebolla', 'especias'],
      calorias: 280,
      vegetariano: false,
      activo: true,
      disponible: true,
      id_cafeteria: '2'
    },
    {
      nombre: 'Ensalada César',
      descripcion: 'Lechuga romana con aderezo césar, crutones y parmesano',
      precio: 4.50,
      categoria: 'Almuerzos',
      horario: 'almuerzo',
      imagen: '/imagenes/ensalada-cesar.jpg',
      tiempo_preparacion: 10,
      ingredientes: ['lechuga', 'aderezo césar', 'crutones', 'queso parmesano'],
      calorias: 320,
      vegetariano: true,
      activo: true,
      disponible: true,
      id_cafeteria: '2'
    },
    {
      nombre: 'Pollo a la Plancha',
      descripcion: 'Pechuga de pollo con arroz, ensalada y limón',
      precio: 6.00,
      categoria: 'Almuerzos',
      horario: 'almuerzo',
      imagen: '/imagenes/pollo-plancha.jpg',
      tiempo_preparacion: 20,
      ingredientes: ['pollo', 'arroz', 'ensalada', 'limón'],
      calorias: 450,
      vegetariano: false,
      activo: true,
      disponible: true,
      id_cafeteria: '2'
    },
    {
      nombre: 'Jugo de Naranja Natural',
      descripcion: 'Jugo natural recién exprimido',
      precio: 2.50,
      categoria: 'Bebidas',
      horario: 'todo_dia',
      imagen: '/imagenes/jugo-naranja.jpg',
      tiempo_preparacion: 5,
      ingredientes: ['naranjas'],
      calorias: 110,
      vegetariano: true,
      activo: true,
      disponible: true,
      id_cafeteria: '2'
    },
    {
      nombre: 'Batido de Fresa',
      descripcion: 'Batido cremoso de fresa con leche',
      precio: 3.00,
      categoria: 'Bebidas',
      horario: 'todo_dia',
      imagen: '/imagenes/batido-fresa.jpg',
      tiempo_preparacion: 5,
      ingredientes: ['fresas', 'leche', 'azúcar', 'hielo'],
      calorias: 180,
      vegetariano: true,
      activo: true,
      disponible: true,
      id_cafeteria: '2'
    }
  ],
  '3': [
    {
      nombre: 'Pizza Personal Hawaiana',
      descripcion: 'Pizza de 8" con jamón, piña y queso mozzarella',
      precio: 5.50,
      categoria: 'Cenas',
      horario: 'cena',
      imagen: '/imagenes/pizza-hawaiana.jpg',
      tiempo_preparacion: 15,
      ingredientes: ['masa', 'salsa', 'queso', 'jamón', 'piña'],
      calorias: 520,
      vegetariano: false,
      activo: true,
      disponible: true,
      id_cafeteria: '3'
    },
    {
      nombre: 'Pizza Vegetariana',
      descripcion: 'Pizza con champiñones, pimientos y cebolla',
      precio: 5.00,
      categoria: 'Cenas',
      horario: 'cena',
      imagen: '/imagenes/pizza-vegetariana.jpg',
      tiempo_preparacion: 15,
      ingredientes: ['masa', 'salsa', 'queso', 'champiñones', 'pimientos', 'cebolla'],
      calorias: 450,
      vegetariano: true,
      activo: true,
      disponible: true,
      id_cafeteria: '3'
    },
    {
      nombre: 'Hamburguesa Clásica',
      descripcion: 'Hamburguesa con carne, queso, lechuga y papas fritas',
      precio: 6.50,
      categoria: 'Cenas',
      horario: 'cena',
      imagen: '/imagenes/hamburguesa.jpg',
      tiempo_preparacion: 18,
      ingredientes: ['carne', 'pan', 'queso', 'lechuga', 'tomate', 'papas'],
      calorias: 750,
      vegetariano: false,
      activo: true,
      disponible: true,
      id_cafeteria: '3'
    },
    {
      nombre: 'Hot Dog Especial',
      descripcion: 'Salchicha con pan, salsas y papas fritas',
      precio: 4.00,
      categoria: 'Cenas',
      horario: 'cena',
      imagen: '/imagenes/hotdog.jpg',
      tiempo_preparacion: 10,
      ingredientes: ['salchicha', 'pan', 'ketchup', 'mostaza', 'papas'],
      calorias: 580,
      vegetariano: false,
      activo: true,
      disponible: true,
      id_cafeteria: '3'
    },
    {
      nombre: 'Nachos con Queso',
      descripcion: 'Tortillas de maíz con queso derretido y jalapeños',
      precio: 4.50,
      categoria: 'Snacks',
      horario: 'todo_dia',
      imagen: '/imagenes/nachos.jpg',
      tiempo_preparacion: 8,
      ingredientes: ['tortillas', 'queso', 'jalapeños', 'salsa'],
      calorias: 420,
      vegetariano: true,
      activo: true,
      disponible: true,
      id_cafeteria: '3'
    },
    {
      nombre: 'Coca Cola',
      descripcion: 'Refresco de cola 12 oz',
      precio: 1.75,
      categoria: 'Bebidas',
      horario: 'todo_dia',
      imagen: '/imagenes/coca-cola.jpg',
      tiempo_preparacion: 1,
      ingredientes: ['agua', 'azúcar', 'cafeína', 'gas carbónico'],
      calorias: 140,
      vegetariano: true,
      activo: true,
      disponible: true,
      id_cafeteria: '3'
    }
  ]
};

async function migrateToProductos() {
  console.log('🚀 MIGRANDO DATOS A COLECCIÓN "productos"...\n');
  
  try {
    // 1. Verificar/crear cafeterías
    console.log('📍 Verificando cafeterías...');
    for (let i = 1; i <= 3; i++) {
      const cafId = i.toString();
      const cafDoc = await db.collection('cafeterias').doc(cafId).get();
      
      if (!cafDoc.exists) {
        await db.collection('cafeterias').doc(cafId).set({
          nombre: `CAFETERÍA #${i}`,
          edificio: `Edificio No. ${i}`,
          direccion: `Edificio ${i}, UTP`,
          activa: true,
          horario_desayuno_inicio: '07:00',
          horario_desayuno_fin: '09:30',
          horario_almuerzo_inicio: '11:45',
          horario_almuerzo_fin: '13:45',
          horario_cena_inicio: '16:30',
          horario_cena_fin: '19:00',
          telefono: `+507 123-456${i}`,
          email: `cafeteria${i}@utp.ac.pa`,
          fecha_creacion: admin.firestore.FieldValue.serverTimestamp()
        });
        console.log(`   ✅ Cafetería ${cafId} creada`);
      } else {
        console.log(`   ✓ Cafetería ${cafId} ya existe`);
      }
    }
    
    // 2. LIMPIAR colecciones problemáticas
    console.log('\n🧹 LIMPIANDO colecciones antiguas...');
    
    // Limpiar 'categoria' y 'categorias' si existen
    const categoriasToDelete = ['categoria', 'categorias'];
    for (const collectionName of categoriasToDelete) {
      try {
        const snapshot = await db.collection(collectionName).get();
        console.log(`   Encontrados ${snapshot.size} docs en '${collectionName}'`);
        
        if (!snapshot.empty) {
          const batch = db.batch();
          snapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
          });
          await batch.commit();
          console.log(`   ✅ Eliminados ${snapshot.size} docs de '${collectionName}'`);
        }
      } catch (error) {
        console.log(`   ⚠️ Colección '${collectionName}' no existe o error: ${error.message}`);
      }
    }
    
    // 3. LIMPIAR productos existentes
    console.log('\n🧹 LIMPIANDO productos existentes...');
    const existingProducts = await db.collection('productos').get();
    if (!existingProducts.empty) {
      const batch = db.batch();
      existingProducts.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      await batch.commit();
      console.log(`   ✅ Eliminados ${existingProducts.size} productos existentes`);
    }
    
    // 4. CREAR PRODUCTOS NUEVOS
    console.log('\n📍 Creando productos...');
    let totalAdded = 0;
    
    for (const [cafeteriaId, productos] of Object.entries(productosData)) {
      console.log(`\n   Cafetería ${cafeteriaId}:`);
      
      for (const producto of productos) {
        try {
          // Crear documento con ID automático en 'productos'
          const docRef = await db.collection('productos').add({
            ...producto,
            fecha_creacion: admin.firestore.FieldValue.serverTimestamp(),
            ventas_totales: 0,
            pedidos_count: 0,
            ultima_venta: null
          });
          
          console.log(`   ✅ ${producto.nombre} → ID: ${docRef.id}`);
          totalAdded++;
        } catch (err) {
          console.error(`   ❌ Error agregando ${producto.nombre}:`, err.message);
        }
      }
    }
    
    // 5. Verificar resultados
    console.log('\n' + '='.repeat(50));
    console.log('📊 RESUMEN:');
    console.log(`   Total productos migrados: ${totalAdded}`);
    
    // Verificar por cafetería
    for (let i = 1; i <= 3; i++) {
      const cafId = i.toString();
      const count = await db.collection('productos')
        .where('id_cafeteria', '==', cafId)
        .get();
      console.log(`   Cafetería ${cafId}: ${count.size} productos`);
      
      // Mostrar categorías por cafetería
      const categorias = new Set();
      count.docs.forEach(doc => {
        const data = doc.data();
        categorias.add(data.categoria);
      });
      console.log(`     Categorías: ${Array.from(categorias).join(', ')}`);
    }
    
    // 6. TEST de la API
    console.log('\n🧪 TESTING API...');
    console.log('   Puedes probar:');
    console.log('   - GET /api/menu/cafeteria/1');
    console.log('   - GET /api/menu/cafeteria/2');  
    console.log('   - GET /api/menu/cafeteria/3');
    console.log('   - GET /api/menu/test/2');
    
    console.log('\n✅ MIGRACIÓN COMPLETADA EXITOSAMENTE');
    console.log('   🔄 Recarga tu aplicación web ahora');
    console.log('   🍽️ Todos los productos están en colección "productos"');
    
  } catch (error) {
    console.error('❌ Error en migración:', error);
  } finally {
    await admin.app().delete();
    process.exit(0);
  }
}

migrateToProductos();