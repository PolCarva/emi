const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  getDashboardStats,
  getProfesoresWithAlumnos,
  createInvitationLink,
  getInvitationLinks,
  deleteInvitationLink,
  createFirstAdmin
} = require('../controllers/adminController');
const { authenticate, requireAdmin } = require('../middleware/auth');

// Validaciones
const createInvitationValidation = [
  body('expiresInDays').optional().isInt({ min: 1, max: 30 }).withMessage('Los días de expiración deben estar entre 1 y 30')
];

const createFirstAdminValidation = [
  body('nombre').trim().notEmpty().withMessage('El nombre es requerido'),
  body('email').isEmail().withMessage('Email inválido'),
  body('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres')
];

// Ruta especial para crear el primer admin (sin autenticación - debe estar ANTES del middleware)
router.post('/create-first-admin', createFirstAdminValidation, createFirstAdmin);

// Todas las demás rutas requieren autenticación y rol de admin
router.use(authenticate, requireAdmin);

// Rutas protegidas
router.get('/dashboard', getDashboardStats);
router.get('/profesores', getProfesoresWithAlumnos);
router.get('/invitations', getInvitationLinks);
router.post('/invitations', createInvitationValidation, createInvitationLink);
router.delete('/invitations/:id', deleteInvitationLink);

module.exports = router;
