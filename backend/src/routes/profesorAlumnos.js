const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  getAlumnos,
  getAlumno,
  createAlumno,
  updateAlumno,
  deleteAlumno
} = require('../controllers/profesorAlumnosController');
const { authenticate, requireProfesor } = require('../middleware/auth');

// Todas las rutas requieren autenticación y rol de profesor
router.use(authenticate, requireProfesor);

// Validaciones
const createValidation = [
  body('nombre').trim().notEmpty().withMessage('El nombre es requerido'),
  body('email').isEmail().withMessage('Email inválido'),
  body('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres')
];

const updateValidation = [
  body('nombre').optional().trim().notEmpty().withMessage('El nombre no puede estar vacío'),
  body('email').optional().isEmail().withMessage('Email inválido'),
  body('password').optional().isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres')
];

// Rutas
router.get('/', getAlumnos);
router.get('/:id', getAlumno);
router.post('/', createValidation, createAlumno);
router.put('/:id', updateValidation, updateAlumno);
router.delete('/:id', deleteAlumno);

module.exports = router;

