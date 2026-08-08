const mongoose = require('mongoose');
const Appointment = require('../../models/Appointment');
const Doctor = require('../../models/Doctor');

function scopedFilter(tenantId, requester) {
  const filter = { tenantId };
  if (requester.role === 'medico') filter.doctorId = requester.doctorId;
  return filter;
}

async function findAll(tenantId, requester) {
  return Appointment.find(scopedFilter(tenantId, requester)).sort({ createdAt: -1 });
}

async function findById(tenantId, id, requester) {
  if (!mongoose.isValidObjectId(id)) return null;
  return Appointment.findOne({ _id: id, ...scopedFilter(tenantId, requester) });
}

async function create(tenantId, data) {
  if (!mongoose.isValidObjectId(data?.doctorId) || !(await Doctor.exists({ _id: data.doctorId, tenantId }))) {
    const err = new Error('doctorId invalido ou de outra clinica.');
    err.status = 400;
    throw err;
  }
  return Appointment.create({ ...data, tenantId });
}

async function update(tenantId, id, data, requester) {
  if (!mongoose.isValidObjectId(id)) return null;
  const safeData =
    requester.role === 'medico' ? { status: data?.status } : (({ tenantId: _t, ...rest }) => rest)(data || {});

  return Appointment.findOneAndUpdate(
    { _id: id, ...scopedFilter(tenantId, requester) },
    { $set: safeData },
    { new: true, runValidators: true }
  );
}

async function remove(tenantId, id) {
  if (!mongoose.isValidObjectId(id)) return;
  await Appointment.deleteOne({ _id: id, tenantId });
}

module.exports = { findAll, findById, create, update, remove };
