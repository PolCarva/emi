const mongoose = require('mongoose');

const ejercicioRutinaSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true
  },
  videoUrl: {
    type: String,
    required: false,
    default: null
  },
  series: {
    type: Number,
    required: true
  },
  repeticiones: {
    type: Number,
    required: true
  },
  peso: {
    type: Number,
    default: null
  },
  pausa: {
    type: Number,
    required: true
  },
  volumen: {
    type: Number,
    default: 0
  }
}, { _id: true });

const bloqueSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true
  },
  ejercicios: [ejercicioRutinaSchema]
}, { _id: true });

const diaRutinaSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true
  },
  bloques: [bloqueSchema]
}, { _id: true });

const rutinaSchema = new mongoose.Schema({
  alumnoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Alumno',
    required: true
  },
  profesorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Profesor',
    required: true
  },
  nombre: {
    type: String,
    required: true
  },
  genero: {
    type: String,
    enum: ['Masculino', 'Femenino', 'Otro'],
    required: true
  },
  objetivo: {
    type: String,
    required: true
  },
  edad: {
    type: Number,
    required: true
  },
  nivel: {
    type: String,
    enum: ['Principiante', 'Intermedio', 'Avanzado'],
    required: true
  },
  periodizacion: {
    type: String,
    required: true
  },
  semanaActual: {
    type: Number,
    default: 1
  },
  dias: [diaRutinaSchema]
}, {
  timestamps: true
});

// Middleware para calcular el volumen automáticamente antes de guardar
ejercicioRutinaSchema.pre('save', function(next) {
  if (this.peso !== null && this.peso !== undefined) {
    this.volumen = this.series * this.repeticiones * this.peso;
  } else {
    this.volumen = 0;
  }
  next();
});

// Método estático para calcular volumen
ejercicioRutinaSchema.methods.calcularVolumen = function() {
  if (this.peso !== null && this.peso !== undefined) {
    return this.series * this.repeticiones * this.peso;
  }
  return 0;
};

// Transformar _id a id en las respuestas JSON
rutinaSchema.methods.toJSON = function() {
  const rutina = this.toObject();
  rutina.id = rutina._id.toString();
  delete rutina._id;
  
  // También transformar los IDs de referencias
  if (rutina.alumnoId) {
    rutina.alumnoId = rutina.alumnoId.toString();
  }
  if (rutina.profesorId) {
    rutina.profesorId = rutina.profesorId.toString();
  }
  
  return rutina;
};

module.exports = mongoose.model('Rutina', rutinaSchema);

