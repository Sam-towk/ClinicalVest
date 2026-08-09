// Modulo: Pacientes (clinica humana)
// Service = unica camada que fala com o banco. Controller nunca monta query direto.
const { prisma } = require('../../config/prisma');
const isValidUuid = require('../../utils/isValidUuid');
const pickFields = require('../../utils/pickFields');

const WRITABLE = ['nome', 'documento', 'contato'];

function deveAdicionarNaFila(value) {
  // Padrao: sim — em geral so cadastra quem esta presente para atendimento.
  if (value === undefined || value === null || value === '') return true;
  if (typeof value === 'boolean') return value;
  const s = String(value).trim().toLowerCase();
  if (['sim', 'true', '1', 'yes'].includes(s)) return true;
  if (['não', 'nao', 'false', '0', 'no'].includes(s)) return false;
  return true;
}

async function findAll(tenantId) {
  return prisma.patient.findMany({ where: { tenantId }, orderBy: { createdAt: 'desc' } });
}

async function findById(tenantId, id) {
  if (!isValidUuid(id)) return null;
  return prisma.patient.findFirst({ where: { id, tenantId } });
}

async function create(tenantId, data) {
  const adicionarNaFila = deveAdicionarNaFila(data?.adicionarNaFila);
  const safeData = pickFields(data, WRITABLE);

  const patient = await prisma.patient.create({
    data: { ...safeData, especie: 'Humano', tenantId },
  });

  if (adicionarNaFila) {
    await prisma.queueTicket.create({
      data: {
        tenantId,
        paciente: patient.nome,
        status: 'Aguardando',
        prioridade: 'Média',
      },
    });
  }

  return patient;
}

async function update(tenantId, id, data) {
  if (!isValidUuid(id)) return null;
  const safeData = pickFields(data, WRITABLE);
  const existing = await prisma.patient.findFirst({ where: { id, tenantId } });
  if (!existing) return null;
  return prisma.patient.update({ where: { id }, data: safeData });
}

async function remove(tenantId, id) {
  if (!isValidUuid(id)) return;
  await prisma.patient.deleteMany({ where: { id, tenantId } });
}

module.exports = { findAll, findById, create, update, remove };
