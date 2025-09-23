// check-firebase.js
// Ejecuta este archivo con: node check-firebase.js

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

async function checkFirebase() {
  console.log('🔍 VERIFICANDO FIREBASE...\n');
  
  try {
    // 1. Verificar cafeterías
    console.log('📍 1. CAFETERÍAS:');
    const cafeterias = await db.collection('cafeterias').get();
    console.log(`   Total: ${cafeterias.size}`);
    cafeterias.forEach(doc => {
      console.log(`   - ID: ${doc.id}, Nombre: ${doc.data().nombre}`);
    });
    
    // 2. Verificar colección "productos"
    console.log('\n📍 2. COLECCIÓN "categoria":');
    const categoria = await db.collection('categoria').get();
    console.log(`   Total: ${categoria.size}`);
    
    // Contar por cafetería
    const categoriaPorCafe = {};
    categoria.forEach(doc => {
      const data = doc.data();
      const cafId = data.id_cafeteria;
      if (!categoriaPorCafe[cafId]) categoriaPorCafe[cafId] = 0;
      categoriaPorCafe[cafId]++;
    });
    
    Object.entries(categoriaPorCafe).forEach(([id, count]) => {
      console.log(`   - Cafetería ${id}: ${count} categoria`);
    });
    
    // Mostrar ejemplo
    if (!categoria.empty) {
      const ejemplo = categoria.docs[0].data();
      console.log('\n   Ejemplo de categoria:');
      console.log(`   - Nombre: ${ejemplo.nombre}`);
      console.log(`   - Categoría: ${ejemplo.categoria}`);
      console.log(`   - ID Cafetería: ${ejemplo.id_cafeteria}`);
      console.log(`   - Activo: ${ejemplo.activo}`);
    }
    
    // 3. Verificar colección "menu"
    console.log('\n📍 3. COLECCIÓN "menu":');
    const menu = await db.collection('menu').get();
    console.log(`   Total: ${menu.size}`);
    
    // Contar por cafetería
    const menuPorCafe = {};
    menu.forEach(doc => {
      const data = doc.data();
      const cafId = data.cafeteria_id || data.id_cafeteria;
      if (!menuPorCafe[cafId]) menuPorCafe[cafId] = 0;
      menuPorCafe[cafId]++;
    });
    
    Object.entries(menuPorCafe).forEach(([id, count]) => {
      console.log(`   - Cafetería ${id}: ${count} items`);
    });
    
    // 4. DIAGNÓSTICO
    console.log('\n' + '='.repeat(50));
    console.log('📊 DIAGNÓSTICO:');
    
    if (categoria.size === 0 && menu.size === 0) {
      console.log('❌ NO HAY PRODUCTOS EN NINGUNA COLECCIÓN');
      console.log('   Solución: Ejecuta "node populate-products.js"');
    } else if (productos.size > 0) {
      console.log('✅ Hay productos en colección "productos"');
      console.log('   Verificar que id_cafeteria coincida con IDs de cafeterías');
    } else if (menu.size > 0) {
      console.log('✅ Hay productos en colección "menu"');
      console.log('   Verificar que cafeteria_id coincida con IDs de cafeterías');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await admin.app().delete();
    process.exit(0);
  }
}

checkFirebase();