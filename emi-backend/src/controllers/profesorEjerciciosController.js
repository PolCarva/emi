const { validationResult } = require('express-validator');
const Profesor = require('../models/Profesor');

// Obtener todos los ejercicios del profesor
const getEjercicios = async (req, res) => {
  try {
    const profesor = await Profesor.findById(req.userId);
    res.json(profesor.ejercicios);
  } catch (error) {
    console.error('Error al obtener ejercicios:', error);
    res.status(500).json({ error: 'Error al obtener ejercicios' });
  }
};

// Crear nuevo ejercicio
const createEjercicio = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { nombre, videoUrl } = req.body;

    const profesor = await Profesor.findById(req.userId);
    
    profesor.ejercicios.push({ nombre, videoUrl });
    await profesor.save();

    const nuevoEjercicio = profesor.ejercicios[profesor.ejercicios.length - 1];
    
    res.status(201).json(nuevoEjercicio);
  } catch (error) {
    console.error('Error al crear ejercicio:', error);
    res.status(500).json({ error: 'Error al crear ejercicio' });
  }
};

// Eliminar ejercicio
const deleteEjercicio = async (req, res) => {
  try {
    const { id } = req.params;

    const profesor = await Profesor.findById(req.userId);
    
    const ejercicioIndex = profesor.ejercicios.findIndex(
      ej => ej._id.toString() === id
    );

    if (ejercicioIndex === -1) {
      return res.status(404).json({ error: 'Ejercicio no encontrado' });
    }

    profesor.ejercicios.splice(ejercicioIndex, 1);
    await profesor.save();

    res.json({ message: 'Ejercicio eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar ejercicio:', error);
    res.status(500).json({ error: 'Error al eliminar ejercicio' });
  }
};

module.exports = {
  getEjercicios,
  createEjercicio,
  deleteEjercicio
};

