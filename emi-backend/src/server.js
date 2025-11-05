require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const connectDB = require('./config/db');

// Importar rutas
const authRoutes = require('./routes/auth');
const profesorAlumnosRoutes = require('./routes/profesorAlumnos');
const profesorRutinasRoutes = require('./routes/profesorRutinas');
const profesorEjerciciosRoutes = require('./routes/profesorEjercicios');
const profesorSeguimientoRoutes = require('./routes/profesorSeguimiento');
const alumnoRutinaRoutes = require('./routes/alumnoRutina');
const alumnoProgresoRoutes = require('./routes/alumnoProgreso');
const chatbotRoutes = require('./routes/chatbot');

const app = express();

// Conectar a la base de datos
connectDB();

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // Límite de 100 requests por ventana
  message: 'Demasiadas peticiones desde esta IP, por favor intenta de nuevo más tarde'
});

// Rate limiting específico para chatbot
const chatbotLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 10, // Límite de 10 requests por minuto
  message: 'Demasiadas peticiones al chatbot, por favor espera un momento'
});

// Middlewares
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use('/api/', limiter);

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/profesor/alumnos', profesorAlumnosRoutes);
app.use('/api/profesor/rutinas', profesorRutinasRoutes);
app.use('/api/profesor/ejercicios', profesorEjerciciosRoutes);
app.use('/api/profesor/seguimiento', profesorSeguimientoRoutes);
app.use('/api/alumno/rutina', alumnoRutinaRoutes);
app.use('/api/alumno/progreso', alumnoProgresoRoutes);
app.use('/api/alumno/chatbot', chatbotLimiter, chatbotRoutes);

// Ruta de health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Manejo de errores global
const errorHandler = require('./middleware/errorHandler');
app.use(errorHandler);

// Ruta no encontrada
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
  console.log(`Entorno: ${process.env.NODE_ENV}`);
});

