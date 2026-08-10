const { prisma } = require('../../config/prisma');
const isValidUuid = require('../../utils/isValidUuid');
const pickFields = require('../../utils/pickFields');

const WRITABLE = ['patientId', 'doctorId', 'data_hora', 'status'];

// Duracao de um slot da agenda, em minutos. Dois agendamentos do mesmo medico
// nao podem cair dentro da mesma janela.
const SLOT_MINUTES = 30;

// Status que nao ocupam mais o horario na agenda.
const FREED_STATUSES = ['cancelado', 'faltou'];

function scopedFilter(tenantId, requester) {
  const filter = { tenantId };
  if (requester.role === 'medico') filter.doctorId = requester.doctorId;
  return filter;
}

function parseDataHora(value) {
  if (value === undefined || value === null || value === '') return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    const err = new Error('data_hora invalida.');
    err.status = 400;
    throw err;
  }
  return d;
}

function withNames(item) {
  if (!item) return item;
  const { patient, doctor, ...rest } = item;
  return {
    ...rest,
    paciente: patient?.nome ?? '',
    patientNome: patient?.nome ?? '',
    doctorNome: doctor?.nome ?? '',
  };
}

const include = {
  patient: { select: { id: true, nome: true } },
  doctor: { select: { id: true, nome: true } },
};

async function findAll(tenantId, requester) {
  const items = await prisma.appointment.findMany({
    where: scopedFilter(tenantId, requester),
    orderBy: [{ data_hora: 'asc' }, { createdAt: 'desc' }],
    include,
  });
  return items.map(withNames);
}

async function findById(tenantId, id, requester) {
  if (!isValidUuid(id)) return null;
  const item = await prisma.appointment.findFirst({
    where: { id, ...scopedFilter(tenantId, requester) },
    include,
  });
  return withNames(item);
}

async function assertPatient(tenantId, patientId) {
  if (!isValidUuid(patientId) || !(await prisma.patient.findFirst({ where: { id: patientId, tenantId }, select: { id: true } }))) {
    const err = new Error('patientId invalido ou de outra clinica.');
    err.status = 400;
    throw err;
  }
}

async function assertDoctor(tenantId, doctorId) {
  if (!isValidUuid(doctorId) || !(await prisma.doctor.findFirst({ where: { id: doctorId, tenantId }, select: { id: true } }))) {
    const err = new Error('doctorId invalido ou de outra clinica.');
    err.status = 400;
    throw err;
  }
}

/**
 * Rejeita um agendamento que caia no mesmo slot de outro do mesmo medico.
 * Agendamentos cancelados ou com falta liberam o horario.
 */
async function assertSlotLivre(tenantId, doctorId, dataHora, ignoreId) {
  if (!doctorId || !dataHora) return;

  const inicio = new Date(dataHora.getTime() - SLOT_MINUTES * 60_000 + 1);
  const fim = new Date(dataHora.getTime() + SLOT_MINUTES * 60_000 - 1);

  const conflito = await prisma.appointment.findFirst({
    where: {
      tenantId,
      doctorId,
      data_hora: { gte: inicio, lte: fim },
      NOT: { status: { in: FREED_STATUSES } },
      ...(ignoreId ? { id: { not: ignoreId } } : {}),
    },
    include: { patient: { select: { nome: true } } },
  });

  if (conflito) {
    const err = new Error(
      `Horario indisponivel: ja existe agendamento para este profissional as ${new Date(
        conflito.data_hora
      ).toLocaleString('pt-BR')}${conflito.patient?.nome ? ` (${conflito.patient.nome})` : ''}.`
    );
    err.status = 409;
    throw err;
  }
}

/**
 * Agendamentos de um intervalo (usado pela agenda semanal da recepcao).
 */
async function findRange(tenantId, requester, { from, to, doctorId }) {
  const inicio = new Date(from);
  const fim = new Date(to);
  if (Number.isNaN(inicio.getTime()) || Number.isNaN(fim.getTime())) {
    const err = new Error('Intervalo invalido.');
    err.status = 400;
    throw err;
  }

  const where = { ...scopedFilter(tenantId, requester), data_hora: { gte: inicio, lt: fim } };
  if (doctorId) {
    if (!isValidUuid(doctorId)) {
      const err = new Error('doctorId invalido.');
      err.status = 400;
      throw err;
    }
    where.doctorId = doctorId;
  }

  const items = await prisma.appointment.findMany({
    where,
    orderBy: [{ data_hora: 'asc' }],
    include,
  });
  return { slotMinutes: SLOT_MINUTES, items: items.map(withNames) };
}

async function create(tenantId, data) {
  const safeData = pickFields(data, WRITABLE);
  await assertPatient(tenantId, safeData.patientId);
  await assertDoctor(tenantId, safeData.doctorId);
  if (safeData.data_hora !== undefined) safeData.data_hora = parseDataHora(safeData.data_hora);

  if (!FREED_STATUSES.includes(safeData.status)) {
    await assertSlotLivre(tenantId, safeData.doctorId, safeData.data_hora);
  }

  const item = await prisma.appointment.create({
    data: { ...safeData, tenantId },
    include,
  });
  return withNames(item);
}

async function update(tenantId, id, data, requester) {
  if (!isValidUuid(id)) return null;
  const safeData =
    requester.role === 'medico' ? pickFields(data, ['status']) : pickFields(data, WRITABLE);

  if (safeData.doctorId !== undefined) await assertDoctor(tenantId, safeData.doctorId);
  if (safeData.patientId !== undefined) await assertPatient(tenantId, safeData.patientId);
  if (safeData.data_hora !== undefined) safeData.data_hora = parseDataHora(safeData.data_hora);

  const existing = await prisma.appointment.findFirst({ where: { id, ...scopedFilter(tenantId, requester) } });
  if (!existing) return null;

  const proximoStatus = safeData.status ?? existing.status;
  if (
    (safeData.data_hora !== undefined || safeData.doctorId !== undefined) &&
    !FREED_STATUSES.includes(proximoStatus)
  ) {
    await assertSlotLivre(
      tenantId,
      safeData.doctorId ?? existing.doctorId,
      safeData.data_hora !== undefined ? safeData.data_hora : existing.data_hora,
      id
    );
  }

  // check-in: agenda → fila
  if (safeData.status === 'na_fila' && existing.status !== 'na_fila') {
    const maxPos = await prisma.queueTicket.aggregate({
      where: { tenantId, status: { in: ['aguardando', 'pausado'] } },
      _max: { position: true },
    });
    await prisma.queueTicket.create({
      data: {
        tenantId,
        patientId: existing.patientId,
        doctorId: existing.doctorId,
        status: 'aguardando',
        position: (maxPos._max.position ?? -1) + 1,
      },
    });
  }

  const item = await prisma.appointment.update({ where: { id }, data: safeData, include });
  return withNames(item);
}

async function remove(tenantId, id) {
  if (!isValidUuid(id)) return;
  await prisma.appointment.deleteMany({ where: { id, tenantId } });
}

module.exports = { findAll, findById, findRange, create, update, remove, SLOT_MINUTES };
