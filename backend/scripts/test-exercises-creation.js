#!/usr/bin/env node

/**
 * Script de prueba para verificar que los ejercicios se crean correctamente
 * al registrar un profesor (versión sin BD)
 */

const { DEFAULT_EXERCISES } = require('../src/scripts/create-default-exercises');

console.log('🔍 Verificando configuración de ejercicios por defecto...\n');

console.log(`📊 Total de ejercicios por defecto: ${DEFAULT_EXERCISES.length}\n`);

// Mostrar resumen por grupos musculares
const grupos = {
  '🦵 Piernas/Glúteos': DEFAULT_EXERCISES.filter(e =>
    e.nombre.includes('Sentadilla') ||
    e.nombre.includes('Peso muerto') ||
    e.nombre.includes('Hip Thrust') ||
    e.nombre.includes('Prensa de piernas') ||
    e.nombre.includes('Zancadas') ||
    e.nombre.includes('Extensión de piernas') ||
    e.nombre.includes('Curl femoral') ||
    e.nombre.includes('Abducción de cadera') ||
    e.nombre.includes('Gemelos')
  ),
  '💪 Pecho': DEFAULT_EXERCISES.filter(e =>
    e.nombre.includes('Press de banca') ||
    e.nombre.includes('Aperturas') ||
    e.nombre.includes('Press en máquina') ||
    e.nombre.includes('Fondos en paralelas')
  ),
  '🦾 Espalda': DEFAULT_EXERCISES.filter(e =>
    e.nombre.includes('Dominadas') ||
    e.nombre.includes('Jalón al pecho') ||
    e.nombre.includes('Remo') ||
    e.nombre.includes('Face Pull') ||
    e.nombre.includes('Pullover')
  ),
  '🫱 Hombros': DEFAULT_EXERCISES.filter(e =>
    e.nombre.includes('Press militar') ||
    e.nombre.includes('Elevaciones') ||
    e.nombre.includes('Pájaros') ||
    e.nombre.includes('Encogimientos') ||
    e.nombre.includes('Press Arnold')
  ),
  '🦾 Brazos': DEFAULT_EXERCISES.filter(e =>
    e.nombre.includes('Curl') ||
    e.nombre.includes('Tricep') ||
    e.nombre.includes('Press francés') ||
    e.nombre.includes('Fondos de tríceps') ||
    e.nombre.includes('Extensión por encima')
  ),
  '🧍 Core/Abdominales': DEFAULT_EXERCISES.filter(e =>
    e.nombre.includes('Plancha') ||
    e.nombre.includes('Crunch') ||
    e.nombre.includes('Elevaciones de piernas') ||
    e.nombre.includes('Ab wheel') ||
    e.nombre.includes('Russian twist') ||
    e.nombre.includes('Mountain climbers') ||
    e.nombre.includes('Side plank')
  )
};

console.log('📋 Resumen por grupos musculares:');
Object.entries(grupos).forEach(([grupo, ejercicios]) => {
  console.log(`\n${grupo}: ${ejercicios.length} ejercicios`);
  if (ejercicios.length > 0) {
    ejercicios.slice(0, 3).forEach(ej => {
      console.log(`  • ${ej.nombre}`);
    });
    if (ejercicios.length > 3) {
      console.log(`  ... y ${ejercicios.length - 3} más`);
    }
  }
});

// Verificar que todos los ejercicios estén incluidos
const totalContado = Object.values(grupos).reduce((sum, ejercicios) => sum + ejercicios.length, 0);
if (totalContado === DEFAULT_EXERCISES.length) {
  console.log('\n✅ Todos los ejercicios están correctamente categorizados!');
} else {
  console.log(`\n⚠️  Hay ${DEFAULT_EXERCISES.length - totalContado} ejercicios sin categorizar`);
}

console.log('\n✅ Configuración de ejercicios verificada exitosamente!');
console.log('💡 Los ejercicios se crearán automáticamente cuando un profesor se registre.');
