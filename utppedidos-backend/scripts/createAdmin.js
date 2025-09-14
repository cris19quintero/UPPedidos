// ===== scripts/createAdmin.js =====
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const readline = require('readline');
const colors = require('colors');
require('dotenv').config();

const User = require('../models/User');
const connectDB = require('../config/database');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

async function createAdmin() {
  try {
    console.log('👤 Crear Administrador para UTPedidos'.cyan.bold);
    console.log('====================================='.cyan);
    
    await connectDB();
    
    const nombre = await askQuestion('Nombre completo: ');
    const email = await askQuestion('Email: ');
    const password = await askQuestion('Contraseña: ');
    const telefono = await askQuestion('Teléfono (opcional): ');
    
    // Verificar si el email ya existe
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      console.log('❌ Este email ya está registrado'.red);
      process.exit(1);
    }
    
    // Crear usuario admin
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    const admin = new User({
      nombre,
      email: email.toLowerCase(),
      password: hashedPassword,
      telefono: telefono || '',
      rol: 'admin',
      activo: true
    });
    
    await admin.save();
    
    console.log('');
    console.log('✅ Administrador creado exitosamente!'.green.bold);
    console.log(`📧 Email: ${email}`.yellow);
    console.log(`🔑 Contraseña: ${password}`.yellow);
    console.log(`👤 Rol: admin`.yellow);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creando administrador:', error);
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  createAdmin();
}

module.exports = createAdmin;