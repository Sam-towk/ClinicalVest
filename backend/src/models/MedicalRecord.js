const mongoose = require('mongoose');
const toJSON = require('./plugins/toJSON');

const medicalRecordSchema = new mongoose.Schema(
  {
    tenantId: { type: String, required: true, index: true },
    paciente: { type: String, required: true },
    alergias: String,
    exames_solicitados: String,
    itens_prescritos: String,
    classificacao_doenca: String, // CID
  },
  { timestamps: true, collection: 'medical_records' }
);

toJSON(medicalRecordSchema);

module.exports = mongoose.model('MedicalRecord', medicalRecordSchema);
