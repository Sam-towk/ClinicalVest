// Modulo: Encaminhamento de medicamentos
// Service = unica camada que fala com o banco. Controller nunca monta query direto.
const mongoose = require('mongoose');
const MedicationReferral = require('../../models/MedicationReferral');
const Doctor = require('../../models/Doctor');

// So o medico que fica "dono" de um encaminhamento tem seu acesso restrito
// ao proprio criado - admin e assistente enxergam tudo (precisam acompanhar
// a rota logistica de qualquer encaminhamento da clinica).
function scopedFilter(tenantId, requester) {
  const filter = { tenantId };
  if (requester.role === 'medico') filter.doctorId = requester.doctorId;
  return filter;
}

async function findAll(tenantId, requester) {
  return MedicationReferral.find(scopedFilter(tenantId, requester)).sort({ createdAt: -1 });
}

async function findById(tenantId, id, requester) {
  if (!mongoose.isValidObjectId(id)) return null;
  return MedicationReferral.findOne({ _id: id, ...scopedFilter(tenantId, requester) });
}

async function create(tenantId, data, requester) {
  let doctorId = requester.doctorId;

  if (requester.role === 'assistente') {
    // Assistente registra em nome de um medico (indicacao verbal) - precisa
    // dizer qual, e esse medico precisa existir nesta clinica.
    doctorId = data?.doctorId;
    if (!mongoose.isValidObjectId(doctorId) || !(await Doctor.exists({ _id: doctorId, tenantId }))) {
      const err = new Error('doctorId invalido ou de outra clinica.');
      err.status = 400;
      throw err;
    }
  }

  const { doctorId: _ignored, tenantId: _t, ...safeData } = data || {};
  return MedicationReferral.create({ ...safeData, tenantId, doctorId });
}

// Campos clinicos so quem criou (medico) edita; setor_destino (logistica) e
// editavel por qualquer papel com acesso de edicao a este modulo.
const CLINICAL_FIELDS = ['medicamento', 'nivel_prioridade'];
const LOGISTICS_FIELDS = ['setor_destino'];

async function update(tenantId, id, data, requester) {
  if (!mongoose.isValidObjectId(id)) return null;

  const allowedKeys = requester.role === 'medico' ? [...CLINICAL_FIELDS, ...LOGISTICS_FIELDS] : LOGISTICS_FIELDS;
  const safeData = {};
  for (const key of allowedKeys) {
    if (data && key in data) safeData[key] = data[key];
  }

  return MedicationReferral.findOneAndUpdate(
    { _id: id, ...scopedFilter(tenantId, requester) },
    { $set: safeData },
    { new: true, runValidators: true }
  );
}

async function remove(tenantId, id) {
  if (!mongoose.isValidObjectId(id)) return;
  await MedicationReferral.deleteOne({ _id: id, tenantId });
}

module.exports = { findAll, findById, create, update, remove };
