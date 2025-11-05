const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  getProgreso,
  getProgresoSemana,
  registrarProgreso,
  actualizarProgreso
} = require('../controllers/alumnoProgresoController');
const { authenticate, requireAlumno } = require('../middleware/auth');

// Todas las rutas requieren autenticación y rol de alumno
router.use(authenticate, requireAlumno);

// Validaciones
const progresoValidation = [
  body('numeroSemana').isInt({ min: 1 }).withMessage('El número de semana debe ser un entero positivo'),
  body('fecha').isISO8601().withMessage('La fecha debe ser válida'),
  body('ejercicios').isArray().withMessage('Los ejercicios deben ser un array'),
  body('ejercicios.*.ejercicioId').notEmpty().withMessage('El ID del ejercicio es requerido'),
  body('ejercicios.*.pesoReal').isNumeric().withMessage('El peso debe ser un número'),
  body('ejercicios.*.repeticionesReal').isInt({ min: 0 }).withMessage('Las repeticiones deben ser un número entero')
];

// Rutas
router.get('/', getProgreso);
router.get('/semana/:num', getProgresoSemana);
router.post('/', progresoValidation, registrarProgreso);
router.put('/semana/:num/dia/:fecha', progresoValidation, actualizarProgreso);

module.exports = router;

