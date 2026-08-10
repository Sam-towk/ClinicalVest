// Modulo: Pacientes (clinica humana)
const { prisma } = require('../../config/prisma');
const isValidUuid = require('../../utils/isValidUuid');
const pickFields = require('../../utils/pickFields');

const WRITABLE = ['nome', 'documento', 'contato', 'dataNasc', 'alergias', 'observacoes'];

function deveAdicionarNaFila(value) {
  if (value === undefined || value === null || value === '') return true;
  if (typeof value === 'boolean') return value;
  const s = String(value).trim().toLowerCase();
  if (['sim', 'true', '1', 'yes'].includes(s)) return true;
  if (['não', 'nao', 'false', '0', 'no'].includes(s)) return false;
  return true;
}

function maskCpf(documento) {
  if (!documento) return null;
  const digits = String(documento).replace(/\D/g, '');
  if (digits.length < 5) return '***';
  return `${digits.slice(0, 3)}.***.***-${digits.slice(-2)}`;
}

function parseDataNasc(value) {
  if (value === undefined || value === null || value === '') return undefined;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    const err = new Error('dataNasc invalida.');
    err.status = 400;
    throw err;
  }
  return d;
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
  if (safeData.dataNasc !== undefined) safeData.dataNasc = parseDataNasc(safeData.dataNasc);

  // ponytail: duplicate warning only; hard-block later if duplicates become a real issue
  const patient = await prisma.patient.create({
    data: { ...safeData, especie: 'Humano', tenantId },
  });

  if (adicionarNaFila) {
    const maxPos = await prisma.queueTicket.aggregate({
      where: { tenantId, status: { in: ['aguardando', 'pausado'] } },
      _max: { position: true },
    });
    await prisma.queueTicket.create({
      data: {
        tenantId,
        patientId: patient.id,
        status: 'aguardando',
        position: (maxPos._max.position ?? -1) + 1,
      },
    });
  }

  return patient;
}

async function update(tenantId, id, data) {
  if (!isValidUuid(id)) return null;
  const safeData = pickFields(data, WRITABLE);
  if (safeData.dataNasc !== undefined) safeData.dataNasc = parseDataNasc(safeData.dataNasc);
  // assistente nao edita alergias via este caminho clinico — so medico/admin
  if (data._role === 'assistente') delete safeData.alergias;

  const existing = await prisma.patient.findFirst({ where: { id, tenantId } });
  if (!existing) return null;
  return prisma.patient.update({ where: { id }, data: safeData });
}

async function remove(tenantId, id) {
  if (!isValidUuid(id)) return;
  await prisma.patient.deleteMany({ where: { id, tenantId } });
}

async function search(tenantId, q) {
  const query = String(q || '').trim();
  if (query.length < 2) return [];

  const digits = query.replace(/\D/g, '');
  const patients = await prisma.patient.findMany({
    where: {
      tenantId,
      OR: [
        { nome: { contains: query, mode: 'insensitive' } },
        ...(digits.length >= 3 ? [{ documento: { contains: digits } }] : []),
        ...(digits.length >= 3 ? [{ documento: { contains: query } }] : []),
      ],
    },
    take: 20,
    orderBy: { nome: 'asc' },
  });

  const results = [];
  for (const p of patients) {
    const last = await prisma.consultation.findFirst({
      where: { tenantId, patientId: p.id, status: 'finalizada' },
      orderBy: { finalizadaEm: 'desc' },
      include: { doctor: { select: { nome: true } } },
    });
    results.push({
      id: p.id,
      nome: p.nome,
      documentoMascarado: maskCpf(p.documento),
      dataNasc: p.dataNasc,
      ultimaConsulta: last
        ? { data: last.finalizadaEm || last.iniciadaEm, doctorNome: last.doctor.nome }
        : null,
    });
  }
  return results;
}

async function summary(tenantId, id, role) {
  if (!isValidUuid(id)) return null;
  const patient = await prisma.patient.findFirst({ where: { id, tenantId } });
  if (!patient) return null;

  const isAssistente = role === 'assistente';

  const [consultations, prescriptions, examRequests, certificates, referrals] = await Promise.all([
    prisma.consultation.findMany({
      where: { tenantId, patientId: id },
      orderBy: { iniciadaEm: 'desc' },
      include: { doctor: { select: { id: true, nome: true } } },
    }),
    isAssistente
      ? Promise.resolve([])
      : prisma.prescription.findMany({
          where: { tenantId, patientId: id },
          orderBy: { iniciadaEm: 'desc' },
        }),
    prisma.examRequest.findMany({
      where: { tenantId, patientId: id },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.certificate.findMany({
      where: { tenantId, patientId: id },
      orderBy: { createdAt: 'desc' },
      include: { doctor: { select: { nome: true } } },
    }),
    prisma.referral.findMany({
      where: { tenantId, patientId: id },
      orderBy: { createdAt: 'desc' },
      include: { doctor: { select: { nome: true } } },
    }),
  ]);

  const continuous = isAssistente
    ? []
    : prescriptions.filter((p) => p.usoContinuo);

  const conditions = isAssistente
    ? []
    : consultations
        .filter((c) => c.cid)
        .map((c) => ({ cid: c.cid, desde: c.iniciadaEm, doctorNome: c.doctor.nome }));

  return {
    patient: {
      id: patient.id,
      nome: patient.nome,
      documento: isAssistente ? maskCpf(patient.documento) : patient.documento,
      documentoMascarado: maskCpf(patient.documento),
      contato: patient.contato,
      dataNasc: patient.dataNasc,
      observacoes: patient.observacoes,
      ...(isAssistente ? {} : { alergias: patient.alergias }),
    },
    continuousPrescriptions: continuous,
    conditions,
    consultations: consultations.map((c) => ({
      id: c.id,
      status: c.status,
      iniciadaEm: c.iniciadaEm,
      finalizadaEm: c.finalizadaEm,
      doctorNome: c.doctor.nome,
      doctorId: c.doctorId,
      ...(isAssistente
        ? {}
        : { queixa: c.queixa, conduta: c.conduta, cid: c.cid }),
    })),
    prescriptions: isAssistente ? undefined : prescriptions,
    exams: examRequests.map((e) => ({
      id: e.id,
      tipo: e.tipo,
      status: e.status,
      createdAt: e.createdAt,
      ...(isAssistente ? {} : { justificativa: e.justificativa, resultado: e.resultado }),
    })),
    documents: {
      certificates: certificates.map((c) => ({
        id: c.id,
        dias: c.dias,
        cid: isAssistente ? undefined : c.cid,
        createdAt: c.createdAt,
        doctorNome: c.doctor.nome,
      })),
      referrals: referrals.map((r) => ({
        id: r.id,
        destino: r.destino,
        motivo: r.motivo,
        createdAt: r.createdAt,
        doctorNome: r.doctor.nome,
      })),
    },
  };
}

module.exports = { findAll, findById, create, update, remove, search, summary };
