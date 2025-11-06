const mongoose = require('mongoose');

const ejercicioSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true
  },
  videoUrl: {
    type: String,
    required: true
  }
}, { _id: false });

const profesorSchema = new mongoose.Schema({
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
    default: 'profesor',
    immutable: true
  },
  alumnos: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Alumno'
  }],
  ejercicios: [ejercicioSchema]
}, {
  timestamps: true
});

// No devolver el passwordHash en las consultas por defecto y transformar _id a id
profesorSchema.methods.toJSON = function() {
  const profesor = this.toObject();
  delete profesor.passwordHash;
  profesor.id = profesor._id.toString();
  delete profesor._id;
  return profesor;
};

module.exports = mongoose.model('Profesor', profesorSchema);

