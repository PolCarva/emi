require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Admin = require('../models/Admin');
const Profesor = require('../models/Profesor');
const Alumno = require('../models/Alumno');
const Rutina = require('../models/Rutina');
const { createDefaultExercisesForProfesor } = require('../scripts/create-default-exercises');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB conectado');
  } catch (error) {
    console.error('❌ Error conectando a MongoDB:', error);
    process.exit(1);
  }
};

// Biblioteca completa de ejercicios
    const ejerciciosBiblioteca = [
  // Pecho
      { nombre: 'Press de Banca con Barra', videoUrl: 'https://www.youtube.com/watch?v=rT7DgCr-3pg' },
      { nombre: 'Press Inclinado con Mancuernas', videoUrl: 'https://www.youtube.com/watch?v=8iPEnov-lmU' },
  { nombre: 'Press Declinado con Barra', videoUrl: 'https://www.youtube.com/watch?v=eozdVDA78K0' },
      { nombre: 'Aperturas con Mancuernas', videoUrl: 'https://www.youtube.com/watch?v=eozdVDA78K0' },
      { nombre: 'Fondos en Paralelas', videoUrl: 'https://www.youtube.com/watch?v=6kALZikXxLc' },
  { nombre: 'Press con Mancuernas en Banco Inclinado', videoUrl: 'https://www.youtube.com/watch?v=8iPEnov-lmU' },
  
  // Tríceps
      { nombre: 'Extensión de Tríceps en Polea', videoUrl: 'https://www.youtube.com/watch?v=6kALZikXxLc' },
      { nombre: 'Press Francés con Barra', videoUrl: 'https://www.youtube.com/watch?v=riAv1C1GJpk' },
  { nombre: 'Fondos en Paralelas', videoUrl: 'https://www.youtube.com/watch?v=6kALZikXxLc' },
  { nombre: 'Extensión de Tríceps con Mancuerna', videoUrl: 'https://www.youtube.com/watch?v=riAv1C1GJpk' },
  
  // Espalda
      { nombre: 'Peso Muerto', videoUrl: 'https://www.youtube.com/watch?v=op9kVnSso6Q' },
      { nombre: 'Remo con Barra', videoUrl: 'https://www.youtube.com/watch?v=paHWV6Nq5eo' },
      { nombre: 'Dominadas Asistidas', videoUrl: 'https://www.youtube.com/watch?v=eGo4IYlbE5g' },
      { nombre: 'Remo con Mancuerna a Un Brazo', videoUrl: 'https://www.youtube.com/watch?v=roCP6wCXPqo' },
  { nombre: 'Jalón al Pecho', videoUrl: 'https://www.youtube.com/watch?v=eGo4IYlbE5g' },
  { nombre: 'Remo T-Bar', videoUrl: 'https://www.youtube.com/watch?v=paHWV6Nq5eo' },
  { nombre: 'Peso Muerto Rumano', videoUrl: 'https://www.youtube.com/watch?v=JCXUYuzwNrM' },
  
  // Bíceps
      { nombre: 'Curl de Bíceps con Barra', videoUrl: 'https://www.youtube.com/watch?v=ykJmrZ5v0Oo' },
      { nombre: 'Curl Martillo con Mancuernas', videoUrl: 'https://www.youtube.com/watch?v=zC3nNmEHjq0' },
      { nombre: 'Curl Concentrado', videoUrl: 'https://www.youtube.com/watch?v=0AIGkKijH7s' },
  { nombre: 'Curl con Mancuernas Alternado', videoUrl: 'https://www.youtube.com/watch?v=ykJmrZ5v0Oo' },
  { nombre: 'Curl en Polea', videoUrl: 'https://www.youtube.com/watch?v=ykJmrZ5v0Oo' },
  
  // Piernas
      { nombre: 'Sentadilla', videoUrl: 'https://www.youtube.com/watch?v=YaXPRqUwItQ' },
      { nombre: 'Prensa de Piernas', videoUrl: 'https://www.youtube.com/watch?v=IZxyjW8MPJY' },
      { nombre: 'Extensiones de Cuádriceps', videoUrl: 'https://www.youtube.com/watch?v=YyvSfVjQeLs' },
  { nombre: 'Sentadilla Búlgara', videoUrl: 'https://www.youtube.com/watch?v=YaXPRqUwItQ' },
  { nombre: 'Zancadas', videoUrl: 'https://www.youtube.com/watch?v=YaXPRqUwItQ' },
  
  // Femoral y Glúteos
      { nombre: 'Curl Femoral Acostado', videoUrl: 'https://www.youtube.com/watch?v=1Tq3QdYUuHs' },
      { nombre: 'Hip Thrust con Barra', videoUrl: 'https://www.youtube.com/watch?v=Zp26q4BY5HE' },
      { nombre: 'Prensa de Glúteos', videoUrl: 'https://www.youtube.com/watch?v=Wp4BlxcFTkE' },
  { nombre: 'Peso Muerto Rumano', videoUrl: 'https://www.youtube.com/watch?v=JCXUYuzwNrM' },
  { nombre: 'Patada de Glúteo en Polea', videoUrl: 'https://www.youtube.com/watch?v=Wp4BlxcFTkE' },
  
  // Gemelos
      { nombre: 'Elevación de Gemelos de Pie', videoUrl: 'https://www.youtube.com/watch?v=3VcKaXpzqRo' },
      { nombre: 'Elevación de Gemelos Sentado', videoUrl: 'https://www.youtube.com/watch?v=3VcKaXpzqRo' },
  { nombre: 'Elevación de Gemelos en Prensa', videoUrl: 'https://www.youtube.com/watch?v=3VcKaXpzqRo' },
  
  // Hombros
      { nombre: 'Press Militar con Barra', videoUrl: 'https://www.youtube.com/watch?v=2yjwXTZQDDI' },
      { nombre: 'Elevaciones Laterales con Mancuernas', videoUrl: 'https://www.youtube.com/watch?v=3VcKaXpzqRo' },
      { nombre: 'Elevaciones Frontales con Mancuernas', videoUrl: 'https://www.youtube.com/watch?v=3VcKaXpzqRo' },
      { nombre: 'Vuelos Laterales en Máquina', videoUrl: 'https://www.youtube.com/watch?v=3VcKaXpzqRo' },
      { nombre: 'Vuelos Invertidos con Mancuernas', videoUrl: 'https://www.youtube.com/watch?v=3VcKaXpzqRo' },
      { nombre: 'Face Pull con Polea', videoUrl: 'https://www.youtube.com/watch?v=rep-qVOkqgk' },
  { nombre: 'Press Arnold', videoUrl: 'https://www.youtube.com/watch?v=2yjwXTZQDDI' },
  
  // Abdomen
      { nombre: 'Crunch Abdominal', videoUrl: 'https://www.youtube.com/watch?v=3VcKaXpzqRo' },
      { nombre: 'Plancha', videoUrl: 'https://www.youtube.com/watch?v=pSHjTRCQxIw' },
  { nombre: 'Elevación de Piernas', videoUrl: 'https://www.youtube.com/watch?v=3VcKaXpzqRo' },
  { nombre: 'Russian Twist', videoUrl: 'https://www.youtube.com/watch?v=3VcKaXpzqRo' },
  { nombre: 'Mountain Climbers', videoUrl: 'https://www.youtube.com/watch?v=pSHjTRCQxIw' }
];

// Helper para obtener ejercicio de la biblioteca
const obtenerEjercicio = (nombre) => {
  return ejerciciosBiblioteca.find(ej => ej.nombre === nombre) || ejerciciosBiblioteca[0];
};

// Helper para generar fecha de una semana específica
    const obtenerFechaSemana = (semanaNumero, diaSemana) => {
      const hoy = new Date();
      const semanasAtras = semanaNumero - 1;
      const fechaBase = new Date(hoy);
      fechaBase.setDate(fechaBase.getDate() - (semanasAtras * 7) - (7 - diaSemana));
      return fechaBase;
    };

// Generar historial de progreso para un alumno
const generarHistorialProgreso = (numSemanas, ejerciciosPrincipales) => {
    const historialSemanas = [];
  
  for (let semana = 1; semana <= numSemanas; semana++) {
      const diasSemana = [];
      const diasEntrenamiento = semana % 2 === 0 ? 4 : 3;
      
      for (let dia = 1; dia <= diasEntrenamiento; dia++) {
        const fecha = obtenerFechaSemana(semana, dia);
        const ejerciciosProgreso = [];
        
        const numEjercicios = 2 + (dia % 2);
        for (let i = 0; i < numEjercicios && i < ejerciciosPrincipales.length; i++) {
          const ejercicio = ejerciciosPrincipales[i];
          const pesoActual = ejercicio.pesoInicial + (ejercicio.incremento * (semana - 1));
        const repeticiones = 8 + Math.floor(Math.random() * 3);
          const volumen = pesoActual * repeticiones;
          
          ejerciciosProgreso.push({
            ejercicioId: ejercicio.nombre,
            pesoReal: pesoActual,
            repeticionesReal: repeticiones,
            volumenReal: volumen
          });
        }
        
        diasSemana.push({
          fecha: fecha,
          observaciones: semana === 1 && dia === 1 
            ? 'Primera semana, me siento bien'
            : semana === 3 && dia === 2
            ? 'Noto mejoras en la resistencia'
            : semana === 5 && dia === 1
            ? 'Gran progreso esta semana'
            : '',
          ejercicios: ejerciciosProgreso
        });
      }
      
      historialSemanas.push({
        numeroSemana: semana,
        dias: diasSemana
      });
    }

  return historialSemanas;
};

// Crear rutina de ejemplo
const crearRutina = (alumno, profesor, numDias, nivel, genero, edad) => {
  const rutinas = {
    3: {
      dias: [
        {
          nombre: 'Día 1: Tren Superior',
          bloques: [
            {
              nombre: 'Pecho y Tríceps',
              ejercicios: [
                { nombre: obtenerEjercicio('Press de Banca con Barra').nombre, videoUrl: obtenerEjercicio('Press de Banca con Barra').videoUrl, series: 4, repeticiones: 8, peso: null, pausa: 120, volumen: 0 },
                { nombre: obtenerEjercicio('Press Inclinado con Mancuernas').nombre, videoUrl: obtenerEjercicio('Press Inclinado con Mancuernas').videoUrl, series: 3, repeticiones: 10, peso: null, pausa: 90, volumen: 0 },
                { nombre: obtenerEjercicio('Fondos en Paralelas').nombre, videoUrl: obtenerEjercicio('Fondos en Paralelas').videoUrl, series: 3, repeticiones: 10, peso: null, pausa: 90, volumen: 0 }
              ]
            }
          ]
        },
        {
          nombre: 'Día 2: Tren Inferior',
          bloques: [
            {
              nombre: 'Piernas y Glúteos',
              ejercicios: [
                { nombre: obtenerEjercicio('Sentadilla').nombre, videoUrl: obtenerEjercicio('Sentadilla').videoUrl, series: 4, repeticiones: 8, peso: null, pausa: 180, volumen: 0 },
                { nombre: obtenerEjercicio('Prensa de Piernas').nombre, videoUrl: obtenerEjercicio('Prensa de Piernas').videoUrl, series: 4, repeticiones: 10, peso: null, pausa: 120, volumen: 0 },
                { nombre: obtenerEjercicio('Hip Thrust con Barra').nombre, videoUrl: obtenerEjercicio('Hip Thrust con Barra').videoUrl, series: 4, repeticiones: 10, peso: null, pausa: 120, volumen: 0 }
              ]
            }
          ]
        },
        {
          nombre: 'Día 3: Espalda y Bíceps',
          bloques: [
            {
              nombre: 'Espalda',
              ejercicios: [
                { nombre: obtenerEjercicio('Peso Muerto').nombre, videoUrl: obtenerEjercicio('Peso Muerto').videoUrl, series: 4, repeticiones: 6, peso: null, pausa: 180, volumen: 0 },
                { nombre: obtenerEjercicio('Remo con Barra').nombre, videoUrl: obtenerEjercicio('Remo con Barra').videoUrl, series: 4, repeticiones: 8, peso: null, pausa: 120, volumen: 0 },
                { nombre: obtenerEjercicio('Curl de Bíceps con Barra').nombre, videoUrl: obtenerEjercicio('Curl de Bíceps con Barra').videoUrl, series: 3, repeticiones: 10, peso: null, pausa: 60, volumen: 0 }
              ]
            }
          ]
        }
      ]
    },
    4: {
      dias: [
        {
          nombre: 'Día 1: Pecho y Tríceps',
          bloques: [
            {
              nombre: 'Pecho Principal',
              ejercicios: [
                { nombre: obtenerEjercicio('Press de Banca con Barra').nombre, videoUrl: obtenerEjercicio('Press de Banca con Barra').videoUrl, series: 4, repeticiones: 8, peso: null, pausa: 120, volumen: 0 },
                { nombre: obtenerEjercicio('Press Inclinado con Mancuernas').nombre, videoUrl: obtenerEjercicio('Press Inclinado con Mancuernas').videoUrl, series: 3, repeticiones: 10, peso: null, pausa: 90, volumen: 0 },
                { nombre: obtenerEjercicio('Aperturas con Mancuernas').nombre, videoUrl: obtenerEjercicio('Aperturas con Mancuernas').videoUrl, series: 3, repeticiones: 12, peso: null, pausa: 60, volumen: 0 }
              ]
            },
            {
              nombre: 'Tríceps',
              ejercicios: [
                { nombre: obtenerEjercicio('Fondos en Paralelas').nombre, videoUrl: obtenerEjercicio('Fondos en Paralelas').videoUrl, series: 3, repeticiones: 10, peso: null, pausa: 90, volumen: 0 },
                { nombre: obtenerEjercicio('Extensión de Tríceps en Polea').nombre, videoUrl: obtenerEjercicio('Extensión de Tríceps en Polea').videoUrl, series: 3, repeticiones: 12, peso: null, pausa: 60, volumen: 0 }
              ]
            }
          ]
        },
        {
          nombre: 'Día 2: Espalda y Bíceps',
          bloques: [
            {
              nombre: 'Espalda Principal',
              ejercicios: [
                { nombre: obtenerEjercicio('Peso Muerto').nombre, videoUrl: obtenerEjercicio('Peso Muerto').videoUrl, series: 4, repeticiones: 6, peso: null, pausa: 180, volumen: 0 },
                { nombre: obtenerEjercicio('Remo con Barra').nombre, videoUrl: obtenerEjercicio('Remo con Barra').videoUrl, series: 4, repeticiones: 8, peso: null, pausa: 120, volumen: 0 },
                { nombre: obtenerEjercicio('Dominadas Asistidas').nombre, videoUrl: obtenerEjercicio('Dominadas Asistidas').videoUrl, series: 3, repeticiones: 8, peso: null, pausa: 90, volumen: 0 }
              ]
            },
            {
              nombre: 'Bíceps',
              ejercicios: [
                { nombre: obtenerEjercicio('Curl de Bíceps con Barra').nombre, videoUrl: obtenerEjercicio('Curl de Bíceps con Barra').videoUrl, series: 3, repeticiones: 10, peso: null, pausa: 60, volumen: 0 },
                { nombre: obtenerEjercicio('Curl Martillo con Mancuernas').nombre, videoUrl: obtenerEjercicio('Curl Martillo con Mancuernas').videoUrl, series: 3, repeticiones: 12, peso: null, pausa: 60, volumen: 0 }
              ]
            }
          ]
        },
        {
          nombre: 'Día 3: Piernas y Glúteos',
          bloques: [
            {
              nombre: 'Cuádriceps',
              ejercicios: [
                { nombre: obtenerEjercicio('Sentadilla').nombre, videoUrl: obtenerEjercicio('Sentadilla').videoUrl, series: 4, repeticiones: 8, peso: null, pausa: 180, volumen: 0 },
                { nombre: obtenerEjercicio('Prensa de Piernas').nombre, videoUrl: obtenerEjercicio('Prensa de Piernas').videoUrl, series: 4, repeticiones: 10, peso: null, pausa: 120, volumen: 0 },
                { nombre: obtenerEjercicio('Extensiones de Cuádriceps').nombre, videoUrl: obtenerEjercicio('Extensiones de Cuádriceps').videoUrl, series: 3, repeticiones: 12, peso: null, pausa: 60, volumen: 0 }
              ]
            },
            {
              nombre: 'Femoral y Glúteos',
              ejercicios: [
                { nombre: obtenerEjercicio('Peso Muerto Rumano').nombre, videoUrl: obtenerEjercicio('Peso Muerto Rumano').videoUrl, series: 4, repeticiones: 10, peso: null, pausa: 120, volumen: 0 },
                { nombre: obtenerEjercicio('Hip Thrust con Barra').nombre, videoUrl: obtenerEjercicio('Hip Thrust con Barra').videoUrl, series: 4, repeticiones: 10, peso: null, pausa: 120, volumen: 0 }
              ]
            }
          ]
        },
        {
          nombre: 'Día 4: Hombros y Abdomen',
          bloques: [
            {
              nombre: 'Hombros',
              ejercicios: [
                { nombre: obtenerEjercicio('Press Militar con Barra').nombre, videoUrl: obtenerEjercicio('Press Militar con Barra').videoUrl, series: 4, repeticiones: 8, peso: null, pausa: 120, volumen: 0 },
                { nombre: obtenerEjercicio('Elevaciones Laterales con Mancuernas').nombre, videoUrl: obtenerEjercicio('Elevaciones Laterales con Mancuernas').videoUrl, series: 3, repeticiones: 12, peso: null, pausa: 60, volumen: 0 },
                { nombre: obtenerEjercicio('Face Pull con Polea').nombre, videoUrl: obtenerEjercicio('Face Pull con Polea').videoUrl, series: 3, repeticiones: 15, peso: null, pausa: 60, volumen: 0 }
              ]
            },
            {
              nombre: 'Abdomen',
              ejercicios: [
                { nombre: obtenerEjercicio('Crunch Abdominal').nombre, videoUrl: obtenerEjercicio('Crunch Abdominal').videoUrl, series: 3, repeticiones: 20, peso: null, pausa: 45, volumen: 0 },
                { nombre: obtenerEjercicio('Plancha').nombre, videoUrl: obtenerEjercicio('Plancha').videoUrl, series: 3, repeticiones: 1, peso: null, pausa: 60, volumen: 0 }
              ]
            }
          ]
        }
      ]
    },
    5: {
      dias: [
        {
          nombre: 'Día 1: Pecho',
          bloques: [
            {
              nombre: 'Pecho Principal',
              ejercicios: [
                { nombre: obtenerEjercicio('Press de Banca con Barra').nombre, videoUrl: obtenerEjercicio('Press de Banca con Barra').videoUrl, series: 4, repeticiones: 8, peso: null, pausa: 120, volumen: 0 },
                { nombre: obtenerEjercicio('Press Inclinado con Mancuernas').nombre, videoUrl: obtenerEjercicio('Press Inclinado con Mancuernas').videoUrl, series: 3, repeticiones: 10, peso: null, pausa: 90, volumen: 0 },
                { nombre: obtenerEjercicio('Aperturas con Mancuernas').nombre, videoUrl: obtenerEjercicio('Aperturas con Mancuernas').videoUrl, series: 3, repeticiones: 12, peso: null, pausa: 60, volumen: 0 }
              ]
            },
            {
              nombre: 'Tríceps',
              ejercicios: [
                { nombre: obtenerEjercicio('Fondos en Paralelas').nombre, videoUrl: obtenerEjercicio('Fondos en Paralelas').videoUrl, series: 3, repeticiones: 10, peso: null, pausa: 90, volumen: 0 },
                { nombre: obtenerEjercicio('Extensión de Tríceps en Polea').nombre, videoUrl: obtenerEjercicio('Extensión de Tríceps en Polea').videoUrl, series: 3, repeticiones: 12, peso: null, pausa: 60, volumen: 0 }
              ]
            }
          ]
        },
        {
          nombre: 'Día 2: Espalda',
          bloques: [
            {
              nombre: 'Espalda Principal',
              ejercicios: [
                { nombre: obtenerEjercicio('Peso Muerto').nombre, videoUrl: obtenerEjercicio('Peso Muerto').videoUrl, series: 4, repeticiones: 6, peso: null, pausa: 180, volumen: 0 },
                { nombre: obtenerEjercicio('Remo con Barra').nombre, videoUrl: obtenerEjercicio('Remo con Barra').videoUrl, series: 4, repeticiones: 8, peso: null, pausa: 120, volumen: 0 },
                { nombre: obtenerEjercicio('Dominadas Asistidas').nombre, videoUrl: obtenerEjercicio('Dominadas Asistidas').videoUrl, series: 3, repeticiones: 8, peso: null, pausa: 90, volumen: 0 },
                { nombre: obtenerEjercicio('Remo con Mancuerna a Un Brazo').nombre, videoUrl: obtenerEjercicio('Remo con Mancuerna a Un Brazo').videoUrl, series: 3, repeticiones: 10, peso: null, pausa: 60, volumen: 0 }
              ]
            },
            {
              nombre: 'Bíceps',
              ejercicios: [
                { nombre: obtenerEjercicio('Curl de Bíceps con Barra').nombre, videoUrl: obtenerEjercicio('Curl de Bíceps con Barra').videoUrl, series: 3, repeticiones: 10, peso: null, pausa: 60, volumen: 0 },
                { nombre: obtenerEjercicio('Curl Martillo con Mancuernas').nombre, videoUrl: obtenerEjercicio('Curl Martillo con Mancuernas').videoUrl, series: 3, repeticiones: 12, peso: null, pausa: 60, volumen: 0 }
              ]
            }
          ]
        },
        {
          nombre: 'Día 3: Piernas',
          bloques: [
            {
              nombre: 'Cuádriceps',
              ejercicios: [
                { nombre: obtenerEjercicio('Sentadilla').nombre, videoUrl: obtenerEjercicio('Sentadilla').videoUrl, series: 4, repeticiones: 8, peso: null, pausa: 180, volumen: 0 },
                { nombre: obtenerEjercicio('Prensa de Piernas').nombre, videoUrl: obtenerEjercicio('Prensa de Piernas').videoUrl, series: 4, repeticiones: 10, peso: null, pausa: 120, volumen: 0 },
                { nombre: obtenerEjercicio('Extensiones de Cuádriceps').nombre, videoUrl: obtenerEjercicio('Extensiones de Cuádriceps').videoUrl, series: 3, repeticiones: 12, peso: null, pausa: 60, volumen: 0 }
              ]
            },
            {
              nombre: 'Femoral',
              ejercicios: [
                { nombre: obtenerEjercicio('Peso Muerto Rumano').nombre, videoUrl: obtenerEjercicio('Peso Muerto Rumano').videoUrl, series: 4, repeticiones: 10, peso: null, pausa: 120, volumen: 0 },
                { nombre: obtenerEjercicio('Curl Femoral Acostado').nombre, videoUrl: obtenerEjercicio('Curl Femoral Acostado').videoUrl, series: 3, repeticiones: 12, peso: null, pausa: 90, volumen: 0 }
              ]
            },
            {
              nombre: 'Glúteos',
              ejercicios: [
                { nombre: obtenerEjercicio('Hip Thrust con Barra').nombre, videoUrl: obtenerEjercicio('Hip Thrust con Barra').videoUrl, series: 4, repeticiones: 10, peso: null, pausa: 120, volumen: 0 },
                { nombre: obtenerEjercicio('Prensa de Glúteos').nombre, videoUrl: obtenerEjercicio('Prensa de Glúteos').videoUrl, series: 3, repeticiones: 15, peso: null, pausa: 60, volumen: 0 }
              ]
            },
            {
              nombre: 'Gemelos',
              ejercicios: [
                { nombre: obtenerEjercicio('Elevación de Gemelos de Pie').nombre, videoUrl: obtenerEjercicio('Elevación de Gemelos de Pie').videoUrl, series: 4, repeticiones: 15, peso: null, pausa: 60, volumen: 0 }
              ]
            }
          ]
        },
        {
          nombre: 'Día 4: Hombros',
          bloques: [
            {
              nombre: 'Hombros Principal',
              ejercicios: [
                { nombre: obtenerEjercicio('Press Militar con Barra').nombre, videoUrl: obtenerEjercicio('Press Militar con Barra').videoUrl, series: 4, repeticiones: 8, peso: null, pausa: 120, volumen: 0 },
                { nombre: obtenerEjercicio('Elevaciones Laterales con Mancuernas').nombre, videoUrl: obtenerEjercicio('Elevaciones Laterales con Mancuernas').videoUrl, series: 3, repeticiones: 12, peso: null, pausa: 60, volumen: 0 },
                { nombre: obtenerEjercicio('Elevaciones Frontales con Mancuernas').nombre, videoUrl: obtenerEjercicio('Elevaciones Frontales con Mancuernas').videoUrl, series: 3, repeticiones: 12, peso: null, pausa: 60, volumen: 0 }
              ]
            },
            {
              nombre: 'Deltoides Posterior',
              ejercicios: [
                { nombre: obtenerEjercicio('Vuelos Invertidos con Mancuernas').nombre, videoUrl: obtenerEjercicio('Vuelos Invertidos con Mancuernas').videoUrl, series: 3, repeticiones: 12, peso: null, pausa: 60, volumen: 0 },
                { nombre: obtenerEjercicio('Face Pull con Polea').nombre, videoUrl: obtenerEjercicio('Face Pull con Polea').videoUrl, series: 3, repeticiones: 15, peso: null, pausa: 60, volumen: 0 }
              ]
            }
          ]
        },
        {
          nombre: 'Día 5: Brazo y Abdomen',
          bloques: [
            {
              nombre: 'Bíceps',
              ejercicios: [
                { nombre: obtenerEjercicio('Curl de Bíceps con Barra').nombre, videoUrl: obtenerEjercicio('Curl de Bíceps con Barra').videoUrl, series: 3, repeticiones: 10, peso: null, pausa: 60, volumen: 0 },
                { nombre: obtenerEjercicio('Curl Martillo con Mancuernas').nombre, videoUrl: obtenerEjercicio('Curl Martillo con Mancuernas').videoUrl, series: 3, repeticiones: 12, peso: null, pausa: 60, volumen: 0 },
                { nombre: obtenerEjercicio('Curl Concentrado').nombre, videoUrl: obtenerEjercicio('Curl Concentrado').videoUrl, series: 3, repeticiones: 10, peso: null, pausa: 45, volumen: 0 }
              ]
            },
            {
              nombre: 'Tríceps',
              ejercicios: [
                { nombre: obtenerEjercicio('Press Francés con Barra').nombre, videoUrl: obtenerEjercicio('Press Francés con Barra').videoUrl, series: 3, repeticiones: 10, peso: null, pausa: 75, volumen: 0 },
                { nombre: obtenerEjercicio('Extensión de Tríceps en Polea').nombre, videoUrl: obtenerEjercicio('Extensión de Tríceps en Polea').videoUrl, series: 3, repeticiones: 12, peso: null, pausa: 60, volumen: 0 }
              ]
            },
            {
              nombre: 'Abdomen',
              ejercicios: [
                { nombre: obtenerEjercicio('Crunch Abdominal').nombre, videoUrl: obtenerEjercicio('Crunch Abdominal').videoUrl, series: 3, repeticiones: 20, peso: null, pausa: 45, volumen: 0 },
                { nombre: obtenerEjercicio('Plancha').nombre, videoUrl: obtenerEjercicio('Plancha').videoUrl, series: 3, repeticiones: 1, peso: null, pausa: 60, volumen: 0 },
                { nombre: obtenerEjercicio('Elevación de Piernas').nombre, videoUrl: obtenerEjercicio('Elevación de Piernas').videoUrl, series: 3, repeticiones: 15, peso: null, pausa: 45, volumen: 0 }
              ]
            }
          ]
        }
      ]
    },
    6: {
      dias: [
        {
          nombre: 'Día 1: Pecho y Tríceps',
          bloques: [
            {
              nombre: 'Pecho Principal',
              ejercicios: [
                { nombre: obtenerEjercicio('Press de Banca con Barra').nombre, videoUrl: obtenerEjercicio('Press de Banca con Barra').videoUrl, series: 4, repeticiones: 8, peso: null, pausa: 120, volumen: 0 },
                { nombre: obtenerEjercicio('Press Inclinado con Mancuernas').nombre, videoUrl: obtenerEjercicio('Press Inclinado con Mancuernas').videoUrl, series: 3, repeticiones: 10, peso: null, pausa: 90, volumen: 0 },
                { nombre: obtenerEjercicio('Aperturas con Mancuernas').nombre, videoUrl: obtenerEjercicio('Aperturas con Mancuernas').videoUrl, series: 3, repeticiones: 12, peso: null, pausa: 60, volumen: 0 }
              ]
            },
            {
              nombre: 'Tríceps',
              ejercicios: [
                { nombre: obtenerEjercicio('Fondos en Paralelas').nombre, videoUrl: obtenerEjercicio('Fondos en Paralelas').videoUrl, series: 3, repeticiones: 10, peso: null, pausa: 90, volumen: 0 },
                { nombre: obtenerEjercicio('Extensión de Tríceps en Polea').nombre, videoUrl: obtenerEjercicio('Extensión de Tríceps en Polea').videoUrl, series: 3, repeticiones: 12, peso: null, pausa: 60, volumen: 0 }
              ]
            }
          ]
        },
        {
          nombre: 'Día 2: Espalda y Bíceps',
          bloques: [
            {
              nombre: 'Espalda Principal',
              ejercicios: [
                { nombre: obtenerEjercicio('Peso Muerto').nombre, videoUrl: obtenerEjercicio('Peso Muerto').videoUrl, series: 4, repeticiones: 6, peso: null, pausa: 180, volumen: 0 },
                { nombre: obtenerEjercicio('Remo con Barra').nombre, videoUrl: obtenerEjercicio('Remo con Barra').videoUrl, series: 4, repeticiones: 8, peso: null, pausa: 120, volumen: 0 },
                { nombre: obtenerEjercicio('Dominadas Asistidas').nombre, videoUrl: obtenerEjercicio('Dominadas Asistidas').videoUrl, series: 3, repeticiones: 8, peso: null, pausa: 90, volumen: 0 }
              ]
            },
            {
              nombre: 'Bíceps',
              ejercicios: [
                { nombre: obtenerEjercicio('Curl de Bíceps con Barra').nombre, videoUrl: obtenerEjercicio('Curl de Bíceps con Barra').videoUrl, series: 3, repeticiones: 10, peso: null, pausa: 60, volumen: 0 },
                { nombre: obtenerEjercicio('Curl Martillo con Mancuernas').nombre, videoUrl: obtenerEjercicio('Curl Martillo con Mancuernas').videoUrl, series: 3, repeticiones: 12, peso: null, pausa: 60, volumen: 0 }
              ]
            }
          ]
        },
        {
          nombre: 'Día 3: Piernas',
          bloques: [
            {
              nombre: 'Cuádriceps',
              ejercicios: [
                { nombre: obtenerEjercicio('Sentadilla').nombre, videoUrl: obtenerEjercicio('Sentadilla').videoUrl, series: 4, repeticiones: 8, peso: null, pausa: 180, volumen: 0 },
                { nombre: obtenerEjercicio('Prensa de Piernas').nombre, videoUrl: obtenerEjercicio('Prensa de Piernas').videoUrl, series: 4, repeticiones: 10, peso: null, pausa: 120, volumen: 0 },
                { nombre: obtenerEjercicio('Extensiones de Cuádriceps').nombre, videoUrl: obtenerEjercicio('Extensiones de Cuádriceps').videoUrl, series: 3, repeticiones: 12, peso: null, pausa: 60, volumen: 0 }
              ]
            },
            {
              nombre: 'Femoral y Glúteos',
              ejercicios: [
                { nombre: obtenerEjercicio('Peso Muerto Rumano').nombre, videoUrl: obtenerEjercicio('Peso Muerto Rumano').videoUrl, series: 4, repeticiones: 10, peso: null, pausa: 120, volumen: 0 },
                { nombre: obtenerEjercicio('Hip Thrust con Barra').nombre, videoUrl: obtenerEjercicio('Hip Thrust con Barra').videoUrl, series: 4, repeticiones: 10, peso: null, pausa: 120, volumen: 0 }
              ]
            }
          ]
        },
        {
          nombre: 'Día 4: Hombros',
          bloques: [
            {
              nombre: 'Hombros Principal',
              ejercicios: [
                { nombre: obtenerEjercicio('Press Militar con Barra').nombre, videoUrl: obtenerEjercicio('Press Militar con Barra').videoUrl, series: 4, repeticiones: 8, peso: null, pausa: 120, volumen: 0 },
                { nombre: obtenerEjercicio('Elevaciones Laterales con Mancuernas').nombre, videoUrl: obtenerEjercicio('Elevaciones Laterales con Mancuernas').videoUrl, series: 3, repeticiones: 12, peso: null, pausa: 60, volumen: 0 },
                { nombre: obtenerEjercicio('Elevaciones Frontales con Mancuernas').nombre, videoUrl: obtenerEjercicio('Elevaciones Frontales con Mancuernas').videoUrl, series: 3, repeticiones: 12, peso: null, pausa: 60, volumen: 0 }
              ]
            },
            {
              nombre: 'Deltoides Posterior',
              ejercicios: [
                { nombre: obtenerEjercicio('Vuelos Invertidos con Mancuernas').nombre, videoUrl: obtenerEjercicio('Vuelos Invertidos con Mancuernas').videoUrl, series: 3, repeticiones: 12, peso: null, pausa: 60, volumen: 0 },
                { nombre: obtenerEjercicio('Face Pull con Polea').nombre, videoUrl: obtenerEjercicio('Face Pull con Polea').videoUrl, series: 3, repeticiones: 15, peso: null, pausa: 60, volumen: 0 }
              ]
            }
          ]
        },
        {
          nombre: 'Día 5: Brazo',
          bloques: [
            {
              nombre: 'Bíceps',
              ejercicios: [
                { nombre: obtenerEjercicio('Curl de Bíceps con Barra').nombre, videoUrl: obtenerEjercicio('Curl de Bíceps con Barra').videoUrl, series: 3, repeticiones: 10, peso: null, pausa: 60, volumen: 0 },
                { nombre: obtenerEjercicio('Curl Martillo con Mancuernas').nombre, videoUrl: obtenerEjercicio('Curl Martillo con Mancuernas').videoUrl, series: 3, repeticiones: 12, peso: null, pausa: 60, volumen: 0 },
                { nombre: obtenerEjercicio('Curl Concentrado').nombre, videoUrl: obtenerEjercicio('Curl Concentrado').videoUrl, series: 3, repeticiones: 10, peso: null, pausa: 45, volumen: 0 }
              ]
            },
            {
              nombre: 'Tríceps',
              ejercicios: [
                { nombre: obtenerEjercicio('Press Francés con Barra').nombre, videoUrl: obtenerEjercicio('Press Francés con Barra').videoUrl, series: 3, repeticiones: 10, peso: null, pausa: 75, volumen: 0 },
                { nombre: obtenerEjercicio('Extensión de Tríceps en Polea').nombre, videoUrl: obtenerEjercicio('Extensión de Tríceps en Polea').videoUrl, series: 3, repeticiones: 12, peso: null, pausa: 60, volumen: 0 }
              ]
            }
          ]
        },
        {
          nombre: 'Día 6: Abdomen y Cardio',
          bloques: [
            {
              nombre: 'Abdomen',
              ejercicios: [
                { nombre: obtenerEjercicio('Crunch Abdominal').nombre, videoUrl: obtenerEjercicio('Crunch Abdominal').videoUrl, series: 3, repeticiones: 20, peso: null, pausa: 45, volumen: 0 },
                { nombre: obtenerEjercicio('Plancha').nombre, videoUrl: obtenerEjercicio('Plancha').videoUrl, series: 3, repeticiones: 1, peso: null, pausa: 60, volumen: 0 },
                { nombre: obtenerEjercicio('Elevación de Piernas').nombre, videoUrl: obtenerEjercicio('Elevación de Piernas').videoUrl, series: 3, repeticiones: 15, peso: null, pausa: 45, volumen: 0 },
                { nombre: obtenerEjercicio('Russian Twist').nombre, videoUrl: obtenerEjercicio('Russian Twist').videoUrl, series: 3, repeticiones: 20, peso: null, pausa: 45, volumen: 0 }
              ]
            }
          ]
        }
      ]
    }
  };
  
  return rutinas[numDias] || rutinas[4];
};

const seed = async () => {
  try {
    await connectDB();

    // Limpiar base de datos
    console.log('🗑️  Limpiando base de datos...');
    await Admin.deleteMany({});
    await Profesor.deleteMany({});
    await Alumno.deleteMany({});
    await Rutina.deleteMany({});
    console.log('✅ Base de datos limpiada\n');

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('123456', salt);

    // ========== CREAR ADMIN ==========
    console.log('👤 Creando administrador...');
    const admin = new Admin({
      nombre: 'Admin Principal',
      email: 'admin@emi.com',
      passwordHash
    });
    await admin.save();
    console.log(`✅ Admin creado: ${admin.email}\n`);

    // ========== CREAR PROFESORES ==========
    console.log('👨‍🏫 Creando profesores...');
    const profesores = [];
    
    const profesoresData = [
      { nombre: 'Juan Pérez', email: 'profesor@ejemplo.com' },
      { nombre: 'María González', email: 'maria.gonzalez@ejemplo.com' },
      { nombre: 'Carlos Rodríguez', email: 'carlos.rodriguez@ejemplo.com' },
      { nombre: 'Ana Martínez', email: 'ana.martinez@ejemplo.com' }
    ];

    for (const profData of profesoresData) {
      const profesor = new Profesor({
        nombre: profData.nombre,
        email: profData.email,
        passwordHash
      });
      await profesor.save();
      await createDefaultExercisesForProfesor(profesor);
      profesores.push(profesor);
      console.log(`✅ Profesor creado: ${profesor.nombre} (${profesor.email})`);
    }
    console.log(`\n✅ ${profesores.length} profesores creados\n`);

    // ========== CREAR ALUMNOS ==========
    console.log('👥 Creando alumnos...');
    const alumnos = [];
    
    const alumnosData = [
      // Alumnos sin rutina
      { nombre: 'Pedro Sánchez', email: 'pedro.sanchez@ejemplo.com', profesor: 0, rutina: null, nivel: 'Principiante', genero: 'Masculino', edad: 22, historial: 0 },
      { nombre: 'Laura Fernández', email: 'laura.fernandez@ejemplo.com', profesor: 1, rutina: null, nivel: 'Intermedio', genero: 'Femenino', edad: 28, historial: 0 },
      
      // Alumnos con rutina de 3 días
      { nombre: 'Miguel Torres', email: 'miguel.torres@ejemplo.com', profesor: 0, rutina: 3, nivel: 'Principiante', genero: 'Masculino', edad: 19, historial: 3 },
      
      // Alumnos con rutina de 4 días
      { nombre: 'Sofía López', email: 'sofia.lopez@ejemplo.com', profesor: 0, rutina: 4, nivel: 'Intermedio', genero: 'Femenino', edad: 25, historial: 5 },
      { nombre: 'Diego Ramírez', email: 'diego.ramirez@ejemplo.com', profesor: 1, rutina: 4, nivel: 'Intermedio', genero: 'Masculino', edad: 30, historial: 4 },
      
      // Alumnos con rutina de 5 días
      { nombre: 'Valentina Morales', email: 'valentina.morales@ejemplo.com', profesor: 1, rutina: 5, nivel: 'Avanzado', genero: 'Femenino', edad: 27, historial: 6 },
      { nombre: 'Andrés Castro', email: 'andres.castro@ejemplo.com', profesor: 2, rutina: 5, nivel: 'Avanzado', genero: 'Masculino', edad: 32, historial: 8 },
      
      // Alumnos con rutina de 6 días
      { nombre: 'Camila Herrera', email: 'camila.herrera@ejemplo.com', profesor: 2, rutina: 6, nivel: 'Avanzado', genero: 'Femenino', edad: 24, historial: 10 },
      { nombre: 'Roberto Silva', email: 'roberto.silva@ejemplo.com', profesor: 3, rutina: 6, nivel: 'Avanzado', genero: 'Masculino', edad: 35, historial: 12 },
      
      // Alumno con rutina pero sin historial
      { nombre: 'Elena Vargas', email: 'elena.vargas@ejemplo.com', profesor: 3, rutina: 4, nivel: 'Principiante', genero: 'Femenino', edad: 21, historial: 0 }
    ];

    for (let i = 0; i < alumnosData.length; i++) {
      const alumnoData = alumnosData[i];
      const profesor = profesores[alumnoData.profesor];
      
      const ejerciciosPrincipales = [
        { nombre: 'Press de Banca con Barra', pesoInicial: 20 + (i * 2), incremento: 2.5 },
        { nombre: 'Sentadilla', pesoInicial: 30 + (i * 3), incremento: 5 },
        { nombre: 'Peso Muerto', pesoInicial: 40 + (i * 4), incremento: 5 },
        { nombre: 'Press Militar con Barra', pesoInicial: 15 + (i * 1.5), incremento: 2.5 },
        { nombre: 'Remo con Barra', pesoInicial: 25 + (i * 2), incremento: 2.5 }
      ];

      const historialSemanas = alumnoData.historial > 0 
        ? generarHistorialProgreso(alumnoData.historial, ejerciciosPrincipales)
        : [];

      const alumno = new Alumno({
        nombre: alumnoData.nombre,
        email: alumnoData.email,
        passwordHash,
        profesorId: profesor._id,
        historialSemanas
      });
      
      await alumno.save();
      
      // Agregar alumno al profesor
      profesor.alumnos.push(alumno._id);
      await profesor.save();
      
      // Crear rutina si corresponde
      if (alumnoData.rutina) {
        const rutinaData = crearRutina(alumno, profesor, alumnoData.rutina, alumnoData.nivel, alumnoData.genero, alumnoData.edad);
        
        const rutina = new Rutina({
          alumnoId: alumno._id,
          profesorId: profesor._id,
          nombre: `Rutina ${alumnoData.rutina} días - ${alumnoData.nivel}`,
          genero: alumnoData.genero,
          objetivo: alumnoData.nivel === 'Principiante' ? 'Ganar fuerza y masa muscular' : 
                   alumnoData.nivel === 'Intermedio' ? 'Hipertrofia y definición' : 
                   'Máxima hipertrofia y fuerza',
          edad: alumnoData.edad,
          nivel: alumnoData.nivel,
          periodizacion: `${alumnoData.rutina * 2} semanas - Fase de volumen`,
          semanaActual: 1,
          dias: rutinaData.dias
        });
        
    await rutina.save();
    alumno.rutinaActualId = rutina._id;
    await alumno.save();

        console.log(`✅ Alumno creado: ${alumno.nombre} (${alumno.email}) - Rutina ${alumnoData.rutina} días - ${alumnoData.historial} semanas de progreso`);
      } else {
        console.log(`✅ Alumno creado: ${alumno.nombre} (${alumno.email}) - Sin rutina`);
      }
      
      alumnos.push(alumno);
    }

    console.log(`\n✅ ${alumnos.length} alumnos creados\n`);

    // ========== RESUMEN ==========
    console.log('═══════════════════════════════════════════════════════');
    console.log('📊 RESUMEN DEL SEED');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`\n👤 Admin:`);
    console.log(`   Email: admin@emi.com`);
    console.log(`   Password: 123456`);
    console.log(`\n👨‍🏫 Profesores (${profesores.length}):`);
    profesores.forEach((p, i) => {
      console.log(`   ${i + 1}. ${p.nombre} (${p.email})`);
    });
    console.log(`\n👥 Alumnos (${alumnos.length}):`);
    console.log(`   - Sin rutina: ${alumnosData.filter(a => !a.rutina).length}`);
    console.log(`   - Con rutina de 3 días: ${alumnosData.filter(a => a.rutina === 3).length}`);
    console.log(`   - Con rutina de 4 días: ${alumnosData.filter(a => a.rutina === 4).length}`);
    console.log(`   - Con rutina de 5 días: ${alumnosData.filter(a => a.rutina === 5).length}`);
    console.log(`   - Con rutina de 6 días: ${alumnosData.filter(a => a.rutina === 6).length}`);
    console.log(`\n🔑 Credenciales:`);
    console.log(`   Todos los usuarios tienen la contraseña: 123456`);
    console.log(`\n✅ Seed completado exitosamente!`);
    console.log('═══════════════════════════════════════════════════════\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error en seed:', error);
    process.exit(1);
  }
};

seed();
