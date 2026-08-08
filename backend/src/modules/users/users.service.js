const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const User = require('../../models/User');

const SALT_ROUNDS = 12;
const ROLES_CRIAVEIS = ['admin', 'medico', 'assistente'];

async function findAll(tenantId) {
  return User.find({ tenantId }).sort({ createdAt: -1 });
}

async function create(tenantId, { nome, email, password, role, doctorId }) {
  if (!ROLES_CRIAVEIS.includes(role)) {
    const err = new Error(`role deve ser um de: ${ROLES_CRIAVEIS.join(', ')}.`);
    err.status = 400;
    throw err;
  }

  if (role === 'medico' && !mongoose.isValidObjectId(doctorId)) {
    const err = new Error('doctorId e obrigatorio e precisa ser valido quando role e "medico".');
    err.status = 400;
    throw err;
  }

  const normalizedEmail = String(email || '').trim().toLowerCase();
  const existing = await User.findOne({ email: normalizedEmail });
  if (existing) {
    const err = new Error('Ja existe uma conta com este email.');
    err.status = 409;
    throw err;
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await User.create({
    tenantId,
    nome,
    email: normalizedEmail,
    passwordHash,
    role,
    doctorId: role === 'medico' ? doctorId : null,
  });

  return user;
}

async function remove(tenantId, id, requesterId) {
  if (!mongoose.isValidObjectId(id)) return;
  if (id === requesterId) {
    const err = new Error('Voce nao pode excluir a propria conta.');
    err.status = 400;
    throw err;
  }
  await User.deleteOne({ _id: id, tenantId });
}

module.exports = { findAll, create, remove };
