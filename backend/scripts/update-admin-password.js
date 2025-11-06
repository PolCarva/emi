#!/usr/bin/env node

/**
 * Script para actualizar la contraseña del administrador
 * Uso: node scripts/update-admin-password.js "email@ejemplo.com" "nuevaPassword"
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Admin = require('../src/models/Admin');
require('dotenv').config();

async function updateAdminPassword() {
  try {
    // Obtener argumentos de línea de comandos
    const email = process.argv[2];
    const password = process.argv[3];

    if (!email || !password) {
      console.log('❌ Uso: node scripts/update-admin-password.js "email@ejemplo.com" "nuevaPassword"');
      process.exit(1);
    }

    if (password.length < 6) {
      console.log('❌ La contraseña debe tener al menos 6 caracteres');
      process.exit(1);
    }

    // Conectar a MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    // Buscar admin
    const admin = await Admin.findOne({ email: email.toLowerCase().trim() });
    if (!admin) {
      console.log(`❌ No se encontró un administrador con el email: ${email}`);
      process.exit(1);
    }

    console.log(`✅ Administrador encontrado: ${admin.nombre} (${admin.email})`);

    // Generar nuevo hash de la contraseña
    console.log('🔐 Generando nuevo hash de contraseña...');
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Actualizar contraseña
    admin.passwordHash = passwordHash;
    await admin.save();

    console.log('\n✅ Contraseña actualizada exitosamente!');
    console.log(`   Email: ${admin.email}`);
    console.log(`   Nuevo hash: ${passwordHash.substring(0, 20)}...`);
    console.log('\n🔑 Ahora puedes iniciar sesión con la nueva contraseña.');
    console.log('   URL: http://localhost:3000/login');

  } catch (error) {
    console.error('❌ Error al actualizar contraseña:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
  }
}

updateAdminPassword();

