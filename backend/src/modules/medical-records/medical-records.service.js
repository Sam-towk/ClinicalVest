const mongoose = require('mongoose');
const MedicalRecord = require('../../models/MedicalRecord');

function scopedFilter(tenantId, requester) {
  const filter = { tenantId };
  if (requester.role === 'medico') filter.doctorId = requester.doctorId;
  return filter;
}

async function findAll(tenantId, requester) {
  return MedicalRecord.find(scopedFilter(tenantId, requester)).sort({ createdAt: -1 });
}

async function findById(tenantId, id, requester) {
  if (!mongoose.isValidObjectId(id)) return null;
  return MedicalRecord.findOne({ _id: id, ...scopedFilter(tenantId, requester) });
}

async function create(tenantId, data, requester) {
  const { doctorId: _ignored, ...safeData } = data || {};
  return MedicalRecord.create({ ...safeData, tenantId, doctorId: requester.doctorId });
}

async function update(tenantId, id, data, requester) {
  if (!mongoose.isValidObjectId(id)) return null;
  const { tenantId: _t, doctorId: _d, ...safeData } = data || {};
  return MedicalRecord.findOneAndUpdate(
    { _id: id, ...scopedFilter(tenantId, requester) },
    { $set: safeData },
    { new: true, runValidators: true }
  );
}

async function remove(tenantId, id) {
  if (!mongoose.isValidObjectId(id)) return;
  await MedicalRecord.deleteOne({ _id: id, tenantId });
}

const RESTRICTED_FIELDS = ['alergias', 'classificacao_doenca'];

function serializeForRole(record, role) {
  const json = record.toJSON ? record.toJSON() : record;
  if (role !== 'assistente') return json;
  const restricted = { ...json };
  for (const field of RESTRICTED_FIELDS) delete restricted[field];
  return restricted;
}

module.exports = { findAll, findById, create, update, remove, serializeForRole };
