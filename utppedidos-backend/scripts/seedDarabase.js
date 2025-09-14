
// ===== scripts/seedDatabase.js =====
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const colors = require('colors');
require('dotenv').config();

// Importar modelos
const User = require('../models/User');
const connectDB = require('../config/database');

// Datos de prueba para usuarios
const sampleUsers = [
  {
    nombre: 'Administrador Principal',
    email: 'admin@utp.ac.pa',
    password: 'admin123',
    telefono: '+507 1234-5678',
    direccion: 'Campus UTP, Panamá',
    rol: 'admin',
    activo: true
  },
  {
    nombre: 'Juan Pérez',
    email: 'juan.perez@est.utp.ac.pa',
    password: 'estudiante123',
    telefono: '+507 9876-5432',
    direccion: 'San Miguelito, Panamá',
    rol: 'cliente',
    activo: true
  },
  {
    nombre: 'María González',
    email: 'maria.gonzalez@est.utp.ac.pa',
    password: 'estudiante123',
    telefono: '+507 5555-1234',
    direccion: 'Villa Lucre, Panamá',
    rol: 'cliente',
    activo: true
  },
  {
    nombre: 'Carlos Ruiz',
    email: 'carlos.ruiz@utp.ac.pa',
    password: 'empleado123',
    telefono: '+507 7777-8888',
    direccion: 'Pedregal, Panamá',
    rol: 'empleado',
    activo: true
  }
];

// Función principal de seedeo
async function seedDatabase() {
  try {
    console.log('🌱 Iniciando seedeo de la base de datos...'.yellow);
    
    // Conectar a la base de datos
    await connectDB();
    
    // Limpiar colección de usuarios
    await User.deleteMany({});
    console.log('🗑️  Usuarios existentes eliminados'.red);
    
    // Crear usuarios de prueba
    for (const userData of sampleUsers) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userData.password, salt);
      
      const user = new User({
        ...userData,
        password: hashedPassword
      });
      
      await user.save();
      console.log(`✅ Usuario creado: ${userData.email} (${userData.rol})`.green);
    }
    
    console.log('🎉 ¡Seedeo completado exitosamente!'.cyan.bold);
    console.log('');
    console.log('👤 Usuarios creados:'.yellow.bold);
    console.log('   Admin: admin@utp.ac.pa / admin123');
    console.log('   Estudiante 1: juan.perez@est.utp.ac.pa / estudiante123');
    console.log('   Estudiante 2: maria.gonzalez@est.utp.ac.pa / estudiante123');
    console.log('   Empleado: carlos.ruiz@utp.ac.pa / empleado123');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error en el seedeo:', error);
    process.exit(1);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;