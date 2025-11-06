const mongoose = require('mongoose');

const invitationLinkSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },
  isUsed: {
    type: Boolean,
    default: false
  },
  usedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Profesor'
  },
  usedAt: Date,
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 días por defecto
  }
}, {
  timestamps: true
});

// Índice para expiración automática
invitationLinkSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Método para verificar si el enlace es válido
invitationLinkSchema.methods.isValid = function() {
  return !this.isUsed && this.expiresAt > new Date();
};

// Transformar _id a id en JSON
invitationLinkSchema.methods.toJSON = function() {
  const invitation = this.toObject();
  invitation.id = invitation._id.toString();
  delete invitation._id;
  return invitation;
};

module.exports = mongoose.model('InvitationLink', invitationLinkSchema);
