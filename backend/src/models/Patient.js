const mongoose = require('mongoose');
const toJSON = require('./plugins/toJSON');

const patientSchema = new mongoose.Schema(
  {
    tenantId: { type: String, required: true, index: true },
    nome: { type: String, required: true },
    especie: String, // humano/pet
    documento: String, // CPF / tutor
    contato: String,
  },
  { timestamps: true, collection: 'patients' }
);

toJSON(patientSchema);

module.exports = mongoose.model('Patient', patientSchema);
