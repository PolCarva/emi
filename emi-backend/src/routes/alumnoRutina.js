const express = require('express');
const router = express.Router();
const {
  getRutinaActual,
  getRutinaSemana,
  updateEjercicioPeso,
  getPesosSemana
} = require('../controllers/alumnoRutinaController');
const { authenticate, requireAlumno } = require('../middleware/auth');

// Todas las rutas requieren autenticación y rol de alumno
router.use(authenticate, requireAlumno);

// Rutas
router.get('/', getRutinaActual);
router.get('/semana/:num', getRutinaSemana);
router.get('/pesos/:numeroSemana', getPesosSemana);
router.put('/ejercicio/:diaIndex/:bloqueIndex/:ejercicioIndex/peso', updateEjercicioPeso);

module.exports = router;

