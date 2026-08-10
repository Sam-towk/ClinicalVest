const { prisma } = require('../../config/prisma');
const isValidUuid = require('../../utils/isValidUuid');
const pickFields = require('../../utils/pickFields');

const DRAFT_FIELDS = ['queixa', 'conduta', 'cid'];
const OPEN_STATUSES = ['em_atendimento', 'rascunho', 'pausada'];

function sameDay(date) {
  const d = new Date(date);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

async function loadContext(tenantId, patientId, consultationId) {
  const [patient, continuous, conditions, recent, prescriptions, exams, certificates, referrals, waiting] =
    await Promise.all([
      prisma.patient.findFirst({ where: { id: patientId, tenantId } }),
      prisma.prescription.findMany({
        where: { tenantId, patientId, usoContinuo: true },
        orderBy: { iniciadaEm: 'desc' },
      }),
      prisma.consultation.findMany({
        where: { tenantId, patientId, cid: { not: null }, NOT: { id: consultationId } },
        orderBy: { iniciadaEm: 'desc' },
        take: 10,
        include: { doctor: { select: { nome: true } } },
      }),
      prisma.consultation.findMany({
        where: { tenantId, patientId, status: 'finalizada', NOT: { id: consultationId } },
        orderBy: { finalizadaEm: 'desc' },
        take: 3,
        include: { doctor: { select: { nome: true } } },
      }),
      prisma.prescription.findMany({
        where: { tenantId, consultationId },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.examRequest.findMany({
        where: { tenantId, consultationId },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.certificate.findMany({
        where: { tenantId, consultationId },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.referral.findMany({
        where: { tenantId, consultationId },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.queueTicket.findMany({
        where: { tenantId, status: 'aguardando' },
        orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
        take: 5,
        include: { patient: { select: { nome: true } } },
      }),
    ]);

  const lastConsult = await prisma.consultation.findFirst({
    where: { tenantId, patientId, status: 'finalizada', NOT: { id: consultationId } },
    orderBy: { finalizadaEm: 'desc' },
  });

  const waitingCount = await prisma.queueTicket.count({
    where: { tenantId, status: 'aguardando' },
  });

  return {
    patient: patient
      ? {
          id: patient.id,
          nome: patient.nome,
          documentoMascarado: maskCpf(patient.documento),
          contato: patient.contato,
          dataNasc: patient.dataNasc,
          alergias: patient.alergias,
          ultimaConsulta: lastConsult?.finalizadaEm || lastConsult?.iniciadaEm || null,
        }
      : null,
    continuousPrescriptions: continuous,
    conditions: conditions.map((c) => ({
      cid: c.cid,
      desde: c.iniciadaEm,
      doctorNome: c.doctor.nome,
    })),
    recentConsultations: recent.map((c) => ({
      id: c.id,
      data: c.finalizadaEm || c.iniciadaEm,
      doctorNome: c.doctor.nome,
      resumo: (c.queixa || c.conduta || '').slice(0, 120),
    })),
    attached: { prescriptions, exams, certificates, referrals },
    miniQueue: {
      next: waiting.slice(0, 2).map((t) => t.patient.nome),
      waitingCount,
    },
  };
}

function maskCpf(documento) {
  if (!documento) return null;
  const digits = String(documento).replace(/\D/g, '');
  if (digits.length < 5) return '***';
  return `${digits.slice(0, 3)}.***.***-${digits.slice(-2)}`;
}

async function getCurrent(tenantId, doctorId) {
  if (!doctorId) {
    const err = new Error('Conta medica sem doctorId vinculado.');
    err.status = 400;
    throw err;
  }

  const consultation = await prisma.consultation.findFirst({
    where: { tenantId, doctorId, status: { in: ['em_atendimento', 'rascunho'] } },
    orderBy: { iniciadaEm: 'desc' },
  });

  const waitingCount = await prisma.queueTicket.count({
    where: { tenantId, status: 'aguardando' },
  });
  const waiting = await prisma.queueTicket.findMany({
    where: { tenantId, status: 'aguardando' },
    orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
    take: 2,
    include: { patient: { select: { nome: true } } },
  });

  if (!consultation) {
    return {
      consultation: null,
      context: null,
      miniQueue: {
        next: waiting.map((t) => t.patient.nome),
        waitingCount,
      },
    };
  }

  const context = await loadContext(tenantId, consultation.patientId, consultation.id);
  return { consultation, context, miniQueue: context.miniQueue };
}

async function assertOwnedOpen(tenantId, id, doctorId) {
  if (!isValidUuid(id)) return null;
  return prisma.consultation.findFirst({
    where: { id, tenantId, doctorId, status: { in: OPEN_STATUSES } },
  });
}

async function patchDraft(tenantId, id, doctorId, data) {
  const existing = await assertOwnedOpen(tenantId, id, doctorId);
  if (!existing) return null;
  if (existing.status === 'finalizada') {
    const err = new Error('Consulta finalizada.');
    err.status = 400;
    throw err;
  }
  const safe = pickFields(data, DRAFT_FIELDS);
  return prisma.consultation.update({ where: { id }, data: safe });
}

async function pause(tenantId, id, doctorId) {
  const existing = await assertOwnedOpen(tenantId, id, doctorId);
  if (!existing) return null;

  const updated = await prisma.consultation.update({
    where: { id },
    data: { status: 'pausada' },
  });

  await prisma.queueTicket.updateMany({
    where: { tenantId, consultationId: id },
    data: { status: 'pausado' },
  });

  // if no ticket linked, put patient back in queue
  const linked = await prisma.queueTicket.findFirst({ where: { tenantId, consultationId: id } });
  if (!linked) {
    const maxPos = await prisma.queueTicket.aggregate({
      where: { tenantId, status: { in: ['aguardando', 'pausado'] } },
      _max: { position: true },
    });
    await prisma.queueTicket.create({
      data: {
        tenantId,
        patientId: existing.patientId,
        doctorId,
        consultationId: id,
        status: 'pausado',
        position: (maxPos._max.position ?? -1) + 1,
      },
    });
  }

  return updated;
}

async function promoteNext(tenantId, doctorId) {
  const next = await prisma.queueTicket.findFirst({
    where: {
      tenantId,
      status: { in: ['aguardando', 'pausado'] },
      OR: [{ doctorId: null }, { doctorId }],
    },
    orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
  });
  if (!next) return null;

  // resume paused consultation if any
  if (next.consultationId) {
    const paused = await prisma.consultation.findFirst({
      where: { id: next.consultationId, tenantId, status: 'pausada' },
    });
    if (paused) {
      await prisma.consultation.update({
        where: { id: paused.id },
        data: { status: 'em_atendimento', doctorId },
      });
      await prisma.queueTicket.update({
        where: { id: next.id },
        data: { status: 'em_atendimento', doctorId },
      });
      return paused.id;
    }
  }

  const consultation = await prisma.consultation.create({
    data: {
      tenantId,
      patientId: next.patientId,
      doctorId,
      status: 'em_atendimento',
    },
  });
  await prisma.queueTicket.update({
    where: { id: next.id },
    data: { status: 'em_atendimento', doctorId, consultationId: consultation.id },
  });
  return consultation.id;
}

async function finish(tenantId, id, doctorId) {
  const existing = await assertOwnedOpen(tenantId, id, doctorId);
  if (!existing) return null;

  const finished = await prisma.consultation.update({
    where: { id },
    data: { status: 'finalizada', finalizadaEm: new Date() },
  });

  await prisma.queueTicket.updateMany({
    where: { tenantId, consultationId: id },
    data: { status: 'atendido' },
  });

  const nextId = await promoteNext(tenantId, doctorId);
  const current = await getCurrent(tenantId, doctorId);

  return {
    finished,
    nextConsultationId: nextId,
    current,
    undoUntil: new Date(Date.now() + 10_000).toISOString(),
  };
}

async function undoFinish(tenantId, id, doctorId) {
  if (!isValidUuid(id)) return null;
  const existing = await prisma.consultation.findFirst({
    where: { id, tenantId, doctorId, status: 'finalizada' },
  });
  if (!existing || !existing.finalizadaEm) return null;
  if (Date.now() - new Date(existing.finalizadaEm).getTime() > 15_000) {
    const err = new Error('Janela de desfazer expirou.');
    err.status = 400;
    throw err;
  }

  // if another consultation was opened, leave it — just reopen this one only if doctor has no open
  const open = await prisma.consultation.findFirst({
    where: { tenantId, doctorId, status: { in: ['em_atendimento', 'rascunho'] } },
  });
  if (open && open.id !== id) {
    await prisma.consultation.update({
      where: { id: open.id },
      data: { status: 'pausada' },
    });
    await prisma.queueTicket.updateMany({
      where: { consultationId: open.id },
      data: { status: 'pausado' },
    });
  }

  await prisma.consultation.update({
    where: { id },
    data: { status: 'em_atendimento', finalizadaEm: null },
  });
  await prisma.queueTicket.updateMany({
    where: { tenantId, consultationId: id },
    data: { status: 'em_atendimento' },
  });

  return getCurrent(tenantId, doctorId);
}

async function callNext(tenantId, doctorId) {
  if (!doctorId) {
    const err = new Error('Conta medica sem doctorId vinculado.');
    err.status = 400;
    throw err;
  }
  const open = await prisma.consultation.findFirst({
    where: { tenantId, doctorId, status: { in: ['em_atendimento', 'rascunho'] } },
  });
  if (open) {
    const err = new Error('Ja existe paciente em atendimento.');
    err.status = 409;
    throw err;
  }
  const nextId = await promoteNext(tenantId, doctorId);
  if (!nextId) {
    const err = new Error('Fila vazia.');
    err.status = 404;
    throw err;
  }
  return getCurrent(tenantId, doctorId);
}

async function reopen(tenantId, id, doctorId) {
  if (!isValidUuid(id)) return null;
  const existing = await prisma.consultation.findFirst({
    where: { id, tenantId, doctorId, status: 'finalizada' },
  });
  if (!existing || !existing.finalizadaEm || !sameDay(existing.finalizadaEm)) {
    const err = new Error('So e possivel reabrir consultas finalizadas no mesmo dia.');
    err.status = 400;
    throw err;
  }
  const open = await prisma.consultation.findFirst({
    where: { tenantId, doctorId, status: { in: ['em_atendimento', 'rascunho'] } },
  });
  if (open) {
    const err = new Error('Finalize ou pause o atendimento atual antes de reabrir outra consulta.');
    err.status = 409;
    throw err;
  }
  await prisma.consultation.update({
    where: { id },
    data: { status: 'em_atendimento', finalizadaEm: null },
  });
  return getCurrent(tenantId, doctorId);
}

async function myHistory(tenantId, doctorId) {
  return prisma.consultation.findMany({
    where: { tenantId, doctorId, status: 'finalizada' },
    orderBy: { finalizadaEm: 'desc' },
    take: 50,
    include: { patient: { select: { id: true, nome: true } } },
  });
}

async function addPrescription(tenantId, consultationId, doctorId, data) {
  const c = await assertOwnedOpen(tenantId, consultationId, doctorId);
  if (!c) return null;
  const safe = pickFields(data, ['medicamento', 'dose', 'posologia', 'duracao', 'usoContinuo']);
  if (!safe.medicamento) {
    const err = new Error('medicamento obrigatorio.');
    err.status = 400;
    throw err;
  }
  return prisma.prescription.create({
    data: {
      tenantId,
      patientId: c.patientId,
      consultationId: c.id,
      medicamento: safe.medicamento,
      dose: safe.dose,
      posologia: safe.posologia,
      duracao: safe.duracao,
      usoContinuo: Boolean(safe.usoContinuo),
    },
  });
}

async function renewPrescription(tenantId, consultationId, doctorId, prescriptionId) {
  const c = await assertOwnedOpen(tenantId, consultationId, doctorId);
  if (!c) return null;
  if (!isValidUuid(prescriptionId)) return null;
  const prev = await prisma.prescription.findFirst({
    where: { id: prescriptionId, tenantId, patientId: c.patientId },
  });
  if (!prev) {
    const err = new Error('Prescricao nao encontrada.');
    err.status = 404;
    throw err;
  }
  return prisma.prescription.create({
    data: {
      tenantId,
      patientId: c.patientId,
      consultationId: c.id,
      medicamento: prev.medicamento,
      dose: prev.dose,
      posologia: prev.posologia,
      duracao: prev.duracao,
      usoContinuo: prev.usoContinuo,
    },
  });
}

async function endPrescription(tenantId, prescriptionId) {
  if (!isValidUuid(prescriptionId)) return null;
  const existing = await prisma.prescription.findFirst({ where: { id: prescriptionId, tenantId } });
  if (!existing) return null;
  return prisma.prescription.update({
    where: { id: prescriptionId },
    data: { encerradaEm: new Date() },
  });
}

async function addExam(tenantId, consultationId, doctorId, data) {
  const c = await assertOwnedOpen(tenantId, consultationId, doctorId);
  if (!c) return null;
  const safe = pickFields(data, ['tipo', 'justificativa']);
  if (!safe.tipo) {
    const err = new Error('tipo obrigatorio.');
    err.status = 400;
    throw err;
  }
  return prisma.examRequest.create({
    data: {
      tenantId,
      patientId: c.patientId,
      consultationId: c.id,
      tipo: safe.tipo,
      justificativa: safe.justificativa,
    },
  });
}

async function addCertificate(tenantId, consultationId, doctorId, data) {
  const c = await assertOwnedOpen(tenantId, consultationId, doctorId);
  if (!c) return null;
  const dias = Number(data.dias);
  if (!Number.isFinite(dias) || dias < 1) {
    const err = new Error('dias deve ser um inteiro >= 1.');
    err.status = 400;
    throw err;
  }
  return prisma.certificate.create({
    data: {
      tenantId,
      patientId: c.patientId,
      consultationId: c.id,
      doctorId,
      dias,
      cid: data.cid || null,
    },
  });
}

async function addReferral(tenantId, consultationId, doctorId, data) {
  const c = await assertOwnedOpen(tenantId, consultationId, doctorId);
  if (!c) return null;
  const safe = pickFields(data, ['destino', 'motivo']);
  if (!safe.destino) {
    const err = new Error('destino obrigatorio.');
    err.status = 400;
    throw err;
  }
  return prisma.referral.create({
    data: {
      tenantId,
      patientId: c.patientId,
      consultationId: c.id,
      doctorId,
      destino: safe.destino,
      motivo: safe.motivo,
    },
  });
}

async function removeAttached(tenantId, consultationId, doctorId, kind, itemId) {
  const c = await assertOwnedOpen(tenantId, consultationId, doctorId);
  if (!c || c.status === 'finalizada') return false;
  if (!isValidUuid(itemId)) return false;

  if (kind === 'prescriptions') {
    await prisma.prescription.deleteMany({ where: { id: itemId, tenantId, consultationId } });
  } else if (kind === 'exams') {
    await prisma.examRequest.deleteMany({ where: { id: itemId, tenantId, consultationId } });
  } else if (kind === 'certificates') {
    await prisma.certificate.deleteMany({ where: { id: itemId, tenantId, consultationId } });
  } else if (kind === 'referrals') {
    await prisma.referral.deleteMany({ where: { id: itemId, tenantId, consultationId } });
  } else {
    return false;
  }
  return true;
}

module.exports = {
  getCurrent,
  patchDraft,
  pause,
  finish,
  undoFinish,
  callNext,
  reopen,
  myHistory,
  addPrescription,
  renewPrescription,
  endPrescription,
  addExam,
  addCertificate,
  addReferral,
  removeAttached,
  startOfToday,
};
