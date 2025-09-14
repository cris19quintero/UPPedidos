// ===== src/utils/firebaseSetup.js - SOLO FRONTEND =====
import { db } from '../config/firebase';
import { 
    collection, 
    doc, 
    setDoc, 
    getDoc,
    getDocs,
    writeBatch, 
    serverTimestamp 
} from 'firebase/firestore';

// Datos de las cafeterías
const cafeteriasData = [
    {
        id: 'cafeteria_central',
        nombre: 'Cafetería Central',
        direccion: 'Edificio Central, Planta Baja',
        edificio: 'Central',
        telefono: '+507 560-3000 ext. 1234',
        email: 'cafeteria.central@utp.ac.pa',
        imagen: '/images/cafeterias/central.jpg',
        descripcion: 'La cafetería principal del campus, ubicada en el corazón de la universidad.',
        horario_desayuno_inicio: '07:00',
        horario_desayuno_fin: '10:00',
        horario_almuerzo_inicio: '11:30',
        horario_almuerzo_fin: '15:00',
        horario_cena_inicio: '17:00',
        horario_cena_fin: '20:00',
        activa: true
    },
    {
        id: 'cafeteria_ingenieria',
        nombre: 'Cafetería de Ingeniería',
        direccion: 'Edificio de Ingeniería, 1er Piso',
        edificio: 'Ingeniería',
        telefono: '+507 560-3000 ext. 1235',
        email: 'cafeteria.ingenieria@utp.ac.pa',
        imagen: '/images/cafeterias/ingenieria.jpg',
        descripcion: 'Cafetería especializada para estudiantes de ingeniería.',
        horario_desayuno_inicio: '07:30',
        horario_desayuno_fin: '09:30',
        horario_almuerzo_inicio: '12:00',
        horario_almuerzo_fin: '14:30',
        horario_cena_inicio: '17:30',
        horario_cena_fin: '19:30',
        activa: true
    },
    {
        id: 'cafeteria_sistemas',
        nombre: 'Café & Bytes',
        direccion: 'Edificio de Sistemas, 2do Piso',
        edificio: 'Sistemas',
        telefono: '+507 560-3000 ext. 1236',
        email: 'cafeteria.sistemas@utp.ac.pa',
        imagen: '/images/cafeterias/sistemas.jpg',
        descripcion: 'Un espacio moderno para estudiantes de tecnología.',
        horario_desayuno_inicio: '08:00',
        horario_desayuno_fin: '10:30',
        horario_almuerzo_inicio: '11:45',
        horario_almuerzo_fin: '15:15',
        horario_cena_inicio: '17:00',
        horario_cena_fin: '20:30',
        activa: true
    }
];

// Productos por cafetería
const productosData = {
    cafeteria_central: [
        {
            nombre: 'Desayuno Típico Panameño',
            descripcion: 'Huevos revueltos, salchicha, queso blanco, tortilla y café',
            precio: 6.50,
            categoria: 'Desayunos',
            horario: 'desayuno',
            imagen: '/images/productos/desayuno-tipico.jpg',
            tiempo_preparacion: 15,
            calorias: 650,
            vegetariano: false,
            ingredientes: ['huevos', 'salchicha', 'queso blanco', 'tortilla', 'café'],
            activo: true
        },
        {
            nombre: 'Sancocho de Gallina',
            descripcion: 'Tradicional sancocho panameño con gallina, verduras y culantro',
            precio: 8.75,
            categoria: 'Platos Principales',
            horario: 'almuerzo',
            imagen: '/images/productos/sancocho.jpg',
            tiempo_preparacion: 20,
            calorias: 480,
            vegetariano: false,
            ingredientes: ['gallina', 'ñame', 'mazorca', 'culantro', 'ají chombo'],
            activo: true
        },
        {
            nombre: 'Arroz con Pollo',
            descripcion: 'Arroz amarillo con pollo, verduras y sazón criolla',
            precio: 7.25,
            categoria: 'Platos Principales',
            horario: 'almuerzo',
            imagen: '/images/productos/arroz-pollo.jpg',
            tiempo_preparacion: 18,
            calorias: 520,
            vegetariano: false,
            ingredientes: ['arroz', 'pollo', 'achiote', 'pimientos', 'cebolla'],
            activo: true
        },
        {
            nombre: 'Café Geisha',
            descripcion: 'Café premium panameño de la región de Boquete',
            precio: 3.50,
            categoria: 'Bebidas Calientes',
            horario: 'todo_dia',
            imagen: '/images/productos/cafe-geisha.jpg',
            tiempo_preparacion: 5,
            calorias: 5,
            vegetariano: true,
            ingredientes: ['café geisha', 'agua filtrada'],
            activo: true
        },
        {
            nombre: 'Tres Leches',
            descripcion: 'Postre tradicional con tres tipos de leche y canela',
            precio: 4.25,
            categoria: 'Postres',
            horario: 'todo_dia',
            imagen: '/images/productos/tres-leches.jpg',
            tiempo_preparacion: 5,
            calorias: 380,
            vegetariano: true,
            ingredientes: ['leche condensada', 'leche evaporada', 'crema', 'bizcocho', 'canela'],
            activo: true
        }
    ],
    cafeteria_ingenieria: [
        {
            nombre: 'Burger Engineer',
            descripcion: 'Hamburguesa doble con queso, bacon y papas fritas',
            precio: 9.50,
            categoria: 'Comida Rápida',
            horario: 'almuerzo',
            imagen: '/images/productos/burger-engineer.jpg',
            tiempo_preparacion: 12,
            calorias: 850,
            vegetariano: false,
            ingredientes: ['carne', 'queso', 'bacon', 'lechuga', 'tomate', 'papas'],
            activo: true
        },
        {
            nombre: 'Pizza Margarita',
            descripcion: 'Pizza tradicional con salsa de tomate, mozzarella y albahaca',
            precio: 8.00,
            categoria: 'Comida Rápida',
            horario: 'almuerzo',
            imagen: '/images/productos/pizza-margarita.jpg',
            tiempo_preparacion: 15,
            calorias: 320,
            vegetariano: true,
            ingredientes: ['masa', 'salsa tomate', 'mozzarella', 'albahaca'],
            activo: true
        },
        {
            nombre: 'Empanadas de Pollo',
            descripcion: 'Dos empanadas criollas rellenas de pollo guisado',
            precio: 4.75,
            categoria: 'Aperitivos',
            horario: 'todo_dia',
            imagen: '/images/productos/empanadas-pollo.jpg',
            tiempo_preparacion: 8,
            calorias: 450,
            vegetariano: false,
            ingredientes: ['masa', 'pollo', 'cebolla', 'pimientos', 'especias'],
            activo: true
        },
        {
            nombre: 'Smoothie Energético',
            descripcion: 'Batido de frutas tropicales con proteína',
            precio: 5.25,
            categoria: 'Bebidas Frías',
            horario: 'todo_dia',
            imagen: '/images/productos/smoothie-energetico.jpg',
            tiempo_preparacion: 5,
            calorias: 280,
            vegetariano: true,
            ingredientes: ['mango', 'piña', 'proteína whey', 'leche', 'hielo'],
            activo: true
        }
    ],
    cafeteria_sistemas: [
        {
            nombre: 'Wrap de Programador',
            descripcion: 'Tortilla integral con pollo, vegetales y salsa especial',
            precio: 6.75,
            categoria: 'Comida Saludable',
            horario: 'almuerzo',
            imagen: '/images/productos/wrap-programador.jpg',
            tiempo_preparacion: 10,
            calorias: 420,
            vegetariano: false,
            ingredientes: ['tortilla integral', 'pollo', 'lechuga', 'tomate', 'aguacate', 'salsa yogurt'],
            activo: true
        },
        {
            nombre: 'Ensalada de Quinoa',
            descripcion: 'Quinoa con vegetales frescos, aguacate y vinagreta',
            precio: 7.50,
            categoria: 'Comida Saludable',
            horario: 'almuerzo',
            imagen: '/images/productos/ensalada-quinoa.jpg',
            tiempo_preparacion: 8,
            calorias: 350,
            vegetariano: true,
            ingredientes: ['quinoa', 'aguacate', 'tomate cherry', 'pepino', 'vinagreta'],
            activo: true
        },
        {
            nombre: 'Cold Brew Coffee',
            descripcion: 'Café frío extraído en frío durante 12 horas',
            precio: 4.00,
            categoria: 'Bebidas Frías',
            horario: 'todo_dia',
            imagen: '/images/productos/cold-brew.jpg',
            tiempo_preparacion: 3,
            calorias: 10,
            vegetariano: true,
            ingredientes: ['café cold brew', 'hielo'],
            activo: true
        },
        {
            nombre: 'Açaí Bowl',
            descripcion: 'Bowl de açaí con granola, frutas y miel',
            precio: 6.25,
            categoria: 'Comida Saludable',
            horario: 'desayuno',
            imagen: '/images/productos/acai-bowl.jpg',
            tiempo_preparacion: 7,
            calorias: 380,
            vegetariano: true,
            ingredientes: ['açaí', 'granola', 'plátano', 'fresas', 'miel'],
            activo: true
        }
    ]
};

// Usuario de ejemplo
const usuarioEjemplo = {
    id: 'usuario_ejemplo',
    nombre: 'Juan Carlos',
    apellido: 'Rodríguez',
    correo: 'juan.rodriguez@utp.ac.pa',
    facultad: 'Ingeniería de Sistemas Computacionales',
    telefono: '+507 6789-1234',
    edificio_habitual: 'Sistemas',
    carrera: 'Ingeniería de Sistemas',
    semestre: 6,
    cedula: '8-123-456',
    activo: true
};

// Función principal para configurar la base de datos
export const setupFirebaseDatabase = async () => {
    try {
        console.log('🚀 Iniciando configuración de Firebase...');
        
        // 1. Crear cafeterías
        console.log('📍 Creando cafeterías...');
        const cafeteriasBatch = writeBatch(db);
        
        for (const cafeteriaData of cafeteriasData) {
            const cafeteriaRef = doc(db, 'cafeterias', cafeteriaData.id);
            cafeteriasBatch.set(cafeteriaRef, {
                ...cafeteriaData,
                fecha_creacion: serverTimestamp(),
                ultima_actualizacion: serverTimestamp()
            });
        }
        
        await cafeteriasBatch.commit();
        console.log(`✅ ${cafeteriasData.length} cafeterías creadas`);

        // 2. Crear productos
        console.log('🍽️ Creando productos...');
        let productosCreados = 0;
        
        for (const [cafeteriaId, productos] of Object.entries(productosData)) {
            console.log(`Creando productos para ${cafeteriaId}...`);
            
            const productosBatch = writeBatch(db);
            
            for (const producto of productos) {
                const productoRef = doc(collection(db, 'productos'));
                productosBatch.set(productoRef, {
                    ...producto,
                    id_cafeteria: cafeteriaId,
                    fecha_creacion: serverTimestamp(),
                    ultima_actualizacion: serverTimestamp(),
                    ventas_totales: 0,
                    pedidos_count: 0
                });
                productosCreados++;
            }
            
            await productosBatch.commit();
        }
        
        console.log(`✅ ${productosCreados} productos creados`);

        // 3. Crear usuario de ejemplo
        console.log('👤 Creando usuario de ejemplo...');
        const usuarioRef = doc(db, 'usuarios', usuarioEjemplo.id);
        await setDoc(usuarioRef, {
            ...usuarioEjemplo,
            fecha_registro: serverTimestamp(),
            ultima_actividad: serverTimestamp()
        });
        console.log('✅ Usuario de ejemplo creado');

        // 4. Crear configuración general
        console.log('🔧 Configurando sistema...');
        const configRef = doc(db, 'configuracion', 'general');
        await setDoc(configRef, {
            version: '1.0.0',
            fecha_instalacion: serverTimestamp(),
            configurado: true,
            total_cafeterias: cafeteriasData.length,
            total_productos: productosCreados,
            moneda: 'USD',
            iva_incluido: true,
            tiempo_limite_carrito: 30, // minutos
            pedido_minimo: 5.00
        });

        console.log('🎉 ¡Base de datos configurada exitosamente!');
        console.log(`📊 Resumen:`);
        console.log(`   - ${cafeteriasData.length} cafeterías`);
        console.log(`   - ${productosCreados} productos`);
        console.log(`   - 1 usuario de ejemplo`);
        console.log(`   - Configuración general establecida`);

        return {
            success: true,
            cafeterias: cafeteriasData.length,
            productos: productosCreados,
            usuarios: 1
        };

    } catch (error) {
        console.error('❌ Error configurando Firebase:', error);
        throw new Error(`Error en configuración: ${error.message}`);
    }
};

// Función para probar la conexión
export const testFirebaseConnection = async () => {
    try {
        console.log('🔍 Probando conexión con Firebase...');
        
        // Intentar leer la configuración
        const configRef = doc(db, 'configuracion', 'general');
        const configDoc = await getDoc(configRef);
        
        if (configDoc.exists()) {
            console.log('✅ Conexión exitosa - Base de datos ya configurada');
            const config = configDoc.data();
            console.log('📋 Configuración actual:', config);
            return true;
        } else {
            console.log('⚠️ Conexión exitosa pero base de datos no configurada');
            return true;
        }
        
    } catch (error) {
        console.error('❌ Error probando conexión:', error);
        return false;
    }
};

// Función para verificar el estado del sistema
export const verifySystemStatus = async () => {
    try {
        const status = {
            cafeterias: 0,
            productos: 0,
            usuarios: 0,
            configurado: false
        };

        // Verificar configuración
        const configRef = doc(db, 'configuracion', 'general');
        const configDoc = await getDoc(configRef);
        
        if (configDoc.exists()) {
            status.configurado = true;
            const config = configDoc.data();
            status.cafeterias = config.total_cafeterias || 0;
            status.productos = config.total_productos || 0;
        }

        // Contar documentos reales
        const cafeteriasSnapshot = await getDocs(collection(db, 'cafeterias'));
        status.cafeterias = cafeteriasSnapshot.size;

        const productosSnapshot = await getDocs(collection(db, 'productos'));
        status.productos = productosSnapshot.size;

        const usuariosSnapshot = await getDocs(collection(db, 'usuarios'));
        status.usuarios = usuariosSnapshot.size;

        return status;
        
    } catch (error) {
        console.error('Error verificando estado:', error);
        throw error;
    }
};

// Función para limpiar base de datos (solo para desarrollo)
export const cleanDatabase = async () => {
    try {
        console.log('🧹 Limpiando base de datos...');
        
        const collections = ['cafeterias', 'productos', 'usuarios', 'carritos', 'pedidos', 'configuracion'];
        let totalDeleted = 0;
        
        for (const collectionName of collections) {
            const snapshot = await getDocs(collection(db, collectionName));
            
            if (!snapshot.empty) {
                const batch = writeBatch(db);
                
                snapshot.docs.forEach(docSnapshot => {
                    batch.delete(docSnapshot.ref);
                });
                
                await batch.commit();
                console.log(`🗑️ Colección ${collectionName} limpiada (${snapshot.size} documentos)`);
                totalDeleted += snapshot.size;
            }
        }
        
        console.log(`✅ Base de datos limpiada completamente (${totalDeleted} documentos eliminados)`);
        return true;
        
    } catch (error) {
        console.error('❌ Error limpiando base de datos:', error);
        throw error;
    }
};

// Función para exportar datos
export const exportDatabaseData = async () => {
    try {
        console.log('📥 Exportando datos...');
        
        const exportData = {
            timestamp: new Date().toISOString(),
            cafeterias: [],
            productos: [],
            usuarios: [],
            configuracion: null
        };

        // Exportar cafeterías
        const cafeteriasSnapshot = await getDocs(collection(db, 'cafeterias'));
        exportData.cafeterias = cafeteriasSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        // Exportar productos
        const productosSnapshot = await getDocs(collection(db, 'productos'));
        exportData.productos = productosSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        // Exportar usuarios (sin contraseñas)
        const usuariosSnapshot = await getDocs(collection(db, 'usuarios'));
        exportData.usuarios = usuariosSnapshot.docs.map(doc => {
            const data = doc.data();
            delete data.contrasena; // Remover contraseña por seguridad
            return {
                id: doc.id,
                ...data
            };
        });

        // Exportar configuración
        const configRef = doc(db, 'configuracion', 'general');
        const configDoc = await getDoc(configRef);
        if (configDoc.exists()) {
            exportData.configuracion = configDoc.data();
        }

        // Crear archivo para descarga
        const dataStr = JSON.stringify(exportData, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `utp-pedidos-backup-${new Date().toISOString().split('T')[0]}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        
        console.log('✅ Datos exportados exitosamente');
        return exportData;
        
    } catch (error) {
        console.error('❌ Error exportando datos:', error);
        throw error;
    }
};