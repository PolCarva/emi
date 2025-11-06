const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
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
    default: 'admin',
    immutable: true
  }
}, {
  timestamps: true
});

// No devolver el passwordHash en las consultas por defecto y transformar _id a id
adminSchema.methods.toJSON = function() {
  const admin = this.toObject();
  delete admin.passwordHash;
  admin.id = admin._id.toString();
  delete admin._id;
  return admin;
};

module.exports = mongoose.model('Admin', adminSchema);
