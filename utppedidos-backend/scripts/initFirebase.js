// scripts/initFirebase.js - Script para inicializar y verificar Firebase
const colors = require('colors');
require('dotenv').config();

const { connectDB, getDB, getDatabaseStats, admin } = require('../config/database');

const initializeFirebaseBackend = async () => {
  try {
    console.log('\n' + '='.repeat(60).cyan);
    console.log('🔥 INICIALIZANDO FIREBASE PARA BACKEND'.cyan.bold);
    console.log('='.repeat(60).cyan);
    console.log('');

    // 1. Conectar a Firebase
    console.log('1️⃣ Conectando a Firebase...'.yellow);
    await connectDB();
    
    // 2. Verificar conexión
    console.log('2️⃣ Verificando conexión...'.yellow);
    const db = getDB();
    
    // 3. Verificar que podemos leer/escribir
    console.log('3️⃣ Probando operaciones de lectura/escritura...'.yellow);
    
    const testRef = db.collection('_backend_test').doc('init_test');
    await testRef.set({
      message: 'Backend inicializado correctamente',
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      environment: process.env.NODE_ENV || 'development'
    });
    
    const testDoc = await testRef.get();
    if (testDoc.exists) {
      console.log('   ✅ Escritura exitosa'.green);
      console.log('   ✅ Lectura exitosa'.green);
    }
    
    // Limpiar documento de prueba
    await testRef.delete();
    
    // 4. Obtener estadísticas
    console.log('4️⃣ Obteniendo estadísticas de la base de datos...'.yellow);
    const stats = await getDatabaseStats();
    
    console.log('');
    console.log('📊 ESTADÍSTICAS DE LA BASE DE DATOS:'.green.bold);
    Object.entries(stats).forEach(([key, value]) => {
      if (key !== 'timestamp') {
        console.log(`   ${key}: ${value}`.green);
      }
    });
    
    // 5. Verificar colecciones existentes
    console.log('');
    console.log('5️⃣ Verificando colecciones existentes...'.yellow);
    
    const collections = await db.listCollections();
    if (collections.length > 0) {
      console.log('   📁 Colecciones encontradas:'.cyan);
      collections.forEach(collection => {
        console.log(`      - ${collection.id}`.cyan);
      });
    } else {
      console.log('   📁 No se encontraron colecciones (BD nueva)'.yellow);
      console.log('   💡 Ejecuta el frontend para crear las colecciones iniciales'.yellow);
    }
    
    console.log('');
    console.log('✅ FIREBASE BACKEND INICIALIZADO CORRECTAMENTE'.green.bold);
    console.log('');
    console.log('🔗 CONEXIÓN ESTABLECIDA:'.cyan.bold);
    console.log(`   Proyecto: utppedidos-2d630`.cyan);
    console.log(`   Ambiente: ${process.env.NODE_ENV || 'development'}`.cyan);
    console.log(`   Base de datos: Firestore (compartida con frontend)`.cyan);
    console.log('');
    console.log('🚀 El backend está listo para usar Firebase!'.green.bold);
    console.log('='.repeat(60).cyan);
    
  } catch (error) {
    console.error('\n❌ ERROR INICIALIZANDO FIREBASE:'.red.bold);
    console.error(`   ${error.message}`.red);
    
    if (error.code === 'app/invalid-credential') {
      console.error('\n💡 SOLUCIÓN:'.yellow.bold);
      console.error('   1. Verifica que las credenciales en .env sean correctas'.yellow);
      console.error('   2. Para desarrollo local, asegúrate de tener permisos en Firebase'.yellow);
      console.error('   3. Para producción, configura el Service Account correctamente'.yellow);
    }
    
    console.error('\n🔗 RECURSOS ÚTILES:'.blue.bold);
    console.error('   - Configurar credenciales: https://firebase.google.com/docs/admin/setup'.blue);
    console.error('   - Consola Firebase: https://console.firebase.google.com/project/utppedidos-2d630'.blue);
    
    process.exit(1);
  }
};

// Ejecutar si se llama directamente
if (require.main === module) {
  initializeFirebaseBackend().then(() => {
    process.exit(0);
  });
}

module.exports = initializeFirebaseBackend;

