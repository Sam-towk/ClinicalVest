const mongoose = require('mongoose');
const toJSON = require('./plugins/toJSON');

const procedureReferralSchema = new mongoose.Schema(
  {
    tenantId: { type: String, required: true, index: true },
    paciente: { type: String, required: true },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true, index: true },
    procedimento: String,
    nivel_prioridade: String,
    setor_destino: String,
  },
  { timestamps: true, collection: 'procedure_referrals' }
);

toJSON(procedureReferralSchema);

module.exports = mongoose.model('ProcedureReferral', procedureReferralSchema);
