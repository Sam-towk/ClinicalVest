const { prisma } = require('../../config/prisma');
const isValidUuid = require('../../utils/isValidUuid');
const pickFields = require('../../utils/pickFields');

const WRITABLE = ['paciente', 'doctorId', 'data_hora', 'status'];

function scopedFilter(tenantId, requester) {
  const filter = { tenantId };
  if (requester.role === 'medico') filter.doctorId = requester.doctorId;
  return filter;
}

async function findAll(tenantId, requester) {
  return prisma.appointment.findMany({ where: scopedFilter(tenantId, requester), orderBy: { createdAt: 'desc' } });
}

async function findById(tenantId, id, requester) {
  if (!isValidUuid(id)) return null;
  return prisma.appointment.findFirst({ where: { id, ...scopedFilter(tenantId, requester) } });
}

async function create(tenantId, data) {
  const safeData = pickFields(data, WRITABLE);
  if (!isValidUuid(safeData.doctorId) || !(await prisma.doctor.findFirst({ where: { id: safeData.doctorId, tenantId }, select: { id: true } }))) {
    const err = new Error('doctorId invalido ou de outra clinica.');
    err.status = 400;
    throw err;
  }
  return prisma.appointment.create({ data: { ...safeData, tenantId } });
}

async function update(tenantId, id, data, requester) {
  if (!isValidUuid(id)) return null;
  const safeData =
    requester.role === 'medico'
      ? pickFields(data, ['status'])
      : pickFields(data, WRITABLE);

  if (safeData.doctorId !== undefined) {
    if (!isValidUuid(safeData.doctorId) || !(await prisma.doctor.findFirst({ where: { id: safeData.doctorId, tenantId }, select: { id: true } }))) {
      const err = new Error('doctorId invalido ou de outra clinica.');
      err.status = 400;
      throw err;
    }
  }

  const existing = await prisma.appointment.findFirst({ where: { id, ...scopedFilter(tenantId, requester) } });
  if (!existing) return null;
  return prisma.appointment.update({ where: { id }, data: safeData });
}

async function remove(tenantId, id) {
  if (!isValidUuid(id)) return;
  await prisma.appointment.deleteMany({ where: { id, tenantId } });
}

module.exports = { findAll, findById, create, update, remove };
