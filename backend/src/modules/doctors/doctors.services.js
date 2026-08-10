const { prisma } = require('../../config/prisma');
const isValidUuid = require('../../utils/isValidUuid');
const pickFields = require('../../utils/pickFields');

const WRITABLE = ['nome', 'email', 'telefone', 'especialidade'];

async function findAll(tenantId) {
  return prisma.doctor.findMany({ where: { tenantId }, orderBy: { createdAt: 'desc' } });
}

async function findById(tenantId, id) {
  if (!isValidUuid(id)) return null;
  return prisma.doctor.findFirst({ where: { id, tenantId } });
}

async function create(tenantId, data) {
  const safeData = pickFields(data, WRITABLE);
  return prisma.doctor.create({ data: { ...safeData, tenantId } });
}

async function update(tenantId, id, data) {
  if (!isValidUuid(id)) return null;
  const safeData = pickFields(data, WRITABLE);
  const existing = await prisma.doctor.findFirst({ where: { id, tenantId } });
  if (!existing) return null;
  return prisma.doctor.update({ where: { id }, data: safeData });
}

async function remove(tenantId, id) {
  if (!isValidUuid(id)) return;

  const linkedUser = await prisma.user.findFirst({ where: { tenantId, doctorId: id }, select: { id: true } });
  if (linkedUser) {
    const err = new Error('Existe uma conta de usuario vinculada a este medico. Remova ou desvincule a conta antes de excluir o cadastro.');
    err.status = 409;
    throw err;
  }

  await prisma.doctor.deleteMany({ where: { id, tenantId } });
}

module.exports = { findAll, findById, create, update, remove };
