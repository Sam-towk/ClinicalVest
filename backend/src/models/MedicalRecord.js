const mongoose = require('mongoose');
const toJSON = require('./plugins/toJSON');

const medicalRecordSchema = new mongoose.Schema(
  {
    tenantId: { type: String, required: true, index: true },
    paciente: { type: String, required: true },
    // Autor clínico do prontuário. Usado tanto pro filtro "só os meus" quanto
    // pra decidir, no controller, se quem está lendo pode ver os campos sensíveis.
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true, index: true },
    alergias: String,
    exames_solicitados: String,
    itens_prescritos: String,
    classificacao_doenca: String, // CID
  },
  { timestamps: true, collection: 'medical_records' }
);

toJSON(medicalRecordSchema);

module.exports = mongoose.model('MedicalRecord', medicalRecordSchema);
