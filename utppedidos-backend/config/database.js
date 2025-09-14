    // config/database.js - Configuración Firebase Admin para Backend
    const admin = require('firebase-admin');
    const colors = require('colors');

    // Configuración para conectar al MISMO proyecto de Firebase que el frontend
    const firebaseConfig = {
    projectId: "utppedidos-2d630", // Mismo proyecto que el frontend
    // En desarrollo, usaremos Application Default Credentials
    // En producción, usarás Service Account Keys
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

        // Configuración para desarrollo local
        if (process.env.NODE_ENV === 'development') {
        console.log('🔧 Inicializando Firebase Admin para desarrollo...'.yellow);
        
        // Para desarrollo local, conectar sin service account
        app = admin.initializeApp({
            projectId: firebaseConfig.projectId,
        });
        
        } else {
        console.log('🚀 Inicializando Firebase Admin para producción...'.yellow);
        
        // Para producción, usar service account key
        const serviceAccount = {
            type: "service_account",
            project_id: firebaseConfig.projectId,
            private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
            private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            client_email: process.env.FIREBASE_CLIENT_EMAIL,
            client_id: process.env.FIREBASE_CLIENT_ID,
            auth_uri: "https://accounts.google.com/o/oauth2/auth",
            token_uri: "https://oauth2.googleapis.com/token",
            auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
            universe_domain: "googleapis.com"
        };

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
        console.log(`🔗 Conectado a la MISMA base de datos que el frontend`.cyan);
        
        // Probar la conexión
        await testConnection();
        
    } catch (error) {
        console.error('❌ Error conectando Firebase Admin SDK:', error.message);
        
        if (error.code === 'app/invalid-credential') {
        console.error('💡 Solución: Configura las credenciales de Firebase en .env');
        } else if (error.message.includes('ENOTFOUND')) {
        console.error('💡 Verifica tu conexión a internet');
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
        const testRef = db.collection('_connection_test').doc('test');
        await testRef.set({ 
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        message: 'Backend connection test'
        });
        
        console.log('✅ Conexión a Firestore verificada'.green);
        
        // Limpiar documento de prueba
        await testRef.delete();
        
        return true;
    } catch (error) {
        console.error('❌ Error en test de conexión:', error.message);
        return false;
    }
    };

    // Función para health check
    const healthCheck = async () => {
    try {
        if (!db) return false;
        
        // Intentar hacer una operación simple
        await db.collection('_health').doc('check').set({
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        status: 'healthy'
        });
        
        return true;
    } catch (error) {
        console.error('Health check failed:', error);
        return false;
    }
    };

    // Función para obtener estadísticas de la base de datos
    const getDatabaseStats = async () => {
    try {
        const stats = {
        timestamp: new Date().toISOString()
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
        
        // Estadísticas adicionales
        try {
        // Usuarios activos
        const activeUsersSnapshot = await db.collection('usuarios')
            .where('activo', '==', true)
            .count()
            .get();
        stats.usuarios_activos = activeUsersSnapshot.data().count;
        
        // Pedidos de hoy
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const todayOrdersSnapshot = await db.collection('pedidos')
            .where('fecha_pedido', '>=', today)
            .count()
            .get();
        stats.pedidos_hoy = todayOrdersSnapshot.data().count;
        
        } catch (error) {
        console.warn('Error obteniendo estadísticas adicionales:', error.message);
        stats.usuarios_activos = 0;
        stats.pedidos_hoy = 0;
        }
        
        return stats;
    } catch (error) {
        console.error('Error obteniendo estadísticas de BD:', error);
        return { error: error.message };
    }
    };

    // Función para cerrar conexiones (no necesaria en Firebase Admin)
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
        
        // Aplicar offset (usando startAfter)
        if (options.startAfter) {
        query = query.startAfter(options.startAfter);
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

    // Función para limpiar datos antiguos
    const cleanupOldData = async () => {
    try {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        // Limpiar carritos abandonados (más de 7 días)
        const oldCarritos = await db.collection('carritos')
        .where('fecha_creacion', '<', sevenDaysAgo)
        .where('activo', '==', false)
        .get();
        
        const batch = getBatch();
        oldCarritos.docs.forEach(doc => {
        batch.delete(doc.ref);
        });
        
        if (oldCarritos.size > 0) {
        await batch.commit();
        console.log(`🧹 Limpiados ${oldCarritos.size} carritos antiguos`.green);
        }
        
    } catch (error) {
        console.error('Error en limpieza de datos:', error);
    }
    };

    // Ejecutar limpieza automática en producción
    if (process.env.NODE_ENV === 'production') {
    setInterval(cleanupOldData, 24 * 60 * 60 * 1000); // 24 horas
    }

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
    cleanupOldData,
    FieldValue,
    Timestamp,
    admin // Exportar admin para uso avanzado
    };

    // ===== Instrucciones de configuración =====

    /* 
    INSTRUCCIONES PARA CONFIGURAR FIREBASE ADMIN EN EL BACKEND:

    1. DESARROLLO LOCAL:
    - No necesitas configurar credenciales especiales
    - Asegúrate de tener permisos en el proyecto Firebase
    - El backend usará tus credenciales de desarrollo

    2. CONFIGURAR SERVICE ACCOUNT (para producción):
    
    a) Ve a Firebase Console: https://console.firebase.google.com/
    b) Selecciona tu proyecto: utppedidos-2d630
    c) Ve a: Project Settings > Service Accounts
    d) Click en "Generate new private key"
    e) Se descargará un archivo JSON con las credenciales
    
    f) Copia los valores del JSON a tu .env:
        FIREBASE_PRIVATE_KEY_ID=valor_del_json
        FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\ntu_clave_aqui\n-----END PRIVATE KEY-----\n"
        FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@utppedidos-2d630.iam.gserviceaccount.com
        FIREBASE_CLIENT_ID=valor_del_json

    3. TESTING:
    - Ejecuta: npm run dev
    - Verifica en la consola que aparezca: "✅ Firebase Admin SDK conectado correctamente"
    - El backend estará conectado a la MISMA base de datos que el frontend

    4. IMPORTANTE:
    - NUNCA subas las credenciales al repositorio
    - Usa diferentes service accounts para desarrollo y producción
    - El frontend y backend comparten la misma base de datos de Firestore
    */