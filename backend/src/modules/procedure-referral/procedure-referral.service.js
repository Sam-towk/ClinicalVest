const { prisma } = require('../../config/prisma');
const isValidUuid = require('../../utils/isValidUuid');
const pickFields = require('../../utils/pickFields');

const WRITABLE = ['paciente', 'procedimento', 'nivel_prioridade', 'setor_destino'];
const CLINICAL_FIELDS = ['procedimento', 'nivel_prioridade'];
const LOGISTICS_FIELDS = ['setor_destino'];

function scopedFilter(tenantId, requester) {
  const filter = { tenantId };
  if (requester.role === 'medico') filter.doctorId = requester.doctorId;
  return filter;
}

async function findAll(tenantId, requester) {
  return prisma.procedureReferral.findMany({ where: scopedFilter(tenantId, requester), orderBy: { createdAt: 'desc' } });
}

async function findById(tenantId, id, requester) {
  if (!isValidUuid(id)) return null;
  return prisma.procedureReferral.findFirst({ where: { id, ...scopedFilter(tenantId, requester) } });
}

async function create(tenantId, data, requester) {
  let doctorId = requester.doctorId;

  if (requester.role === 'assistente') {
    doctorId = data?.doctorId;
    if (!isValidUuid(doctorId) || !(await prisma.doctor.findFirst({ where: { id: doctorId, tenantId }, select: { id: true } }))) {
      const err = new Error('doctorId invalido ou de outra clinica.');
      err.status = 400;
      throw err;
    }
  }

  const safeData = pickFields(data, WRITABLE);
  return prisma.procedureReferral.create({ data: { ...safeData, tenantId, doctorId } });
}

async function update(tenantId, id, data, requester) {
  if (!isValidUuid(id)) return null;

  const allowedKeys = requester.role === 'medico' ? [...CLINICAL_FIELDS, ...LOGISTICS_FIELDS] : LOGISTICS_FIELDS;
  const safeData = pickFields(data, allowedKeys);

  const existing = await prisma.procedureReferral.findFirst({ where: { id, ...scopedFilter(tenantId, requester) } });
  if (!existing) return null;
  return prisma.procedureReferral.update({ where: { id }, data: safeData });
}

async function remove(tenantId, id) {
  if (!isValidUuid(id)) return;
  await prisma.procedureReferral.deleteMany({ where: { id, tenantId } });
}

module.exports = { findAll, findById, create, update, remove };
