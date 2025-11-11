const { validationResult } = require('express-validator');
const Profesor = require('../models/Profesor');

// Obtener todos los ejercicios del profesor
const getEjercicios = async (req, res) => {
  try {
    const profesor = await Profesor.findById(req.userId);
    
    // Transformar _id a id en los ejercicios
    const ejercicios = profesor.ejercicios.map(ej => {
      const ejObj = ej.toObject();
      if (ejObj._id) {
        ejObj.id = ejObj._id.toString();
        delete ejObj._id;
      }
      return ejObj;
    });
    
    res.json(ejercicios);
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
    
    profesor.ejercicios.push({ 
      nombre, 
      videoUrl: videoUrl || null 
    });
    await profesor.save();

    const nuevoEjercicio = profesor.ejercicios[profesor.ejercicios.length - 1];
    
    // Transformar _id a id
    const ejercicioJSON = nuevoEjercicio.toObject();
    if (ejercicioJSON._id) {
      ejercicioJSON.id = ejercicioJSON._id.toString();
      delete ejercicioJSON._id;
    }
    
    res.status(201).json(ejercicioJSON);
  } catch (error) {
    console.error('Error al crear ejercicio:', error);
    res.status(500).json({ error: 'Error al crear ejercicio' });
  }
};

// Actualizar ejercicio
const updateEjercicio = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { nombre, videoUrl } = req.body;

    const profesor = await Profesor.findById(req.userId);
    
    const ejercicio = profesor.ejercicios.id(id);
    
    if (!ejercicio) {
      return res.status(404).json({ error: 'Ejercicio no encontrado' });
    }

    ejercicio.nombre = nombre;
    ejercicio.videoUrl = videoUrl || null;
    
    await profesor.save();

    // Transformar _id a id
    const ejercicioJSON = ejercicio.toObject();
    if (ejercicioJSON._id) {
      ejercicioJSON.id = ejercicioJSON._id.toString();
      delete ejercicioJSON._id;
    }
    
    res.json(ejercicioJSON);
  } catch (error) {
    console.error('Error al actualizar ejercicio:', error);
    res.status(500).json({ error: 'Error al actualizar ejercicio' });
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

// Eliminar múltiples ejercicios
const deleteMultipleEjercicios = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'Se requiere un array de IDs' });
    }

    const profesor = await Profesor.findById(req.userId);
    
    // Filtrar ejercicios que existen y pertenecen al profesor
    const ejerciciosAEliminar = ids.filter(id => {
      return profesor.ejercicios.some(
        ej => ej._id.toString() === id
      );
    });

    if (ejerciciosAEliminar.length === 0) {
      return res.status(404).json({ error: 'No se encontraron ejercicios para eliminar' });
    }

    // Eliminar ejercicios
    profesor.ejercicios = profesor.ejercicios.filter(
      ej => !ejerciciosAEliminar.includes(ej._id.toString())
    );
    
    await profesor.save();

    res.json({ 
      message: `${ejerciciosAEliminar.length} ejercicio(s) eliminado(s) correctamente`,
      eliminados: ejerciciosAEliminar.length
    });
  } catch (error) {
    console.error('Error al eliminar ejercicios:', error);
    res.status(500).json({ error: 'Error al eliminar ejercicios' });
  }
};

module.exports = {
  getEjercicios,
  createEjercicio,
  updateEjercicio,
  deleteEjercicio,
  deleteMultipleEjercicios
};

