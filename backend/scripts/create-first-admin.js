#!/usr/bin/env node

/**
 * Script para crear el primer administrador del sistema
 * Uso: node scripts/create-first-admin.js
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const readline = require('readline');
const Admin = require('../src/models/Admin');
require('dotenv').config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

async function createFirstAdmin() {
  try {
    // Conectar a MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    // Verificar si ya existe un admin
    const existingAdmin = await Admin.findOne();
    if (existingAdmin) {
      console.log('⚠️  Ya existe un administrador en el sistema');
      console.log(`   Admin existente: ${existingAdmin.nombre} (${existingAdmin.email})`);
      const respuesta = await askQuestion('\n¿Deseas recrear el administrador? (s/n): ');
      if (respuesta.toLowerCase() !== 's' && respuesta.toLowerCase() !== 'si' && respuesta.toLowerCase() !== 'y' && respuesta.toLowerCase() !== 'yes') {
        console.log('❌ Operación cancelada');
        process.exit(0);
      }
      console.log('🗑️  Eliminando administrador existente...');
      await Admin.deleteOne({ _id: existingAdmin._id });
      console.log('✅ Administrador existente eliminado\n');
    }

    console.log('🚀 Creando administrador del sistema...\n');

    // Pedir datos del admin
    const nombre = await askQuestion('Nombre completo: ');
    const email = await askQuestion('Email: ');
    const password = await askQuestion('Contraseña (mínimo 6 caracteres): ');

    if (!nombre.trim() || !email.trim() || !password.trim()) {
      console.log('❌ Todos los campos son obligatorios');
      process.exit(1);
    }

    if (password.length < 6) {
      console.log('❌ La contraseña debe tener al menos 6 caracteres');
      process.exit(1);
    }

    // Hash de la contraseña
    console.log('🔐 Generando hash de contraseña...');
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Crear admin
    const admin = new Admin({
      nombre: nombre.trim(),
      email: email.trim().toLowerCase(),
      passwordHash
    });

    await admin.save();

    console.log('\n✅ Administrador creado exitosamente!');
    console.log(`   Nombre: ${admin.nombre}`);
    console.log(`   Email: ${admin.email}`);
    console.log(`   ID: ${admin._id}`);
    console.log('\n🔑 Ahora puedes iniciar sesión como administrador en la aplicación.');
    console.log('   URL: http://localhost:3000/login');

  } catch (error) {
    console.error('❌ Error al crear administrador:', error.message);
    process.exit(1);
  } finally {
    rl.close();
    await mongoose.connection.close();
  }
}

createFirstAdmin();
