#!/usr/bin/env node

/**
 * Script para recrear el administrador del sistema
 * Uso: node scripts/recreate-admin.js "Nombre" "email@ejemplo.com" "password"
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Admin = require('../src/models/Admin');
require('dotenv').config();

async function recreateAdmin() {
  try {
    // Obtener argumentos de línea de comandos
    const nombre = process.argv[2];
    const email = process.argv[3];
    const password = process.argv[4];

    if (!nombre || !email || !password) {
      console.log('❌ Uso: node scripts/recreate-admin.js "Nombre" "email@ejemplo.com" "password"');
      process.exit(1);
    }

    if (password.length < 6) {
      console.log('❌ La contraseña debe tener al menos 6 caracteres');
      process.exit(1);
    }

    // Conectar a MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    // Eliminar admin existente si existe
    const existingAdmin = await Admin.findOne({ email: email.toLowerCase().trim() });
    if (existingAdmin) {
      console.log('🗑️  Eliminando administrador existente...');
      await Admin.deleteOne({ _id: existingAdmin._id });
      console.log('✅ Administrador existente eliminado');
    } else {
      // Eliminar todos los admins si no se encuentra por email
      const allAdmins = await Admin.find();
      if (allAdmins.length > 0) {
        console.log('🗑️  Eliminando administradores existentes...');
        await Admin.deleteMany({});
        console.log('✅ Administradores existentes eliminados');
      }
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
    await mongoose.connection.close();
  }
}

recreateAdmin();

