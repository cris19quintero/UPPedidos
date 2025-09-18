// config/database.js - Configuración Firebase Admin corregida
const admin = require('firebase-admin');
const colors = require('colors');

// Configuración del proyecto
const firebaseConfig = {
  projectId: process.env.FIREBASE_PROJECT_ID || "utppedidos-2d630"
};

let db = null;
let app = null;

// Función para inicializar Firebase Admin SDK
const connectDB = async () => {
  try {
    if (app) {
      console.log('✅ Firebase ya está inicializado'.green);
      return;
    }

    // Verificar si ya existe una app inicializada
    if (admin.apps.length > 0) {
      app = admin.apps[0];
      db = admin.firestore(app);
      console.log('✅ Usando instancia existente de Firebase Admin'.green);
      return;
    }

    // DESARROLLO LOCAL: Intentar usar serviceAccountKey.json primero
    if (process.env.NODE_ENV === 'development') {
      console.log('⚠️ Modo desarrollo: intentando usar service account file...'.yellow);
      
      try {
        const serviceAccount = require('../serviceAccountKey.json');
        app = admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          projectId: firebaseConfig.projectId,
        });
        
        console.log('✅ Firebase inicializado con serviceAccountKey.json'.green);
      } catch (error) {
        console.log('📝 No se encontró serviceAccountKey.json, usando variables de entorno...'.yellow);
        // Continuar con variables de entorno
      }
    }

    // PRODUCCIÓN O DESARROLLO SIN ARCHIVO: Usar variables de entorno
    if (!app) {
      console.log('🚀 Inicializando Firebase Admin con variables de entorno...'.yellow);
      
      // Verificar que las variables de entorno estén configuradas
      if (!process.env.FIREBASE_PRIVATE_KEY || !process.env.FIREBASE_CLIENT_EMAIL) {
        throw new Error('❌ Variables de entorno de Firebase no configuradas. Crea un archivo .env con las credenciales.');
      }

      // Configurar service account usando variables de entorno
      const serviceAccount = {
        type: "service_account",
        project_id: process.env.FIREBASE_PROJECT_ID,
        private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
        private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        client_id: process.env.FIREBASE_CLIENT_ID,
        auth_uri: "https://accounts.google.com/o/oauth2/auth",
        token_uri: "https://oauth2.googleapis.com/token",
        auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
        universe_domain: "googleapis.com"
      };

      // Inicializar Firebase Admin
      app = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: firebaseConfig.projectId,
      });
    }

    // Obtener instancia de Firestore
    db = admin.firestore(app);
    
    // Configurar settings
    db.settings({
      ignoreUndefinedProperties: true,
      timestampsInSnapshots: true
    });

    console.log('✅ Firebase Admin SDK conectado correctamente'.green);
    console.log(`📍 Proyecto: ${firebaseConfig.projectId}`.cyan);
    console.log(`🌐 Entorno: ${process.env.NODE_ENV || 'development'}`.cyan);
    
    // Probar la conexión
    await testConnection();
    
  } catch (error) {
    console.error('❌ Error conectando Firebase Admin SDK:', error.message);
    
    // Mensajes de ayuda específicos
    if (error.code === 'app/invalid-credential') {
      console.error('💡 Verifica las credenciales de Firebase');
    } else if (error.message.includes('private_key')) {
      console.error('💡 Verifica que FIREBASE_PRIVATE_KEY tenga el formato correcto');
    } else if (error.message.includes('client_email')) {
      console.error('💡 Verifica que FIREBASE_CLIENT_EMAIL sea válido');
    } else if (error.message.includes('Variables de entorno')) {
      console.error('💡 Crea un archivo .env con las variables de Firebase o usa serviceAccountKey.json');
    }
    
    throw error;
  }
};

// Función para obtener la instancia de Firestore
const getDB = () => {
  if (!db) {
    throw new Error('❌ Firebase no inicializado. Ejecuta connectDB() primero.');
  }
  return db;
};

// Función para probar la conexión
const testConnection = async () => {
  try {
    const testRef = db.collection('_connection_test').doc('test_connection');
    await testRef.set({ 
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      message: 'Backend connection test',
      environment: process.env.NODE_ENV || 'development',
      server_info: {
        node_env: process.env.NODE_ENV,
        port: process.env.PORT,
        host: process.env.HOST
      }
    });
    
    console.log('✅ Conexión a Firestore verificada'.green);
    
    // Limpiar documento de prueba después de 3 segundos
    setTimeout(async () => {
      try {
        await testRef.delete();
        console.log('🧹 Documento de prueba eliminado'.gray);
      } catch (err) {
        console.warn('⚠️ No se pudo eliminar documento de prueba:', err.message);
      }
    }, 3000);
    
    return true;
  } catch (error) {
    console.error('❌ Error en test de conexión:', error.message);
    return false;
  }
};

// Función para health check
const healthCheck = async () => {
  try {
    if (!db) {
      console.log('🔄 Inicializando Firebase para health check...');
      await connectDB();
    }
    
    // Intentar hacer una operación simple
    const healthRef = db.collection('_health').doc('health_check');
    await healthRef.set({
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      status: 'healthy',
      service: 'utppedidos-backend',
      memory: process.memoryUsage(),
      uptime: process.uptime(),
      environment: {
        node_env: process.env.NODE_ENV,
        port: process.env.PORT,
        project_id: process.env.FIREBASE_PROJECT_ID
      }
    });
    
    return true;
  } catch (error) {
    console.error('❌ Health check falló:', error.message);
    return false;
  }
};

// Función para obtener estadísticas de la base de datos
const getDatabaseStats = async () => {
  try {
    const stats = {
      timestamp: new Date().toISOString(),
      service: 'utppedidos-backend',
      environment: process.env.NODE_ENV
    };
    
    // Contar documentos en colecciones principales
    const collections = ['usuarios', 'cafeterias', 'productos', 'pedidos', 'carritos'];
    
    for (const collectionName of collections) {
      try {
        const snapshot = await db.collection(collectionName).count().get();
        stats[collectionName] = snapshot.data().count;
      } catch (error) {
        console.warn(`No se pudo contar ${collectionName}:`, error.message);
        stats[collectionName] = 0;
      }
    }
    
    return stats;
  } catch (error) {
    console.error('Error obteniendo estadísticas de BD:', error);
    return { error: error.message };
  }
};

// Función para cerrar conexiones
const closeDB = async () => {
  try {
    if (app) {
      await app.delete();
      app = null;
      db = null;
      console.log('✅ Firebase Admin SDK desconectado'.green);
    }
  } catch (error) {
    console.error('❌ Error cerrando Firebase:', error.message);
  }
};

// Helpers de Firestore
const FieldValue = admin.firestore.FieldValue;
const Timestamp = admin.firestore.Timestamp;

// Función para generar ID único
const generateId = () => {
  return db ? db.collection('temp').doc().id : Date.now().toString();
};

// Función para timestamp del servidor
const serverTimestamp = () => {
  return FieldValue.serverTimestamp();
};

// Función para batch operations
const getBatch = () => {
  return db.batch();
};

// Función para transacciones
const runTransaction = async (callback) => {
  return db.runTransaction(callback);
};

// Función helper para consultas simples
const executeQuery = async (collection, filters = {}, options = {}) => {
  try {
    let query = db.collection(collection);
    
    // Aplicar filtros
    Object.entries(filters).forEach(([field, condition]) => {
      if (condition && typeof condition === 'object' && condition.operator) {
        query = query.where(field, condition.operator, condition.value);
      } else if (condition !== undefined && condition !== null) {
        query = query.where(field, '==', condition);
      }
    });
    
    // Aplicar ordenamiento
    if (options.orderBy) {
      const { field, direction = 'asc' } = options.orderBy;
      query = query.orderBy(field, direction);
    }
    
    // Aplicar límite
    if (options.limit) {
      query = query.limit(options.limit);
    }
    
    const snapshot = await query.get();
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
  } catch (error) {
    console.error(`Error ejecutando query en ${collection}:`, error);
    throw error;
  }
};

module.exports = {
  connectDB,
  getDB,
  testConnection,
  healthCheck,
  getDatabaseStats,
  closeDB,
  generateId,
  serverTimestamp,
  getBatch,
  runTransaction,
  executeQuery,
  FieldValue,
  Timestamp,
  admin
};