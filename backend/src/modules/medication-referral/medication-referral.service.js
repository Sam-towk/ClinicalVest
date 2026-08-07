// Modulo: Encaminhamento de medicamentos
// Service = unica camada que fala com o banco. Controller nunca monta query direto.
const mongoose = require('mongoose');
const MedicationReferral = require('../../models/MedicationReferral');

async function findAll(tenantId) {
  return MedicationReferral.find({ tenantId }).sort({ createdAt: -1 });
}

async function findById(tenantId, id) {
  if (!mongoose.isValidObjectId(id)) return null;
  return MedicationReferral.findOne({ _id: id, tenantId });
}

async function create(tenantId, data) {
  return MedicationReferral.create({ ...data, tenantId });
}

async function update(tenantId, id, data) {
  if (!mongoose.isValidObjectId(id)) return null;
  const { tenantId: _ignored, ...safeData } = data || {};
  return MedicationReferral.findOneAndUpdate(
    { _id: id, tenantId },
    { $set: safeData },
    { new: true, runValidators: true }
  );
}

async function remove(tenantId, id) {
  if (!mongoose.isValidObjectId(id)) return;
  await MedicationReferral.deleteOne({ _id: id, tenantId });
}

module.exports = { findAll, findById, create, update, remove };
