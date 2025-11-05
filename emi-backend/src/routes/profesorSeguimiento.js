const express = require('express');
const router = express.Router();
const {
  getSeguimientoAlumno,
  getSeguimientoSemana
} = require('../controllers/profesorSeguimientoController');
const { authenticate, requireProfesor } = require('../middleware/auth');

// Todas las rutas requieren autenticación y rol de profesor
router.use(authenticate, requireProfesor);

// Rutas
router.get('/:alumnoId', getSeguimientoAlumno);
router.get('/:alumnoId/semana/:num', getSeguimientoSemana);

module.exports = router;

