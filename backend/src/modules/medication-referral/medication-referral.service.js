const mongoose = require('mongoose');
const MedicationReferral = require('../../models/MedicationReferral');
const Doctor = require('../../models/Doctor');

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
