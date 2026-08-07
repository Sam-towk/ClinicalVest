const mongoose = require('mongoose');
const toJSON = require('./plugins/toJSON');

const doctorSchema = new mongoose.Schema(
  {
    tenantId: { type: String, required: true, index: true },
    nome: { type: String, required: true },
    email: String,
    telefone: String,
    especialidade: String,
  },
  { timestamps: true, collection: 'doctors' }
);

toJSON(doctorSchema);

module.exports = mongoose.model('Doctor', doctorSchema);
