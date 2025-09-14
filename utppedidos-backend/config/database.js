// config/database.js - Configuración de base de datos MySQL
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

// Configuración de la conexión
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'UTPPEDIDOS',
    waitForConnections: true,
    connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT) || 10,
    queueLimit: 0,
    acquireTimeout: 60000,
    timeout: 60000,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    reconnect: true,
    charset: 'utf8mb4',
    timezone: '+00:00' // UTC
};

// Pool de conexiones para mejor rendimiento
let pool = null;

// Función para conectar a la base de datos
const connectDB = async () => {
    try {
        if (!pool) {
            pool = mysql.createPool(dbConfig);
            
            // Verificar la conexión
            const connection = await pool.getConnection();
            console.log('✅ Conectado a MySQL como ID:', connection.threadId);
            
            // Verificar que la base de datos existe
            const [databases] = await connection.execute('SHOW DATABASES LIKE ?', [dbConfig.database]);
            if (databases.length === 0) {
                console.warn(`⚠️ Base de datos '${dbConfig.database}' no encontrada`);
                // Opcional: crear la base de datos si no existe
                if (process.env.AUTO_CREATE_DB === 'true') {
                    await connection.execute(`CREATE DATABASE IF NOT EXISTS ${dbConfig.database}`);
                    console.log(`✅ Base de datos '${dbConfig.database}' creada`);
                }
            }
            
            connection.release();
            
            // Verificar tablas principales
            await verifyTables();
        }
        
        return pool;
        
    } catch (error) {
        console.error('❌ Error conectando a MySQL:', error.message);
        
        // Información adicional para debugging
        if (error.code === 'ECONNREFUSED') {
            console.error('💡 Asegúrate de que MySQL esté ejecutándose');
        } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.error('💡 Verifica las credenciales de la base de datos');
        } else if (error.code === 'ER_BAD_DB_ERROR') {
            console.error(`💡 La base de datos '${dbConfig.database}' no existe`);
        }
        
        throw error;
    }
};

// Función para verificar que las tablas principales existen
const verifyTables = async () => {
    const requiredTables = [
        'Usuarios',
        'Cafeterias', 
        'Productos',
        'Pedidos',
        'DetallePedidos',
        'Carrito',
        'DetalleCarrito'
    ];
    
    try {
        const connection = await pool.getConnection();
        
        for (const table of requiredTables) {
            const [tables] = await connection.execute(
                'SHOW TABLES LIKE ?', 
                [table]
            );
            
            if (tables.length === 0) {
                console.warn(`⚠️ Tabla '${table}' no encontrada`);
            }
        }
        
        connection.release();
        console.log('✅ Verificación de tablas completada');
        
    } catch (error) {
        console.error('❌ Error verificando tablas:', error.message);
    }
};

// Función para obtener el pool de conexiones
const getDB = () => {
    if (!pool) {
        throw new Error('Base de datos no inicializada. Llama connectDB() primero.');
    }
    return pool;
};

// Función helper para ejecutar queries con manejo de errores
const executeQuery = async (query, params = []) => {
    try {
        const db = getDB();
        const [results] = await db.execute(query, params);
        return results;
    } catch (error) {
        console.error('❌ Error ejecutando query:', {
            query: query.substring(0, 100) + (query.length > 100 ? '...' : ''),
            params: params,
            error: error.message
        });
        throw error;
    }
};

// Función para transacciones
const executeTransaction = async (operations) => {
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();
        
        const results = [];
        for (const operation of operations) {
            const [result] = await connection.execute(operation.query, operation.params || []);
            results.push(result);
        }
        
        await connection.commit();
        return results;
        
    } catch (error) {
        await connection.rollback();
        console.error('❌ Error en transacción:', error.message);
        throw error;
    } finally {
        connection.release();
    }
};

// Función para obtener estadísticas de la base de datos
const getDatabaseStats = async () => {
    try {
        const stats = {};
        
        // Contadores por tabla
        const tables = ['Usuarios', 'Cafeterias', 'Productos', 'Pedidos'];
        
        for (const table of tables) {
            try {
                const [result] = await executeQuery(`SELECT COUNT(*) as count FROM ${table}`);
                stats[table.toLowerCase()] = result[0].count;
            } catch (error) {
                stats[table.toLowerCase()] = 0;
            }
        }
        
        // Estadísticas adicionales
        const [activeUsers] = await executeQuery(
            'SELECT COUNT(*) as count FROM Usuarios WHERE activo = TRUE'
        );
        stats.usuarios_activos = activeUsers[0].count;
        
        const [todayOrders] = await executeQuery(
            'SELECT COUNT(*) as count FROM Pedidos WHERE DATE(fecha_pedido) = CURDATE()'
        );
        stats.pedidos_hoy = todayOrders[0].count;
        
        const [totalRevenue] = await executeQuery(
            'SELECT COALESCE(SUM(total), 0) as total FROM Pedidos WHERE estado = "Finalizado"'
        );
        stats.ingresos_totales = parseFloat(totalRevenue[0].total);
        
        return stats;
        
    } catch (error) {
        console.error('Error obteniendo estadísticas:', error);
        return {};
    }
};

// Función para cerrar todas las conexiones
const closeDB = async () => {
    if (pool) {
        try {
            await pool.end();
            pool = null;
            console.log('✅ Conexiones de base de datos cerradas');
        } catch (error) {
            console.error('❌ Error cerrando conexiones:', error.message);
        }
    }
};

// Función para verificar la salud de la base de datos
const healthCheck = async () => {
    try {
        const db = getDB();
        const [result] = await db.execute('SELECT 1 as health');
        return result[0].health === 1;
    } catch (error) {
        console.error('❌ Health check failed:', error.message);
        return false;
    }
};

// Función para limpiar datos antiguos (opcional)
const cleanupOldData = async () => {
    try {
        // Limpiar carritos abandonados (más de 7 días)
        await executeQuery(
            `DELETE FROM DetalleCarrito 
             WHERE id_carrito IN (
                 SELECT id_carrito FROM Carrito 
                 WHERE fecha_creacion < DATE_SUB(NOW(), INTERVAL 7 DAY)
             )`
        );
        
        await executeQuery(
            'DELETE FROM Carrito WHERE fecha_creacion < DATE_SUB(NOW(), INTERVAL 7 DAY)'
        );
        
        // Limpiar pedidos expirados muy antiguos (más de 30 días)
        await executeQuery(
            `DELETE FROM DetallePedidos 
             WHERE id_pedido IN (
                 SELECT id_pedido FROM Pedidos 
                 WHERE estado = "Expirado" AND fecha_pedido < DATE_SUB(NOW(), INTERVAL 30 DAY)
             )`
        );
        
        await executeQuery(
            'DELETE FROM Pedidos WHERE estado = "Expirado" AND fecha_pedido < DATE_SUB(NOW(), INTERVAL 30 DAY)'
        );
        
        console.log('✅ Limpieza de datos completada');
        
    } catch (error) {
        console.error('❌ Error en limpieza de datos:', error.message);
    }
};

// Ejecutar limpieza automática cada 24 horas en producción
if (process.env.NODE_ENV === 'production') {
    setInterval(cleanupOldData, 24 * 60 * 60 * 1000); // 24 horas
}

// Manejar cierre graceful
process.on('SIGINT', async () => {
    console.log('\n🔄 Cerrando conexiones de base de datos...');
    await closeDB();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\n🔄 Cerrando conexiones de base de datos...');
    await closeDB();
    process.exit(0);
});

module.exports = {
    connectDB,
    getDB,
    executeQuery,
    executeTransaction,
    getDatabaseStats,
    healthCheck,
    cleanupOldData,
    closeDB
};