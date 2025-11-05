const jwt = require('jsonwebtoken');
const Profesor = require('../models/Profesor');
const Alumno = require('../models/Alumno');

// Middleware para verificar token JWT
const authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'No se proporcionó token de autenticación' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    let user;
    if (decoded.role === 'profesor') {
      user = await Profesor.findById(decoded.id);
    } else if (decoded.role === 'alumno') {
      user = await Alumno.findById(decoded.id);
    }

    if (!user) {
      return res.status(401).json({ error: 'Usuario no encontrado' });
    }

    req.user = user;
    req.userId = user._id;
    req.userRole = decoded.role;
    
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token inválido o expirado' });
  }
};

// Middleware para verificar que el usuario sea profesor
const requireProfesor = (req, res, next) => {
  if (req.userRole !== 'profesor') {
    return res.status(403).json({ error: 'Acceso denegado. Se requiere rol de profesor' });
  }
  next();
};

// Middleware para verificar que el usuario sea alumno
const requireAlumno = (req, res, next) => {
  if (req.userRole !== 'alumno') {
    return res.status(403).json({ error: 'Acceso denegado. Se requiere rol de alumno' });
  }
  next();
};

module.exports = {
  authenticate,
  requireProfesor,
  requireAlumno
};

