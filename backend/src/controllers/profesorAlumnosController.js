const { validationResult } = require('express-validator');
const Alumno = require('../models/Alumno');
const Profesor = require('../models/Profesor');
const Rutina = require('../models/Rutina');
const bcrypt = require('bcryptjs');

// Obtener todos los alumnos del profesor
const getAlumnos = async (req, res) => {
  try {
    const alumnos = await Alumno.find({ profesorId: req.userId })
      .populate('rutinaActualId')
      .sort({ createdAt: -1 });
    
    res.json(alumnos);
  } catch (error) {
    console.error('Error al obtener alumnos:', error);
    res.status(500).json({ error: 'Error al obtener alumnos' });
  }
};

// Obtener un alumno específico
const getAlumno = async (req, res) => {
  try {
    const alumno = await Alumno.findOne({
      _id: req.params.id,
      profesorId: req.userId
    }).populate('rutinaActualId');

    if (!alumno) {
      return res.status(404).json({ error: 'Alumno no encontrado' });
    }

    res.json(alumno);
  } catch (error) {
    console.error('Error al obtener alumno:', error);
    res.status(500).json({ error: 'Error al obtener alumno' });
  }
};

// Crear nuevo alumno
const createAlumno = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { nombre, email, password } = req.body;

    // Verificar si el email ya existe
    const existingAlumno = await Alumno.findOne({ email });
    if (existingAlumno) {
      return res.status(400).json({ error: 'El email ya está registrado' });
    }

    // Hash de la contraseña
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const alumno = new Alumno({
      nombre,
      email,
      passwordHash,
      profesorId: req.userId
    });

    await alumno.save();

    // Agregar alumno a la lista del profesor
    await Profesor.findByIdAndUpdate(req.userId, {
      $push: { alumnos: alumno._id }
    });

    res.status(201).json(alumno);
  } catch (error) {
    console.error('Error al crear alumno:', error);
    res.status(500).json({ error: 'Error al crear alumno' });
  }
};

// Actualizar alumno
const updateAlumno = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { nombre, email } = req.body;
    const updates = { nombre, email };

    // Si se proporciona nueva contraseña, hashearla
    if (req.body.password) {
      const salt = await bcrypt.genSalt(10);
      updates.passwordHash = await bcrypt.hash(req.body.password, salt);
    }

    const alumno = await Alumno.findOneAndUpdate(
      { _id: req.params.id, profesorId: req.userId },
      updates,
      { new: true, runValidators: true }
    );

    if (!alumno) {
      return res.status(404).json({ error: 'Alumno no encontrado' });
    }

    res.json(alumno);
  } catch (error) {
    console.error('Error al actualizar alumno:', error);
    res.status(500).json({ error: 'Error al actualizar alumno' });
  }
};

// Eliminar alumno
const deleteAlumno = async (req, res) => {
  try {
    const alumno = await Alumno.findOneAndDelete({
      _id: req.params.id,
      profesorId: req.userId
    });

    if (!alumno) {
      return res.status(404).json({ error: 'Alumno no encontrado' });
    }

    // Eliminar rutinas asociadas
    await Rutina.deleteMany({ alumnoId: alumno._id });

    // Eliminar de la lista del profesor
    await Profesor.findByIdAndUpdate(req.userId, {
      $pull: { alumnos: alumno._id }
    });

    res.json({ message: 'Alumno eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar alumno:', error);
    res.status(500).json({ error: 'Error al eliminar alumno' });
  }
};

module.exports = {
  getAlumnos,
  getAlumno,
  createAlumno,
  updateAlumno,
  deleteAlumno
};

