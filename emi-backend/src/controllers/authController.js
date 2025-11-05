const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const Profesor = require('../models/Profesor');
const Alumno = require('../models/Alumno');

// Generar token JWT
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

// Registro de usuario
const register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { nombre, email, password, role, profesorId } = req.body;

    // Verificar si el email ya existe
    const existingProfesor = await Profesor.findOne({ email });
    const existingAlumno = await Alumno.findOne({ email });
    
    if (existingProfesor || existingAlumno) {
      return res.status(400).json({ error: 'El email ya está registrado' });
    }

    // Hash de la contraseña
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    let user;
    let token;

    if (role === 'profesor') {
      user = new Profesor({
        nombre,
        email,
        passwordHash
      });
      await user.save();
      token = generateToken(user._id, 'profesor');
    } else if (role === 'alumno') {
      if (!profesorId) {
        return res.status(400).json({ error: 'Se requiere profesorId para crear un alumno' });
      }

      // Verificar que el profesor existe
      const profesor = await Profesor.findById(profesorId);
      if (!profesor) {
        return res.status(404).json({ error: 'Profesor no encontrado' });
      }

      user = new Alumno({
        nombre,
        email,
        passwordHash,
        profesorId
      });
      await user.save();

      // Agregar alumno a la lista del profesor
      profesor.alumnos.push(user._id);
      await profesor.save();

      token = generateToken(user._id, 'alumno');
    } else {
      return res.status(400).json({ error: 'Role inválido. Debe ser "profesor" o "alumno"' });
    }

    res.status(201).json({
      token,
      user,
      role
    });
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ error: 'Error al registrar usuario' });
  }
};

// Login de usuario
const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Buscar usuario en ambas colecciones
    let user = await Profesor.findOne({ email }).select('+passwordHash');
    let role = 'profesor';

    if (!user) {
      user = await Alumno.findOne({ email }).select('+passwordHash');
      role = 'alumno';
    }

    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Verificar contraseña
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Generar token
    const token = generateToken(user._id, role);

    // Eliminar passwordHash antes de enviar
    const userObject = user.toJSON();

    res.json({
      token,
      user: userObject,
      role
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
};

// Obtener usuario actual
const getCurrentUser = async (req, res) => {
  try {
    res.json({
      user: req.user,
      role: req.userRole
    });
  } catch (error) {
    console.error('Error al obtener usuario:', error);
    res.status(500).json({ error: 'Error al obtener usuario' });
  }
};

module.exports = {
  register,
  login,
  getCurrentUser
};

