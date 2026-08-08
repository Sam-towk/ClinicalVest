const { prisma } = require('../../config/prisma');
const isValidUuid = require('../../utils/isValidUuid');
const pickFields = require('../../utils/pickFields');

const WRITABLE = ['paciente', 'alergias', 'exames_solicitados', 'itens_prescritos', 'classificacao_doenca'];

function scopedFilter(tenantId, requester) {
  const filter = { tenantId };
  if (requester.role === 'medico') filter.doctorId = requester.doctorId;
  return filter;
}

async function findAll(tenantId, requester) {
  return prisma.medicalRecord.findMany({ where: scopedFilter(tenantId, requester), orderBy: { createdAt: 'desc' } });
}

async function findById(tenantId, id, requester) {
  if (!isValidUuid(id)) return null;
  return prisma.medicalRecord.findFirst({ where: { id, ...scopedFilter(tenantId, requester) } });
}

async function create(tenantId, data, requester) {
  const safeData = pickFields(data, WRITABLE);
  return prisma.medicalRecord.create({ data: { ...safeData, tenantId, doctorId: requester.doctorId } });
}

async function update(tenantId, id, data, requester) {
  if (!isValidUuid(id)) return null;
  const safeData = pickFields(data, WRITABLE);
  const existing = await prisma.medicalRecord.findFirst({ where: { id, ...scopedFilter(tenantId, requester) } });
  if (!existing) return null;
  return prisma.medicalRecord.update({ where: { id }, data: safeData });
}

async function remove(tenantId, id) {
  if (!isValidUuid(id)) return;
  await prisma.medicalRecord.deleteMany({ where: { id, tenantId } });
}

const RESTRICTED_FIELDS = ['alergias', 'classificacao_doenca'];

function serializeForRole(record, role) {
  if (role !== 'assistente') return record;
  const restricted = { ...record };
  for (const field of RESTRICTED_FIELDS) delete restricted[field];
  return restricted;
}

module.exports = { findAll, findById, create, update, remove, serializeForRole };
