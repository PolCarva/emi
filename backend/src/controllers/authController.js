const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const Profesor = require('../models/Profesor');
const Alumno = require('../models/Alumno');
const Admin = require('../models/Admin');
const InvitationLink = require('../models/InvitationLink');
const { createDefaultExercisesForProfesor } = require('../scripts/create-default-exercises');

// Generar token JWT
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

// Registro de usuario (solo profesores con enlace de invitación)
const register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { nombre, email, password, invitationCode } = req.body;

    // Verificar enlace de invitación
    const invitation = await InvitationLink.findOne({ code: invitationCode });

    if (!invitation) {
      return res.status(403).json({ error: 'Enlace de invitación inválido' });
    }

    if (!invitation.isValid()) {
      return res.status(403).json({ error: 'El enlace de invitación ha expirado o ya fue usado' });
    }

    // Verificar si el email ya existe
    const existingProfesor = await Profesor.findOne({ email });
    const existingAlumno = await Alumno.findOne({ email });
    const existingAdmin = await Admin.findOne({ email });

    if (existingProfesor || existingAlumno || existingAdmin) {
      return res.status(400).json({ error: 'El email ya está registrado' });
    }

    // Hash de la contraseña
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Crear profesor
    const user = new Profesor({
      nombre,
      email,
      passwordHash
    });

    await user.save();

    // Crear ejercicios por defecto para el profesor
    await createDefaultExercisesForProfesor(user);

    // Marcar el enlace como usado
    invitation.isUsed = true;
    invitation.usedBy = user._id;
    invitation.usedAt = new Date();
    await invitation.save();

    const token = generateToken(user._id, 'profesor');

    res.status(201).json({
      token,
      user,
      role: 'profesor'
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

    // Normalizar email
    const normalizedEmail = email.toLowerCase().trim();

    // Buscar usuario en todas las colecciones
    let user = await Admin.findOne({ email: normalizedEmail });
    let role = 'admin';

    if (!user) {
      user = await Profesor.findOne({ email: normalizedEmail });
      role = 'profesor';
    }

    if (!user) {
      user = await Alumno.findOne({ email: normalizedEmail });
      role = 'alumno';
    }

    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Asegurarse de tener el passwordHash
    // Si no está disponible en el objeto, obtenerlo explícitamente
    if (!user.passwordHash) {
      if (role === 'admin') {
        user = await Admin.findById(user._id);
      } else if (role === 'profesor') {
        user = await Profesor.findById(user._id);
      } else {
        user = await Alumno.findById(user._id);
      }
    }

    if (!user || !user.passwordHash) {
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

