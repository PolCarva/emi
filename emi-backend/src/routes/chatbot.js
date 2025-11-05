const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { chat } = require('../controllers/chatbotController');
const { authenticate, requireAlumno } = require('../middleware/auth');

// Todas las rutas requieren autenticación y rol de alumno
router.use(authenticate, requireAlumno);

// Validaciones
const chatValidation = [
  body('mensaje').trim().notEmpty().withMessage('El mensaje no puede estar vacío')
];

// Rutas
router.post('/', chatValidation, chat);

module.exports = router;

