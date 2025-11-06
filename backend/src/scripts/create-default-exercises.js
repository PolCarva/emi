/**
 * Script para crear ejercicios por defecto para un profesor
 */

const Ejercicio = require('../models/Profesor').schema.path('ejercicios.0').constructor;

const DEFAULT_EXERCISES = [
  // Piernas / Glúteos
  { nombre: "Sentadilla con barra (Barbell Squat)", videoUrl: null },
  { nombre: "Sentadilla frontal (Front Squat)", videoUrl: null },
  { nombre: "Sentadilla búlgara (Bulgarian Split Squat)", videoUrl: null },
  { nombre: "Prensa de piernas (Leg Press)", videoUrl: null },
  { nombre: "Peso muerto convencional (Deadlift)", videoUrl: null },
  { nombre: "Peso muerto rumano (Romanian Deadlift)", videoUrl: null },
  { nombre: "Zancadas caminando (Walking Lunge)", videoUrl: null },
  { nombre: "Zancadas estáticas (Static Lunge)", videoUrl: null },
  { nombre: "Extensión de piernas (Leg Extension)", videoUrl: null },
  { nombre: "Curl femoral (Leg Curl)", videoUrl: null },
  { nombre: "Hip Thrust (Elevación de cadera con barra)", videoUrl: null },
  { nombre: "Abducción de cadera en máquina", videoUrl: null },
  { nombre: "Gemelos de pie (Standing Calf Raise)", videoUrl: null },
  { nombre: "Gemelos sentado (Seated Calf Raise)", videoUrl: null },

  // Pecho
  { nombre: "Press de banca plano (Flat Bench Press)", videoUrl: null },
  { nombre: "Press de banca inclinado (Incline Bench Press)", videoUrl: null },
  { nombre: "Press de banca declinado (Decline Bench Press)", videoUrl: null },
  { nombre: "Press con mancuernas (Dumbbell Press)", videoUrl: null },
  { nombre: "Aperturas con mancuernas (Dumbbell Fly)", videoUrl: null },
  { nombre: "Press en máquina (Chest Press Machine)", videoUrl: null },
  { nombre: "Fondos en paralelas (Dips)", videoUrl: null },

  // Espalda
  { nombre: "Dominadas (Pull-Up)", videoUrl: null },
  { nombre: "Jalón al pecho (Lat Pulldown)", videoUrl: null },
  { nombre: "Remo con barra (Barbell Row)", videoUrl: null },
  { nombre: "Remo con mancuernas (Dumbbell Row)", videoUrl: null },
  { nombre: "Remo en polea baja (Seated Cable Row)", videoUrl: null },
  { nombre: "Peso muerto (Deadlift)", videoUrl: null },
  { nombre: "Peso muerto sumo (Sumo Deadlift)", videoUrl: null },
  { nombre: "Face Pull", videoUrl: null },
  { nombre: "Pullover con mancuerna (Dumbbell Pullover)", videoUrl: null },

  // Hombros
  { nombre: "Press militar con barra (Overhead Press)", videoUrl: null },
  { nombre: "Press con mancuernas (Dumbbell Shoulder Press)", videoUrl: null },
  { nombre: "Elevaciones laterales (Lateral Raise)", videoUrl: null },
  { nombre: "Elevaciones frontales (Front Raise)", videoUrl: null },
  { nombre: "Pájaros o elevaciones posteriores (Rear Delt Fly)", videoUrl: null },
  { nombre: "Encogimientos de hombros (Shrugs)", videoUrl: null },
  { nombre: "Press Arnold (Arnold Press)", videoUrl: null },

  // Brazos - Bíceps
  { nombre: "Curl con barra (Barbell Curl)", videoUrl: null },
  { nombre: "Curl con mancuernas (Dumbbell Curl)", videoUrl: null },
  { nombre: "Curl martillo (Hammer Curl)", videoUrl: null },
  { nombre: "Curl en banco inclinado (Incline Dumbbell Curl)", videoUrl: null },
  { nombre: "Curl en predicador (Preacher Curl)", videoUrl: null },
  { nombre: "Curl en cable (Cable Curl)", videoUrl: null },

  // Brazos - Tríceps
  { nombre: "Jalón en polea (Tricep Pushdown)", videoUrl: null },
  { nombre: "Extensión de tríceps con cuerda", videoUrl: null },
  { nombre: "Press francés (Skull Crusher)", videoUrl: null },
  { nombre: "Fondos de tríceps en banco", videoUrl: null },
  { nombre: "Extensión por encima de la cabeza (Overhead Tricep Extension)", videoUrl: null },

  // Core / Abdominales
  { nombre: "Plancha (Plank)", videoUrl: null },
  { nombre: "Crunch abdominal", videoUrl: null },
  { nombre: "Crunch en máquina", videoUrl: null },
  { nombre: "Elevaciones de piernas colgado", videoUrl: null },
  { nombre: "Ab wheel rollout (Rueda abdominal)", videoUrl: null },
  { nombre: "Russian twist", videoUrl: null },
  { nombre: "Mountain climbers", videoUrl: null },
  { nombre: "Side plank", videoUrl: null }
];

/**
 * Crea ejercicios por defecto para un profesor
 * @param {Object} profesor - El profesor para el que crear los ejercicios
 */
async function createDefaultExercisesForProfesor(profesor) {
  try {
    // Crear ejercicios con IDs únicos
    const exercisesWithIds = DEFAULT_EXERCISES.map(exercise => ({
      ...exercise,
      _id: undefined // Dejar que MongoDB genere el ID
    }));

    profesor.ejercicios = exercisesWithIds;
    await profesor.save();

    console.log(`✅ Creados ${DEFAULT_EXERCISES.length} ejercicios por defecto para el profesor ${profesor.nombre}`);
    return profesor;
  } catch (error) {
    console.error('❌ Error creando ejercicios por defecto:', error);
    throw error;
  }
}

module.exports = {
  DEFAULT_EXERCISES,
  createDefaultExercisesForProfesor
};
