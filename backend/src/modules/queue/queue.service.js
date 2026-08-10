// Modulo: Fila digital
const { prisma } = require('../../config/prisma');
const isValidUuid = require('../../utils/isValidUuid');
const pickFields = require('../../utils/pickFields');

const WRITABLE = ['patientId', 'setor', 'status', 'doctorId', 'position'];
const ACTIVE = ['aguardando', 'em_atendimento', 'pausado'];

function withPatientNome(ticket) {
  if (!ticket) return ticket;
  const { patient, ...rest } = ticket;
  return {
    ...rest,
    paciente: patient?.nome ?? '',
    patientNome: patient?.nome ?? '',
  };
}

async function findAll(tenantId) {
  const items = await prisma.queueTicket.findMany({
    where: { tenantId },
    orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
    include: {
      patient: { select: { id: true, nome: true } },
      doctor: { select: { id: true, nome: true } },
    },
  });
  return items.map(withPatientNome);
}

async function findById(tenantId, id) {
  if (!isValidUuid(id)) return null;
  const item = await prisma.queueTicket.findFirst({
    where: { id, tenantId },
    include: {
      patient: { select: { id: true, nome: true } },
      doctor: { select: { id: true, nome: true } },
    },
  });
  return withPatientNome(item);
}

async function nextPosition(tenantId) {
  const maxPos = await prisma.queueTicket.aggregate({
    where: { tenantId, status: { in: ACTIVE } },
    _max: { position: true },
  });
  return (maxPos._max.position ?? -1) + 1;
}

async function create(tenantId, data) {
  const safeData = pickFields(data, WRITABLE);
  if (!isValidUuid(safeData.patientId)) {
    const err = new Error('patientId obrigatorio.');
    err.status = 400;
    throw err;
  }
  const patient = await prisma.patient.findFirst({
    where: { id: safeData.patientId, tenantId },
    select: { id: true },
  });
  if (!patient) {
    const err = new Error('Paciente nao encontrado.');
    err.status = 400;
    throw err;
  }

  const position = safeData.position ?? (await nextPosition(tenantId));
  const item = await prisma.queueTicket.create({
    data: {
      tenantId,
      patientId: safeData.patientId,
      setor: safeData.setor,
      status: safeData.status || 'aguardando',
      doctorId: safeData.doctorId || null,
      position,
    },
    include: { patient: { select: { id: true, nome: true } } },
  });
  return withPatientNome(item);
}

async function update(tenantId, id, data) {
  if (!isValidUuid(id)) return null;
  const safeData = pickFields(data, WRITABLE);
  const existing = await prisma.queueTicket.findFirst({ where: { id, tenantId } });
  if (!existing) return null;
  const item = await prisma.queueTicket.update({
    where: { id },
    data: safeData,
    include: { patient: { select: { id: true, nome: true } } },
  });
  return withPatientNome(item);
}

async function remove(tenantId, id) {
  if (!isValidUuid(id)) return;
  await prisma.queueTicket.deleteMany({ where: { id, tenantId } });
}

async function reorder(tenantId, orderedIds) {
  if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
    const err = new Error('orderedIds deve ser um array de ids.');
    err.status = 400;
    throw err;
  }
  await prisma.$transaction(
    orderedIds.map((id, index) =>
      prisma.queueTicket.updateMany({
        where: { id, tenantId },
        data: { position: index },
      })
    )
  );
  return findAll(tenantId);
}

async function encaminhar(tenantId, ticketId, doctorId) {
  if (!isValidUuid(ticketId) || !isValidUuid(doctorId)) {
    const err = new Error('ticketId e doctorId obrigatorios.');
    err.status = 400;
    throw err;
  }

  const doctor = await prisma.doctor.findFirst({ where: { id: doctorId, tenantId } });
  if (!doctor) {
    const err = new Error('Medico nao encontrado.');
    err.status = 400;
    throw err;
  }

  const ticket = await prisma.queueTicket.findFirst({
    where: { id: ticketId, tenantId },
    include: { patient: true },
  });
  if (!ticket) {
    const err = new Error('Senha nao encontrada.');
    err.status = 404;
    throw err;
  }

  const open = await prisma.consultation.findFirst({
    where: { tenantId, doctorId, status: { in: ['em_atendimento', 'rascunho'] } },
  });
  if (open) {
    const err = new Error('Medico ja tem um paciente em atendimento.');
    err.status = 409;
    throw err;
  }

  const consultation = await prisma.consultation.create({
    data: {
      tenantId,
      patientId: ticket.patientId,
      doctorId,
      status: 'em_atendimento',
    },
  });

  const updated = await prisma.queueTicket.update({
    where: { id: ticket.id },
    data: {
      status: 'em_atendimento',
      doctorId,
      consultationId: consultation.id,
    },
    include: { patient: { select: { id: true, nome: true } }, doctor: { select: { id: true, nome: true } } },
  });

  return { ticket: withPatientNome(updated), consultation };
}

module.exports = { findAll, findById, create, update, remove, reorder, encaminhar };
