// Modulo: Agendamentos
// Service = unica camada que fala com o banco. Controller nunca monta query direto.
const mongoose = require('mongoose');
const Appointment = require('../../models/Appointment');

async function findAll(tenantId) {
  return Appointment.find({ tenantId }).sort({ createdAt: -1 });
}

async function findById(tenantId, id) {
  if (!mongoose.isValidObjectId(id)) return null;
  return Appointment.findOne({ _id: id, tenantId });
}

async function create(tenantId, data) {
  return Appointment.create({ ...data, tenantId });
}

async function update(tenantId, id, data) {
  if (!mongoose.isValidObjectId(id)) return null;
  const { tenantId: _ignored, ...safeData } = data || {};
  return Appointment.findOneAndUpdate(
    { _id: id, tenantId },
    { $set: safeData },
    { new: true, runValidators: true }
  );
}

async function remove(tenantId, id) {
  if (!mongoose.isValidObjectId(id)) return;
  await Appointment.deleteOne({ _id: id, tenantId });
}

module.exports = { findAll, findById, create, update, remove };
