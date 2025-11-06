const { validationResult } = require('express-validator');
const Alumno = require('../models/Alumno');

// Obtener todo el historial de progreso
const getProgreso = async (req, res) => {
  try {
    const alumno = await Alumno.findById(req.userId);
    res.json(alumno.historialSemanas);
  } catch (error) {
    console.error('Error al obtener progreso:', error);
    res.status(500).json({ error: 'Error al obtener progreso' });
  }
};

// Obtener progreso de una semana específica
const getProgresoSemana = async (req, res) => {
  try {
    const { num } = req.params;
    const numeroSemana = parseInt(num);

    const alumno = await Alumno.findById(req.userId);

    const semana = alumno.historialSemanas.find(
      s => s.numeroSemana === numeroSemana
    );

    if (!semana) {
      return res.status(404).json({ error: 'Semana no encontrada' });
    }

    res.json(semana);
  } catch (error) {
    console.error('Error al obtener progreso de semana:', error);
    res.status(500).json({ error: 'Error al obtener progreso de semana' });
  }
};

// Registrar progreso diario
const registrarProgreso = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { numeroSemana, fecha, observaciones, ejercicios } = req.body;

    // Calcular volumen real para cada ejercicio
    const ejerciciosConVolumen = ejercicios.map(ej => ({
      ...ej,
      volumenReal: ej.pesoReal * ej.repeticionesReal
    }));

    const alumno = await Alumno.findById(req.userId);

    // Buscar si ya existe la semana
    let semana = alumno.historialSemanas.find(
      s => s.numeroSemana === numeroSemana
    );

    const nuevoDia = {
      fecha: new Date(fecha),
      observaciones,
      ejercicios: ejerciciosConVolumen
    };

    if (semana) {
      // Verificar si ya existe un registro para esta fecha
      const diaExistente = semana.dias.findIndex(
        d => new Date(d.fecha).toDateString() === new Date(fecha).toDateString()
      );

      if (diaExistente !== -1) {
        // Actualizar el día existente
        semana.dias[diaExistente] = nuevoDia;
      } else {
        // Agregar nuevo día
        semana.dias.push(nuevoDia);
      }
    } else {
      // Crear nueva semana
      alumno.historialSemanas.push({
        numeroSemana,
        dias: [nuevoDia]
      });
    }

    await alumno.save();

    res.status(201).json({
      message: 'Progreso registrado correctamente',
      progreso: nuevoDia
    });
  } catch (error) {
    console.error('Error al registrar progreso:', error);
    res.status(500).json({ error: 'Error al registrar progreso' });
  }
};

// Actualizar progreso de un día específico
const actualizarProgreso = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { num, fecha } = req.params;
    const numeroSemana = parseInt(num);
    const { observaciones, ejercicios } = req.body;

    // Calcular volumen real para cada ejercicio
    const ejerciciosConVolumen = ejercicios.map(ej => ({
      ...ej,
      volumenReal: ej.pesoReal * ej.repeticionesReal
    }));

    const alumno = await Alumno.findById(req.userId);

    const semana = alumno.historialSemanas.find(
      s => s.numeroSemana === numeroSemana
    );

    if (!semana) {
      return res.status(404).json({ error: 'Semana no encontrada' });
    }

    const diaIndex = semana.dias.findIndex(
      d => new Date(d.fecha).toDateString() === new Date(fecha).toDateString()
    );

    if (diaIndex === -1) {
      return res.status(404).json({ error: 'Día no encontrado' });
    }

    semana.dias[diaIndex] = {
      fecha: new Date(fecha),
      observaciones,
      ejercicios: ejerciciosConVolumen
    };

    await alumno.save();

    res.json({
      message: 'Progreso actualizado correctamente',
      progreso: semana.dias[diaIndex]
    });
  } catch (error) {
    console.error('Error al actualizar progreso:', error);
    res.status(500).json({ error: 'Error al actualizar progreso' });
  }
};

module.exports = {
  getProgreso,
  getProgresoSemana,
  registrarProgreso,
  actualizarProgreso
};

