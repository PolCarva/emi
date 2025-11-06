const mongoose = require('mongoose');

const progresoEjercicioSchema = new mongoose.Schema({
  ejercicioId: String,
  pesoReal: Number,
  repeticionesReal: Number,
  volumenReal: Number
}, { _id: false });

const progresoDiaSchema = new mongoose.Schema({
  fecha: {
    type: Date,
    required: true
  },
  observaciones: String,
  ejercicios: [progresoEjercicioSchema]
}, { _id: false });

const semanaProgresoSchema = new mongoose.Schema({
  numeroSemana: {
    type: Number,
    required: true
  },
  dias: [progresoDiaSchema]
}, { _id: false });

const alumnoSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  passwordHash: {
    type: String,
    required: true
  },
  role: {
    type: String,
    default: 'alumno',
    immutable: true
  },
  profesorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Profesor',
    required: true
  },
  rutinaActualId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Rutina'
  },
  historialSemanas: [semanaProgresoSchema]
}, {
  timestamps: true
});

// No devolver el passwordHash en las consultas por defecto y transformar _id a id
alumnoSchema.methods.toJSON = function() {
  const alumno = this.toObject();
  delete alumno.passwordHash;
  alumno.id = alumno._id.toString();
  delete alumno._id;
  return alumno;
};

module.exports = mongoose.model('Alumno', alumnoSchema);

