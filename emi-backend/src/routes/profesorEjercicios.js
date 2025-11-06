const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  getEjercicios,
  createEjercicio,
  updateEjercicio,
  deleteEjercicio
} = require('../controllers/profesorEjerciciosController');
const { authenticate, requireProfesor } = require('../middleware/auth');

// Todas las rutas requieren autenticación y rol de profesor
router.use(authenticate, requireProfesor);

// Validaciones
const ejercicioValidation = [
  body('nombre').trim().notEmpty().withMessage('El nombre es requerido'),
  body('videoUrl').isURL().withMessage('La URL del video debe ser válida')
];

// Rutas
router.get('/', getEjercicios);
router.post('/', ejercicioValidation, createEjercicio);
router.put('/:id', ejercicioValidation, updateEjercicio);
router.delete('/:id', deleteEjercicio);

module.exports = router;

