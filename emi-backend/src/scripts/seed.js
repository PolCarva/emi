require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Profesor = require('../models/Profesor');
const Alumno = require('../models/Alumno');
const Rutina = require('../models/Rutina');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB conectado');
  } catch (error) {
    console.error('Error conectando a MongoDB:', error);
    process.exit(1);
  }
};

const seed = async () => {
  try {
    await connectDB();

    // Limpiar base de datos
    console.log('Limpiando base de datos...');
    await Profesor.deleteMany({});
    await Alumno.deleteMany({});
    await Rutina.deleteMany({});

    // Definir todos los ejercicios que se usarán en la rutina
    const ejerciciosBiblioteca = [
      { nombre: 'Press de Banca con Barra', videoUrl: 'https://www.youtube.com/watch?v=rT7DgCr-3pg' },
      { nombre: 'Press Inclinado con Mancuernas', videoUrl: 'https://www.youtube.com/watch?v=8iPEnov-lmU' },
      { nombre: 'Aperturas con Mancuernas', videoUrl: 'https://www.youtube.com/watch?v=eozdVDA78K0' },
      { nombre: 'Fondos en Paralelas', videoUrl: 'https://www.youtube.com/watch?v=6kALZikXxLc' },
      { nombre: 'Extensión de Tríceps en Polea', videoUrl: 'https://www.youtube.com/watch?v=6kALZikXxLc' },
      { nombre: 'Press Francés con Barra', videoUrl: 'https://www.youtube.com/watch?v=riAv1C1GJpk' },
      { nombre: 'Peso Muerto', videoUrl: 'https://www.youtube.com/watch?v=op9kVnSso6Q' },
      { nombre: 'Remo con Barra', videoUrl: 'https://www.youtube.com/watch?v=paHWV6Nq5eo' },
      { nombre: 'Dominadas Asistidas', videoUrl: 'https://www.youtube.com/watch?v=eGo4IYlbE5g' },
      { nombre: 'Remo con Mancuerna a Un Brazo', videoUrl: 'https://www.youtube.com/watch?v=roCP6wCXPqo' },
      { nombre: 'Curl de Bíceps con Barra', videoUrl: 'https://www.youtube.com/watch?v=ykJmrZ5v0Oo' },
      { nombre: 'Curl Martillo con Mancuernas', videoUrl: 'https://www.youtube.com/watch?v=zC3nNmEHjq0' },
      { nombre: 'Curl Concentrado', videoUrl: 'https://www.youtube.com/watch?v=0AIGkKijH7s' },
      { nombre: 'Sentadilla', videoUrl: 'https://www.youtube.com/watch?v=YaXPRqUwItQ' },
      { nombre: 'Prensa de Piernas', videoUrl: 'https://www.youtube.com/watch?v=IZxyjW8MPJY' },
      { nombre: 'Extensiones de Cuádriceps', videoUrl: 'https://www.youtube.com/watch?v=YyvSfVjQeLs' },
      { nombre: 'Peso Muerto Rumano', videoUrl: 'https://www.youtube.com/watch?v=JCXUYuzwNrM' },
      { nombre: 'Curl Femoral Acostado', videoUrl: 'https://www.youtube.com/watch?v=1Tq3QdYUuHs' },
      { nombre: 'Hip Thrust con Barra', videoUrl: 'https://www.youtube.com/watch?v=Zp26q4BY5HE' },
      { nombre: 'Prensa de Glúteos', videoUrl: 'https://www.youtube.com/watch?v=Wp4BlxcFTkE' },
      { nombre: 'Elevación de Gemelos de Pie', videoUrl: 'https://www.youtube.com/watch?v=3VcKaXpzqRo' },
      { nombre: 'Elevación de Gemelos Sentado', videoUrl: 'https://www.youtube.com/watch?v=3VcKaXpzqRo' },
      { nombre: 'Press Militar con Barra', videoUrl: 'https://www.youtube.com/watch?v=2yjwXTZQDDI' },
      { nombre: 'Elevaciones Laterales con Mancuernas', videoUrl: 'https://www.youtube.com/watch?v=3VcKaXpzqRo' },
      { nombre: 'Elevaciones Frontales con Mancuernas', videoUrl: 'https://www.youtube.com/watch?v=3VcKaXpzqRo' },
      { nombre: 'Vuelos Laterales en Máquina', videoUrl: 'https://www.youtube.com/watch?v=3VcKaXpzqRo' },
      { nombre: 'Vuelos Invertidos con Mancuernas', videoUrl: 'https://www.youtube.com/watch?v=3VcKaXpzqRo' },
      { nombre: 'Face Pull con Polea', videoUrl: 'https://www.youtube.com/watch?v=rep-qVOkqgk' },
      { nombre: 'Crunch Abdominal', videoUrl: 'https://www.youtube.com/watch?v=3VcKaXpzqRo' },
      { nombre: 'Plancha', videoUrl: 'https://www.youtube.com/watch?v=pSHjTRCQxIw' },
      { nombre: 'Elevación de Piernas', videoUrl: 'https://www.youtube.com/watch?v=3VcKaXpzqRo' }
    ];

    // Crear profesor de ejemplo con todos los ejercicios
    console.log('Creando profesor de ejemplo...');
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('123456', salt);

    const profesor = new Profesor({
      nombre: 'Juan Pérez',
      email: 'profesor@ejemplo.com',
      passwordHash,
      ejercicios: ejerciciosBiblioteca
    });
    await profesor.save();
    console.log(`Profesor creado: ${profesor.email} con ${ejerciciosBiblioteca.length} ejercicios en su biblioteca`);

    // Crear alumno de ejemplo con semanas de progreso
    console.log('Creando alumno de ejemplo...');
    const alumnoPasswordHash = await bcrypt.hash('123456', salt);

    // Función helper para generar fecha de una semana específica
    const obtenerFechaSemana = (semanaNumero, diaSemana) => {
      const hoy = new Date();
      const semanasAtras = semanaNumero - 1;
      const fechaBase = new Date(hoy);
      fechaBase.setDate(fechaBase.getDate() - (semanasAtras * 7) - (7 - diaSemana));
      return fechaBase;
    };

    // Generar semanas de progreso (últimas 5 semanas)
    const historialSemanas = [];
    const ejerciciosPrincipales = [
      { nombre: 'Press de Banca con Barra', pesoInicial: 20, incremento: 2.5 },
      { nombre: 'Sentadilla', pesoInicial: 30, incremento: 5 },
      { nombre: 'Peso Muerto', pesoInicial: 40, incremento: 5 },
      { nombre: 'Press Militar con Barra', pesoInicial: 15, incremento: 2.5 },
      { nombre: 'Remo con Barra', pesoInicial: 25, incremento: 2.5 }
    ];

    for (let semana = 1; semana <= 5; semana++) {
      const diasSemana = [];
      
      // Generar 3-4 días de entrenamiento por semana
      const diasEntrenamiento = semana % 2 === 0 ? 4 : 3;
      
      for (let dia = 1; dia <= diasEntrenamiento; dia++) {
        const fecha = obtenerFechaSemana(semana, dia);
        const ejerciciosProgreso = [];
        
        // Agregar 2-3 ejercicios por día
        const numEjercicios = 2 + (dia % 2);
        for (let i = 0; i < numEjercicios && i < ejerciciosPrincipales.length; i++) {
          const ejercicio = ejerciciosPrincipales[i];
          const pesoActual = ejercicio.pesoInicial + (ejercicio.incremento * (semana - 1));
          const repeticiones = 8 + Math.floor(Math.random() * 3); // 8-10 repeticiones
          const volumen = pesoActual * repeticiones;
          
          // Usar el nombre del ejercicio como ID (o podríamos usar un índice)
          // El ejercicioId es un String según el schema, así que podemos usar el nombre
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

    const alumno = new Alumno({
      nombre: 'María García',
      email: 'alumno@ejemplo.com',
      passwordHash: alumnoPasswordHash,
      profesorId: profesor._id,
      historialSemanas: historialSemanas
    });
    await alumno.save();
    console.log(`Alumno creado: ${alumno.email} con ${historialSemanas.length} semanas de progreso`);

    // Agregar alumno a la lista del profesor
    profesor.alumnos.push(alumno._id);
    await profesor.save();

    // Función helper para obtener ejercicio de la biblioteca
    const obtenerEjercicio = (nombre) => {
      return ejerciciosBiblioteca.find(ej => ej.nombre === nombre);
    };

    // Crear rutina de ejemplo - Rutina de 4 días usando ejercicios de la biblioteca
    console.log('Creando rutina de ejemplo...');
    const rutina = new Rutina({
      alumnoId: alumno._id,
      profesorId: profesor._id,
      nombre: 'Rutina de Fuerza e Hipertrofia - 4 Días',
      genero: 'Femenino',
      objetivo: 'Ganar fuerza y masa muscular',
      edad: 28,
      nivel: 'Intermedio',
      periodizacion: '8 semanas - Fase de volumen',
      semanaActual: 1,
      dias: [
        {
          nombre: 'Día 1: Pecho y Tríceps',
          bloques: [
            {
              nombre: 'Bloque 1: Pecho Principal',
              ejercicios: [
                {
                  nombre: obtenerEjercicio('Press de Banca con Barra').nombre,
                  videoUrl: obtenerEjercicio('Press de Banca con Barra').videoUrl,
                  series: 4,
                  repeticiones: 8,
                  peso: null,
                  pausa: 120,
                  volumen: 0
                },
                {
                  nombre: obtenerEjercicio('Press Inclinado con Mancuernas').nombre,
                  videoUrl: obtenerEjercicio('Press Inclinado con Mancuernas').videoUrl,
                  series: 3,
                  repeticiones: 10,
                  peso: null,
                  pausa: 90,
                  volumen: 0
                },
                {
                  nombre: obtenerEjercicio('Aperturas con Mancuernas').nombre,
                  videoUrl: obtenerEjercicio('Aperturas con Mancuernas').videoUrl,
                  series: 3,
                  repeticiones: 12,
                  peso: null,
                  pausa: 60,
                  volumen: 0
                }
              ]
            },
            {
              nombre: 'Bloque 2: Tríceps',
              ejercicios: [
                {
                  nombre: obtenerEjercicio('Fondos en Paralelas').nombre,
                  videoUrl: obtenerEjercicio('Fondos en Paralelas').videoUrl,
                  series: 3,
                  repeticiones: 10,
                  peso: null,
                  pausa: 90,
                  volumen: 0
                },
                {
                  nombre: obtenerEjercicio('Extensión de Tríceps en Polea').nombre,
                  videoUrl: obtenerEjercicio('Extensión de Tríceps en Polea').videoUrl,
                  series: 3,
                  repeticiones: 12,
                  peso: null,
                  pausa: 60,
                  volumen: 0
                },
                {
                  nombre: obtenerEjercicio('Press Francés con Barra').nombre,
                  videoUrl: obtenerEjercicio('Press Francés con Barra').videoUrl,
                  series: 3,
                  repeticiones: 10,
                  peso: null,
                  pausa: 75,
                  volumen: 0
                }
              ]
            }
          ]
        },
        {
          nombre: 'Día 2: Espalda y Bíceps',
          bloques: [
            {
              nombre: 'Bloque 1: Espalda Principal',
              ejercicios: [
                {
                  nombre: obtenerEjercicio('Peso Muerto').nombre,
                  videoUrl: obtenerEjercicio('Peso Muerto').videoUrl,
                  series: 4,
                  repeticiones: 6,
                  peso: null,
                  pausa: 180,
                  volumen: 0
                },
                {
                  nombre: obtenerEjercicio('Remo con Barra').nombre,
                  videoUrl: obtenerEjercicio('Remo con Barra').videoUrl,
                  series: 4,
                  repeticiones: 8,
                  peso: null,
                  pausa: 120,
                  volumen: 0
                },
                {
                  nombre: obtenerEjercicio('Dominadas Asistidas').nombre,
                  videoUrl: obtenerEjercicio('Dominadas Asistidas').videoUrl,
                  series: 3,
                  repeticiones: 8,
                  peso: null,
                  pausa: 90,
                  volumen: 0
                },
                {
                  nombre: obtenerEjercicio('Remo con Mancuerna a Un Brazo').nombre,
                  videoUrl: obtenerEjercicio('Remo con Mancuerna a Un Brazo').videoUrl,
                  series: 3,
                  repeticiones: 10,
                  peso: null,
                  pausa: 60,
                  volumen: 0
                }
              ]
            },
            {
              nombre: 'Bloque 2: Bíceps',
              ejercicios: [
                {
                  nombre: obtenerEjercicio('Curl de Bíceps con Barra').nombre,
                  videoUrl: obtenerEjercicio('Curl de Bíceps con Barra').videoUrl,
                  series: 3,
                  repeticiones: 10,
                  peso: null,
                  pausa: 60,
                  volumen: 0
                },
                {
                  nombre: obtenerEjercicio('Curl Martillo con Mancuernas').nombre,
                  videoUrl: obtenerEjercicio('Curl Martillo con Mancuernas').videoUrl,
                  series: 3,
                  repeticiones: 12,
                  peso: null,
                  pausa: 60,
                  volumen: 0
                },
                {
                  nombre: obtenerEjercicio('Curl Concentrado').nombre,
                  videoUrl: obtenerEjercicio('Curl Concentrado').videoUrl,
                  series: 3,
                  repeticiones: 10,
                  peso: null,
                  pausa: 45,
                  volumen: 0
                }
              ]
            }
          ]
        },
        {
          nombre: 'Día 3: Piernas y Glúteos',
          bloques: [
            {
              nombre: 'Bloque 1: Cuádriceps Principal',
              ejercicios: [
                {
                  nombre: obtenerEjercicio('Sentadilla').nombre,
                  videoUrl: obtenerEjercicio('Sentadilla').videoUrl,
                  series: 4,
                  repeticiones: 8,
                  peso: null,
                  pausa: 180,
                  volumen: 0
                },
                {
                  nombre: obtenerEjercicio('Prensa de Piernas').nombre,
                  videoUrl: obtenerEjercicio('Prensa de Piernas').videoUrl,
                  series: 4,
                  repeticiones: 10,
                  peso: null,
                  pausa: 120,
                  volumen: 0
                },
                {
                  nombre: obtenerEjercicio('Extensiones de Cuádriceps').nombre,
                  videoUrl: obtenerEjercicio('Extensiones de Cuádriceps').videoUrl,
                  series: 3,
                  repeticiones: 12,
                  peso: null,
                  pausa: 60,
                  volumen: 0
                }
              ]
            },
            {
              nombre: 'Bloque 2: Femoral y Glúteos',
              ejercicios: [
                {
                  nombre: obtenerEjercicio('Peso Muerto Rumano').nombre,
                  videoUrl: obtenerEjercicio('Peso Muerto Rumano').videoUrl,
                  series: 4,
                  repeticiones: 10,
                  peso: null,
                  pausa: 120,
                  volumen: 0
                },
                {
                  nombre: obtenerEjercicio('Curl Femoral Acostado').nombre,
                  videoUrl: obtenerEjercicio('Curl Femoral Acostado').videoUrl,
                  series: 3,
                  repeticiones: 12,
                  peso: null,
                  pausa: 90,
                  volumen: 0
                },
                {
                  nombre: obtenerEjercicio('Hip Thrust con Barra').nombre,
                  videoUrl: obtenerEjercicio('Hip Thrust con Barra').videoUrl,
                  series: 4,
                  repeticiones: 10,
                  peso: null,
                  pausa: 120,
                  volumen: 0
                },
                {
                  nombre: obtenerEjercicio('Prensa de Glúteos').nombre,
                  videoUrl: obtenerEjercicio('Prensa de Glúteos').videoUrl,
                  series: 3,
                  repeticiones: 15,
                  peso: null,
                  pausa: 60,
                  volumen: 0
                }
              ]
            },
            {
              nombre: 'Bloque 3: Gemelos',
              ejercicios: [
                {
                  nombre: obtenerEjercicio('Elevación de Gemelos de Pie').nombre,
                  videoUrl: obtenerEjercicio('Elevación de Gemelos de Pie').videoUrl,
                  series: 4,
                  repeticiones: 15,
                  peso: null,
                  pausa: 60,
                  volumen: 0
                },
                {
                  nombre: obtenerEjercicio('Elevación de Gemelos Sentado').nombre,
                  videoUrl: obtenerEjercicio('Elevación de Gemelos Sentado').videoUrl,
                  series: 3,
                  repeticiones: 15,
                  peso: null,
                  pausa: 45,
                  volumen: 0
                }
              ]
            }
          ]
        },
        {
          nombre: 'Día 4: Hombros y Abdomen',
          bloques: [
            {
              nombre: 'Bloque 1: Hombros Principal',
              ejercicios: [
                {
                  nombre: obtenerEjercicio('Press Militar con Barra').nombre,
                  videoUrl: obtenerEjercicio('Press Militar con Barra').videoUrl,
                  series: 4,
                  repeticiones: 8,
                  peso: null,
                  pausa: 120,
                  volumen: 0
                },
                {
                  nombre: obtenerEjercicio('Elevaciones Laterales con Mancuernas').nombre,
                  videoUrl: obtenerEjercicio('Elevaciones Laterales con Mancuernas').videoUrl,
                  series: 3,
                  repeticiones: 12,
                  peso: null,
                  pausa: 60,
                  volumen: 0
                },
                {
                  nombre: obtenerEjercicio('Elevaciones Frontales con Mancuernas').nombre,
                  videoUrl: obtenerEjercicio('Elevaciones Frontales con Mancuernas').videoUrl,
                  series: 3,
                  repeticiones: 12,
                  peso: null,
                  pausa: 60,
                  volumen: 0
                },
                {
                  nombre: obtenerEjercicio('Vuelos Laterales en Máquina').nombre,
                  videoUrl: obtenerEjercicio('Vuelos Laterales en Máquina').videoUrl,
                  series: 3,
                  repeticiones: 12,
                  peso: null,
                  pausa: 60,
                  volumen: 0
                }
              ]
            },
            {
              nombre: 'Bloque 2: Deltoides Posterior',
              ejercicios: [
                {
                  nombre: obtenerEjercicio('Vuelos Invertidos con Mancuernas').nombre,
                  videoUrl: obtenerEjercicio('Vuelos Invertidos con Mancuernas').videoUrl,
                  series: 3,
                  repeticiones: 12,
                  peso: null,
                  pausa: 60,
                  volumen: 0
                },
                {
                  nombre: obtenerEjercicio('Face Pull con Polea').nombre,
                  videoUrl: obtenerEjercicio('Face Pull con Polea').videoUrl,
                  series: 3,
                  repeticiones: 15,
                  peso: null,
                  pausa: 60,
                  volumen: 0
                }
              ]
            },
            {
              nombre: 'Bloque 3: Abdomen',
              ejercicios: [
                {
                  nombre: obtenerEjercicio('Crunch Abdominal').nombre,
                  videoUrl: obtenerEjercicio('Crunch Abdominal').videoUrl,
                  series: 3,
                  repeticiones: 20,
                  peso: null,
                  pausa: 45,
                  volumen: 0
                },
                {
                  nombre: obtenerEjercicio('Plancha').nombre,
                  videoUrl: obtenerEjercicio('Plancha').videoUrl,
                  series: 3,
                  repeticiones: 1,
                  peso: null,
                  pausa: 60,
                  volumen: 0
                },
                {
                  nombre: obtenerEjercicio('Elevación de Piernas').nombre,
                  videoUrl: obtenerEjercicio('Elevación de Piernas').videoUrl,
                  series: 3,
                  repeticiones: 15,
                  peso: null,
                  pausa: 45,
                  volumen: 0
                }
              ]
            }
          ]
        }
      ]
    });
    await rutina.save();
    console.log('Rutina creada con 4 días de entrenamiento');

    // Actualizar alumno con rutina
    alumno.rutinaActualId = rutina._id;
    await alumno.save();

    const totalEjercicios = rutina.dias.reduce((total, dia) => 
      total + dia.bloques.reduce((sum, bloque) => sum + bloque.ejercicios.length, 0), 0);

    console.log('\n=== Seed completado ===');
    console.log('Profesor:');
    console.log('  Email: profesor@ejemplo.com');
    console.log('  Password: 123456');
    console.log(`  Ejercicios en biblioteca: ${ejerciciosBiblioteca.length}`);
    console.log('\nAlumno:');
    console.log('  Email: alumno@ejemplo.com');
    console.log('  Password: 123456');
    console.log(`  Semanas de progreso: ${historialSemanas.length}`);
    console.log('\nRutina creada:');
    console.log(`  Nombre: ${rutina.nombre}`);
    console.log(`  Días: ${rutina.dias.length}`);
    console.log(`  Total de ejercicios: ${totalEjercicios}`);
    console.log('\nPuedes usar estas credenciales para hacer login.');
    console.log('Nota: Los pesos están sin definir (null) para que el alumno los complete.');
    console.log('Todos los ejercicios de la rutina están en la biblioteca del profesor.');
    console.log(`El alumno tiene ${historialSemanas.length} semanas de progreso registradas para visualizar.`);

    process.exit(0);
  } catch (error) {
    console.error('Error en seed:', error);
    process.exit(1);
  }
};

seed();
