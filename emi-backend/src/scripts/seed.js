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

    // Crear profesor de ejemplo
    console.log('Creando profesor de ejemplo...');
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('123456', salt);

    const profesor = new Profesor({
      nombre: 'Juan Pérez',
      email: 'profesor@ejemplo.com',
      passwordHash,
      ejercicios: [
        {
          nombre: 'Press de Banca con Barra',
          videoUrl: 'https://www.youtube.com/watch?v=rT7DgCr-3pg'
        },
        {
          nombre: 'Sentadilla',
          videoUrl: 'https://www.youtube.com/watch?v=YaXPRqUwItQ'
        },
        {
          nombre: 'Peso Muerto',
          videoUrl: 'https://www.youtube.com/watch?v=op9kVnSso6Q'
        },
        {
          nombre: 'Press Militar',
          videoUrl: 'https://www.youtube.com/watch?v=2yjwXTZQDDI'
        },
        {
          nombre: 'Remo con Barra',
          videoUrl: 'https://www.youtube.com/watch?v=paHWV6Nq5eo'
        },
        {
          nombre: 'Curl de Bíceps con Barra',
          videoUrl: 'https://www.youtube.com/watch?v=ykJmrZ5v0Oo'
        },
        {
          nombre: 'Fondos en Paralelas',
          videoUrl: 'https://www.youtube.com/watch?v=6kALZikXxLc'
        },
        {
          nombre: 'Prensa de Piernas',
          videoUrl: 'https://www.youtube.com/watch?v=IZxyjW8MPJY'
        }
      ]
    });
    await profesor.save();
    console.log('Profesor creado:', profesor.email);

    // Crear alumno de ejemplo
    console.log('Creando alumno de ejemplo...');
    const alumnoPasswordHash = await bcrypt.hash('123456', salt);

    const alumno = new Alumno({
      nombre: 'María García',
      email: 'alumno@ejemplo.com',
      passwordHash: alumnoPasswordHash,
      profesorId: profesor._id,
      historialSemanas: []
    });
    await alumno.save();
    console.log('Alumno creado:', alumno.email);

    // Agregar alumno a la lista del profesor
    profesor.alumnos.push(alumno._id);
    await profesor.save();

    // Crear rutina de ejemplo - Rutina de 4 días
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
                  nombre: 'Press de Banca con Barra',
                  videoUrl: 'https://www.youtube.com/watch?v=rT7DgCr-3pg',
                  series: 4,
                  repeticiones: 8,
                  peso: null, // El alumno debe definir su peso
                  pausa: 120,
                  volumen: 0
                },
                {
                  nombre: 'Press Inclinado con Mancuernas',
                  videoUrl: 'https://www.youtube.com/watch?v=8iPEnov-lmU',
                  series: 3,
                  repeticiones: 10,
                  peso: null,
                  pausa: 90,
                  volumen: 0
                },
                {
                  nombre: 'Aperturas con Mancuernas',
                  videoUrl: 'https://www.youtube.com/watch?v=eozdVDA78K0',
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
                  nombre: 'Fondos en Paralelas',
                  videoUrl: 'https://www.youtube.com/watch?v=6kALZikXxLc',
                  series: 3,
                  repeticiones: 10,
                  peso: null,
                  pausa: 90,
                  volumen: 0
                },
                {
                  nombre: 'Extensión de Tríceps en Polea',
                  videoUrl: 'https://www.youtube.com/watch?v=6kALZikXxLc',
                  series: 3,
                  repeticiones: 12,
                  peso: null,
                  pausa: 60,
                  volumen: 0
                },
                {
                  nombre: 'Press Francés con Barra',
                  videoUrl: 'https://www.youtube.com/watch?v=riAv1C1GJpk',
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
                  nombre: 'Peso Muerto',
                  videoUrl: 'https://www.youtube.com/watch?v=op9kVnSso6Q',
                  series: 4,
                  repeticiones: 6,
                  peso: null,
                  pausa: 180,
                  volumen: 0
                },
                {
                  nombre: 'Remo con Barra',
                  videoUrl: 'https://www.youtube.com/watch?v=paHWV6Nq5eo',
                  series: 4,
                  repeticiones: 8,
                  peso: null,
                  pausa: 120,
                  volumen: 0
                },
                {
                  nombre: 'Dominadas Asistidas',
                  videoUrl: 'https://www.youtube.com/watch?v=eGo4IYlbE5g',
                  series: 3,
                  repeticiones: 8,
                  peso: null,
                  pausa: 90,
                  volumen: 0
                },
                {
                  nombre: 'Remo con Mancuerna a Un Brazo',
                  videoUrl: 'https://www.youtube.com/watch?v=roCP6wCXPqo',
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
                  nombre: 'Curl de Bíceps con Barra',
                  videoUrl: 'https://www.youtube.com/watch?v=ykJmrZ5v0Oo',
                  series: 3,
                  repeticiones: 10,
                  peso: null,
                  pausa: 60,
                  volumen: 0
                },
                {
                  nombre: 'Curl Martillo con Mancuernas',
                  videoUrl: 'https://www.youtube.com/watch?v=zC3nNmEHjq0',
                  series: 3,
                  repeticiones: 12,
                  peso: null,
                  pausa: 60,
                  volumen: 0
                },
                {
                  nombre: 'Curl Concentrado',
                  videoUrl: 'https://www.youtube.com/watch?v=0AIGkKijH7s',
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
                  nombre: 'Sentadilla',
                  videoUrl: 'https://www.youtube.com/watch?v=YaXPRqUwItQ',
                  series: 4,
                  repeticiones: 8,
                  peso: null,
                  pausa: 180,
                  volumen: 0
                },
                {
                  nombre: 'Prensa de Piernas',
                  videoUrl: 'https://www.youtube.com/watch?v=IZxyjW8MPJY',
                  series: 4,
                  repeticiones: 10,
                  peso: null,
                  pausa: 120,
                  volumen: 0
                },
                {
                  nombre: 'Extensiones de Cuádriceps',
                  videoUrl: 'https://www.youtube.com/watch?v=YyvSfVjQeLs',
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
                  nombre: 'Peso Muerto Rumano',
                  videoUrl: 'https://www.youtube.com/watch?v=JCXUYuzwNrM',
                  series: 4,
                  repeticiones: 10,
                  peso: null,
                  pausa: 120,
                  volumen: 0
                },
                {
                  nombre: 'Curl Femoral Acostado',
                  videoUrl: 'https://www.youtube.com/watch?v=1Tq3QdYUuHs',
                  series: 3,
                  repeticiones: 12,
                  peso: null,
                  pausa: 90,
                  volumen: 0
                },
                {
                  nombre: 'Hip Thrust con Barra',
                  videoUrl: 'https://www.youtube.com/watch?v=Zp26q4BY5HE',
                  series: 4,
                  repeticiones: 10,
                  peso: null,
                  pausa: 120,
                  volumen: 0
                },
                {
                  nombre: 'Prensa de Glúteos',
                  videoUrl: 'https://www.youtube.com/watch?v=Wp4BlxcFTkE',
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
                  nombre: 'Elevación de Gemelos de Pie',
                  videoUrl: 'https://www.youtube.com/watch?v=3VcKaXpzqRo',
                  series: 4,
                  repeticiones: 15,
                  peso: null,
                  pausa: 60,
                  volumen: 0
                },
                {
                  nombre: 'Elevación de Gemelos Sentado',
                  videoUrl: 'https://www.youtube.com/watch?v=3VcKaXpzqRo',
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
                  nombre: 'Press Militar con Barra',
                  videoUrl: 'https://www.youtube.com/watch?v=2yjwXTZQDDI',
                  series: 4,
                  repeticiones: 8,
                  peso: null,
                  pausa: 120,
                  volumen: 0
                },
                {
                  nombre: 'Elevaciones Laterales con Mancuernas',
                  videoUrl: 'https://www.youtube.com/watch?v=3VcKaXpzqRo',
                  series: 3,
                  repeticiones: 12,
                  peso: null,
                  pausa: 60,
                  volumen: 0
                },
                {
                  nombre: 'Elevaciones Frontales con Mancuernas',
                  videoUrl: 'https://www.youtube.com/watch?v=3VcKaXpzqRo',
                  series: 3,
                  repeticiones: 12,
                  peso: null,
                  pausa: 60,
                  volumen: 0
                },
                {
                  nombre: 'Vuelos Laterales en Máquina',
                  videoUrl: 'https://www.youtube.com/watch?v=3VcKaXpzqRo',
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
                  nombre: 'Vuelos Invertidos con Mancuernas',
                  videoUrl: 'https://www.youtube.com/watch?v=3VcKaXpzqRo',
                  series: 3,
                  repeticiones: 12,
                  peso: null,
                  pausa: 60,
                  volumen: 0
                },
                {
                  nombre: 'Face Pull con Polea',
                  videoUrl: 'https://www.youtube.com/watch?v=rep-qVOkqgk',
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
                  nombre: 'Crunch Abdominal',
                  videoUrl: 'https://www.youtube.com/watch?v=3VcKaXpzqRo',
                  series: 3,
                  repeticiones: 20,
                  peso: null,
                  pausa: 45,
                  volumen: 0
                },
                {
                  nombre: 'Plancha',
                  videoUrl: 'https://www.youtube.com/watch?v=pSHjTRCQxIw',
                  series: 3,
                  repeticiones: 1, // 1 rep = tiempo sostenido
                  peso: null,
                  pausa: 60,
                  volumen: 0
                },
                {
                  nombre: 'Elevación de Piernas',
                  videoUrl: 'https://www.youtube.com/watch?v=3VcKaXpzqRo',
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

    console.log('\n=== Seed completado ===');
    console.log('Profesor:');
    console.log('  Email: profesor@ejemplo.com');
    console.log('  Password: 123456');
    console.log('\nAlumno:');
    console.log('  Email: alumno@ejemplo.com');
    console.log('  Password: 123456');
    console.log('\nRutina creada:');
    console.log(`  Nombre: ${rutina.nombre}`);
    console.log(`  Días: ${rutina.dias.length}`);
    console.log(`  Total de ejercicios: ${rutina.dias.reduce((total, dia) => 
      total + dia.bloques.reduce((sum, bloque) => sum + bloque.ejercicios.length, 0), 0)}`);
    console.log('\nPuedes usar estas credenciales para hacer login.');
    console.log('Nota: Los pesos están sin definir (null) para que el alumno los complete.');

    process.exit(0);
  } catch (error) {
    console.error('Error en seed:', error);
    process.exit(1);
  }
};

seed();
