const { validationResult } = require('express-validator');
const Rutina = require('../models/Rutina');
const Alumno = require('../models/Alumno');

// Obtener rutina de un alumno
const getRutinaByAlumno = async (req, res) => {
  try {
    const { alumnoId } = req.params;

    // Verificar que el alumno pertenece al profesor
    const alumno = await Alumno.findOne({
      _id: alumnoId,
      profesorId: req.userId
    });

    if (!alumno) {
      return res.status(404).json({ error: 'Alumno no encontrado' });
    }

    const rutina = await Rutina.findOne({ alumnoId });

    if (!rutina) {
      return res.status(404).json({ error: 'Rutina no encontrada' });
    }

    res.json(rutina);
  } catch (error) {
    console.error('Error al obtener rutina:', error);
    res.status(500).json({ error: 'Error al obtener rutina' });
  }
};

// Crear rutina para un alumno
const createRutina = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { alumnoId, nombre, genero, objetivo, edad, nivel, periodizacion, dias } = req.body;

    // Verificar que el alumno pertenece al profesor
    const alumno = await Alumno.findOne({
      _id: alumnoId,
      profesorId: req.userId
    });

    if (!alumno) {
      return res.status(404).json({ error: 'Alumno no encontrado' });
    }

    // Calcular volumen para cada ejercicio (puede ser null si peso no está definido)
    const diasConVolumen = dias.map(dia => ({
      ...dia,
      bloques: dia.bloques.map(bloque => ({
        ...bloque,
        ejercicios: bloque.ejercicios.map(ejercicio => ({
          ...ejercicio,
          peso: ejercicio.peso === null || ejercicio.peso === undefined ? null : ejercicio.peso,
          volumen: ejercicio.peso !== null && ejercicio.peso !== undefined
            ? ejercicio.series * ejercicio.repeticiones * ejercicio.peso
            : 0
        }))
      }))
    }));

    const rutina = new Rutina({
      alumnoId,
      profesorId: req.userId,
      nombre,
      genero,
      objetivo,
      edad,
      nivel,
      periodizacion,
      dias: diasConVolumen
    });

    await rutina.save();

    // Actualizar referencia en el alumno
    alumno.rutinaActualId = rutina._id;
    await alumno.save();

    res.status(201).json(rutina);
  } catch (error) {
    console.error('Error al crear rutina:', error);
    res.status(500).json({ error: 'Error al crear rutina' });
  }
};

// Actualizar rutina
const updateRutina = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const updates = req.body;

    // Verificar que la rutina pertenece a un alumno del profesor
    const rutina = await Rutina.findOne({
      _id: id,
      profesorId: req.userId
    });

    if (!rutina) {
      return res.status(404).json({ error: 'Rutina no encontrada' });
    }

    // Recalcular volumen si hay ejercicios (puede ser null si peso no está definido)
    if (updates.dias) {
      updates.dias = updates.dias.map(dia => ({
        ...dia,
        bloques: dia.bloques.map(bloque => ({
          ...bloque,
          ejercicios: bloque.ejercicios.map(ejercicio => ({
            ...ejercicio,
            peso: ejercicio.peso === null || ejercicio.peso === undefined ? null : ejercicio.peso,
            volumen: ejercicio.peso !== null && ejercicio.peso !== undefined
              ? ejercicio.series * ejercicio.repeticiones * ejercicio.peso
              : 0
          }))
        }))
      }));
    }

    // Actualizar campos
    Object.keys(updates).forEach(key => {
      if (key !== 'dias') {
        rutina[key] = updates[key];
      }
    });

    // Si hay cambios en días, actualizar y marcar como modificado
    if (updates.dias) {
      rutina.dias = updates.dias;
      rutina.markModified('dias');
    }

    await rutina.save();

    res.json(rutina);
  } catch (error) {
    console.error('Error al actualizar rutina:', error);
    res.status(500).json({ error: 'Error al actualizar rutina' });
  }
};

// Eliminar rutina
const deleteRutina = async (req, res) => {
  try {
    const { id } = req.params;

    const rutina = await Rutina.findOneAndDelete({
      _id: id,
      profesorId: req.userId
    });

    if (!rutina) {
      return res.status(404).json({ error: 'Rutina no encontrada' });
    }

    // Eliminar referencia del alumno
    await Alumno.findByIdAndUpdate(rutina.alumnoId, {
      $unset: { rutinaActualId: 1 }
    });

    res.json({ message: 'Rutina eliminada correctamente' });
  } catch (error) {
    console.error('Error al eliminar rutina:', error);
    res.status(500).json({ error: 'Error al eliminar rutina' });
  }
};

module.exports = {
  getRutinaByAlumno,
  createRutina,
  updateRutina,
  deleteRutina
};

