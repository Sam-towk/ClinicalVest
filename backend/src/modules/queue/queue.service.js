// Modulo: Fila digital
// Service = unica camada que fala com o banco. Controller nunca monta query direto.
const { prisma } = require('../../config/prisma');
const isValidUuid = require('../../utils/isValidUuid');
const pickFields = require('../../utils/pickFields');

const WRITABLE = ['paciente', 'setor', 'prioridade', 'status'];

async function findAll(tenantId) {
  return prisma.queueTicket.findMany({ where: { tenantId }, orderBy: { createdAt: 'desc' } });
}

async function findById(tenantId, id) {
  if (!isValidUuid(id)) return null;
  return prisma.queueTicket.findFirst({ where: { id, tenantId } });
}

async function create(tenantId, data) {
  return prisma.queueTicket.create({ data: { ...pickFields(data, WRITABLE), tenantId } });
}

async function update(tenantId, id, data) {
  if (!isValidUuid(id)) return null;
  const safeData = pickFields(data, WRITABLE);
  const existing = await prisma.queueTicket.findFirst({ where: { id, tenantId } });
  if (!existing) return null;
  return prisma.queueTicket.update({ where: { id }, data: safeData });
}

async function remove(tenantId, id) {
  if (!isValidUuid(id)) return;
  await prisma.queueTicket.deleteMany({ where: { id, tenantId } });
}

module.exports = { findAll, findById, create, update, remove };
