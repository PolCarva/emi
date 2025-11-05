const Rutina = require('../models/Rutina');
const Alumno = require('../models/Alumno');

// Obtener rutina actual del alumno
const getRutinaActual = async (req, res) => {
  try {
    const alumno = await Alumno.findById(req.userId);

    if (!alumno.rutinaActualId) {
      return res.status(404).json({ error: 'No tienes una rutina asignada' });
    }

    const rutina = await Rutina.findById(alumno.rutinaActualId);

    if (!rutina) {
      return res.status(404).json({ error: 'Rutina no encontrada' });
    }

    res.json(rutina);
  } catch (error) {
    console.error('Error al obtener rutina:', error);
    res.status(500).json({ error: 'Error al obtener rutina' });
  }
};

// Obtener rutina para una semana específica
const getRutinaSemana = async (req, res) => {
  try {
    const { num } = req.params;
    const numeroSemana = parseInt(num);

    const alumno = await Alumno.findById(req.userId);

    if (!alumno.rutinaActualId) {
      return res.status(404).json({ error: 'No tienes una rutina asignada' });
    }

    const rutina = await Rutina.findById(alumno.rutinaActualId);

    if (!rutina) {
      return res.status(404).json({ error: 'Rutina no encontrada' });
    }

    // Devolver la rutina con la semana actualizada (para visualización)
    res.json({
      ...rutina.toObject(),
      semanaActual: numeroSemana
    });
  } catch (error) {
    console.error('Error al obtener rutina de semana:', error);
    res.status(500).json({ error: 'Error al obtener rutina de semana' });
  }
};

// Actualizar peso de un ejercicio en la rutina
const updateEjercicioPeso = async (req, res) => {
  try {
    const { diaIndex, bloqueIndex, ejercicioIndex } = req.params;
    const { peso } = req.body;

    // Validar que peso sea un número válido
    if (peso !== null && peso !== undefined && (isNaN(peso) || peso < 0)) {
      return res.status(400).json({ error: 'El peso debe ser un número positivo o null' });
    }

    const alumno = await Alumno.findById(req.userId);

    if (!alumno.rutinaActualId) {
      return res.status(404).json({ error: 'No tienes una rutina asignada' });
    }

    const rutina = await Rutina.findById(alumno.rutinaActualId);

    if (!rutina) {
      return res.status(404).json({ error: 'Rutina no encontrada' });
    }

    const diaIdx = parseInt(diaIndex);
    const bloqueIdx = parseInt(bloqueIndex);
    const ejercicioIdx = parseInt(ejercicioIndex);

    // Validar índices
    if (!rutina.dias[diaIdx]) {
      return res.status(400).json({ error: 'Día no encontrado' });
    }

    if (!rutina.dias[diaIdx].bloques[bloqueIdx]) {
      return res.status(400).json({ error: 'Bloque no encontrado' });
    }

    if (!rutina.dias[diaIdx].bloques[bloqueIdx].ejercicios[ejercicioIdx]) {
      return res.status(400).json({ error: 'Ejercicio no encontrado' });
    }

    // Actualizar peso del ejercicio
    const ejercicio = rutina.dias[diaIdx].bloques[bloqueIdx].ejercicios[ejercicioIdx];
    ejercicio.peso = peso === null || peso === undefined ? null : parseFloat(peso);
    
    // Calcular volumen automáticamente
    if (ejercicio.peso !== null && ejercicio.peso !== undefined) {
      ejercicio.volumen = ejercicio.series * ejercicio.repeticiones * ejercicio.peso;
    } else {
      ejercicio.volumen = 0;
    }

    // Marcar como modificado para que Mongoose guarde el cambio
    rutina.markModified('dias');
    
    await rutina.save();

    res.json({
      message: 'Peso actualizado correctamente',
      ejercicio: {
        peso: ejercicio.peso,
        volumen: ejercicio.volumen
      }
    });
  } catch (error) {
    console.error('Error al actualizar peso del ejercicio:', error);
    res.status(500).json({ error: 'Error al actualizar peso del ejercicio' });
  }
};

module.exports = {
  getRutinaActual,
  getRutinaSemana,
  updateEjercicioPeso
};

