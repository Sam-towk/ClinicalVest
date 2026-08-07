const mongoose = require('mongoose');
const toJSON = require('./plugins/toJSON');

const medicationReferralSchema = new mongoose.Schema(
  {
    tenantId: { type: String, required: true, index: true },
    paciente: { type: String, required: true },
    medicamento: String,
    nivel_prioridade: String,
    setor_destino: String,
  },
  { timestamps: true, collection: 'medication_referrals' }
);

toJSON(medicationReferralSchema);

module.exports = mongoose.model('MedicationReferral', medicationReferralSchema);
