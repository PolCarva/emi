const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  getRutinaByAlumno,
  createRutina,
  updateRutina,
  deleteRutina
} = require('../controllers/profesorRutinasController');
const { authenticate, requireProfesor } = require('../middleware/auth');

// Todas las rutas requieren autenticación y rol de profesor
router.use(authenticate, requireProfesor);

// Validaciones
const rutinaValidation = [
  body('alumnoId').notEmpty().withMessage('El ID del alumno es requerido'),
  body('nombre').trim().notEmpty().withMessage('El nombre es requerido'),
  body('genero').isIn(['Masculino', 'Femenino', 'Otro']).withMessage('Género inválido'),
  body('objetivo').trim().notEmpty().withMessage('El objetivo es requerido'),
  body('edad').isInt({ min: 1 }).withMessage('La edad debe ser un número positivo'),
  body('nivel').isIn(['Principiante', 'Intermedio', 'Avanzado']).withMessage('Nivel inválido'),
  body('periodizacion').trim().notEmpty().withMessage('La periodización es requerida'),
  body('dias').isArray().withMessage('Los días deben ser un array')
];

// Rutas
router.get('/:alumnoId', getRutinaByAlumno);
router.post('/', rutinaValidation, createRutina);
router.put('/:id', updateRutina); // Sin validación estricta para permitir actualizaciones parciales
router.delete('/:id', deleteRutina);

module.exports = router;

