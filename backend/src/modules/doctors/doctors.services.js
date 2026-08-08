// Service = unica camada que fala com o banco. Controller nunca monta query direto.
const mongoose = require('mongoose');
const Doctor = require('../../models/Doctor');
const User = require('../../models/User');

async function findAll(tenantId) {
  return Doctor.find({ tenantId }).sort({ createdAt: -1 });
}

async function findById(tenantId, id) {
  if (!mongoose.isValidObjectId(id)) return null;
  return Doctor.findOne({ _id: id, tenantId });
}

async function create(tenantId, data) {
  return Doctor.create({ ...data, tenantId });
}

async function update(tenantId, id, data) {
  if (!mongoose.isValidObjectId(id)) return null;
  const { tenantId: _ignored, ...safeData } = data || {};
  return Doctor.findOneAndUpdate(
    { _id: id, tenantId },
    { $set: safeData },
    { new: true, runValidators: true }
  );
}

async function remove(tenantId, id) {
  if (!mongoose.isValidObjectId(id)) return;

  // Uma conta de login (User.doctorId) apontando pra um Doctor que sumiu
  // quebraria o filtro "so os meus" desse medico (ele deixaria de enxergar
  // qualquer coisa, silenciosamente). Historico em Appointment/MedicalRecord/
  // etc. pode conviver com um doctorId orfao (e so registro passado), mas a
  // conta de login ativa nao pode.
  const linkedUser = await User.exists({ tenantId, doctorId: id });
  if (linkedUser) {
    const err = new Error('Existe uma conta de usuario vinculada a este medico. Remova ou desvincule a conta antes de excluir o cadastro.');
    err.status = 409;
    throw err;
  }

  await Doctor.deleteOne({ _id: id, tenantId });
}

module.exports = { findAll, findById, create, update, remove };
