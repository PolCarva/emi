const { validationResult } = require('express-validator');
const crypto = require('crypto');
const Profesor = require('../models/Profesor');
const Alumno = require('../models/Alumno');
const Admin = require('../models/Admin');
const InvitationLink = require('../models/InvitationLink');

// Generar código único para enlace de invitación
const generateInvitationCode = () => {
  return crypto.randomBytes(16).toString('hex').toUpperCase();
};

// Obtener estadísticas del dashboard
const getDashboardStats = async (req, res) => {
  try {
    const [totalProfesores, totalAlumnos, totalAdmins, enlacesActivos] = await Promise.all([
      Profesor.countDocuments(),
      Alumno.countDocuments(),
      Admin.countDocuments(),
      InvitationLink.countDocuments({ isUsed: false, expiresAt: { $gt: new Date() } })
    ]);

    res.json({
      stats: {
        totalProfesores,
        totalAlumnos,
        totalAdmins,
        enlacesActivos
      }
    });
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
};

// Obtener todos los profesores con sus alumnos
const getProfesoresWithAlumnos = async (req, res) => {
  try {
    const profesores = await Profesor.find()
      .populate('alumnos', 'nombre email createdAt')
      .sort({ createdAt: -1 });

    const profesoresWithStats = profesores.map(profesor => ({
      id: profesor.id,
      nombre: profesor.nombre,
      email: profesor.email,
      fechaRegistro: profesor.createdAt,
      totalAlumnos: profesor.alumnos.length,
      alumnos: profesor.alumnos
    }));

    res.json({ profesores: profesoresWithStats });
  } catch (error) {
    console.error('Error obteniendo profesores:', error);
    res.status(500).json({ error: 'Error al obtener profesores' });
  }
};

// Crear enlace de invitación
const createInvitationLink = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { expiresInDays = 7 } = req.body;
    const adminId = req.user.id;

    // Generar código único
    let code;
    let existingLink;
    do {
      code = generateInvitationCode();
      existingLink = await InvitationLink.findOne({ code });
    } while (existingLink);

    // Calcular fecha de expiración
    const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);

    // Crear enlace
    const invitationLink = new InvitationLink({
      code,
      createdBy: adminId,
      expiresAt
    });

    await invitationLink.save();

    res.status(201).json({
      invitationLink: {
        id: invitationLink.id,
        code: invitationLink.code,
        expiresAt: invitationLink.expiresAt,
        createdAt: invitationLink.createdAt
      },
      registrationUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/register?invitation=${code}`
    });
  } catch (error) {
    console.error('Error creando enlace de invitación:', error);
    res.status(500).json({ error: 'Error al crear enlace de invitación' });
  }
};

// Obtener todos los enlaces de invitación
const getInvitationLinks = async (req, res) => {
  try {
    const links = await InvitationLink.find()
      .populate('createdBy', 'nombre email')
      .populate('usedBy', 'nombre email')
      .sort({ createdAt: -1 });

    const formattedLinks = links.map(link => ({
      id: link.id,
      code: link.code,
      isUsed: link.isUsed,
      expiresAt: link.expiresAt,
      createdAt: link.createdAt,
      usedAt: link.usedAt,
      createdBy: link.createdBy,
      usedBy: link.usedBy,
      isExpired: link.expiresAt < new Date(),
      isValid: link.isValid()
    }));

    res.json({ invitationLinks: formattedLinks });
  } catch (error) {
    console.error('Error obteniendo enlaces:', error);
    res.status(500).json({ error: 'Error al obtener enlaces de invitación' });
  }
};

// Eliminar enlace de invitación
const deleteInvitationLink = async (req, res) => {
  try {
    const { id } = req.params;

    const link = await InvitationLink.findById(id);
    if (!link) {
      return res.status(404).json({ error: 'Enlace no encontrado' });
    }

    if (link.isUsed) {
      return res.status(400).json({ error: 'No se puede eliminar un enlace ya usado' });
    }

    await InvitationLink.findByIdAndDelete(id);
    res.json({ message: 'Enlace eliminado correctamente' });
  } catch (error) {
    console.error('Error eliminando enlace:', error);
    res.status(500).json({ error: 'Error al eliminar enlace' });
  }
};

// Crear primer admin (solo para inicialización)
const createFirstAdmin = async (req, res) => {
  try {
    const existingAdmin = await Admin.findOne();
    if (existingAdmin) {
      return res.status(400).json({ error: 'Ya existe un administrador' });
    }

    const { nombre, email, password } = req.body;

    // Hash de la contraseña
    const bcrypt = require('bcryptjs');
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const admin = new Admin({
      nombre,
      email,
      passwordHash
    });

    await admin.save();

    const jwt = require('jsonwebtoken');
    const token = jwt.sign({ id: admin._id, role: 'admin' }, process.env.JWT_SECRET, {
      expiresIn: '30d'
    });

    res.status(201).json({
      message: 'Administrador creado exitosamente',
      token,
      user: admin,
      role: 'admin'
    });
  } catch (error) {
    console.error('Error creando admin:', error);
    res.status(500).json({ error: 'Error al crear administrador' });
  }
};

module.exports = {
  getDashboardStats,
  getProfesoresWithAlumnos,
  createInvitationLink,
  getInvitationLinks,
  deleteInvitationLink,
  createFirstAdmin
};
