const { prisma } = require('../../config/prisma');

function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function startOfWeek() {
  const date = startOfToday();
  const day = date.getDay();
  const diff = day === 0 ? 6 : day - 1;
  date.setDate(date.getDate() - diff);
  return date;
}

function monthsAgo(n) {
  const date = new Date();
  date.setMonth(date.getMonth() - n);
  return date;
}

async function getAdminSummary(tenantId) {
  const today = startOfToday();
  const week = startOfWeek();
  const yearAgo = monthsAgo(12);

  const [
    atendimentosHoje,
    atendimentosSemana,
    pacientesAtivos,
    faltas,
    totalComStatus,
    porMedicoRaw,
  ] = await Promise.all([
    prisma.consultation.count({
      where: { tenantId, status: 'finalizada', finalizadaEm: { gte: today } },
    }),
    prisma.consultation.count({
      where: { tenantId, status: 'finalizada', finalizadaEm: { gte: week } },
    }),
    prisma.patient.count({
      where: {
        tenantId,
        consultations: { some: { status: 'finalizada', finalizadaEm: { gte: yearAgo } } },
      },
    }),
    prisma.queueTicket.count({
      where: { tenantId, status: 'faltou', updatedAt: { gte: week } },
    }),
    prisma.queueTicket.count({
      where: {
        tenantId,
        status: { in: ['atendido', 'faltou'] },
        updatedAt: { gte: week },
      },
    }),
    prisma.consultation.groupBy({
      by: ['doctorId'],
      where: { tenantId, status: 'finalizada', finalizadaEm: { gte: week } },
      _count: { _all: true },
    }),
  ]);

  const doctorIds = porMedicoRaw.map((r) => r.doctorId);
  const doctors = doctorIds.length
    ? await prisma.doctor.findMany({
        where: { tenantId, id: { in: doctorIds } },
        select: { id: true, nome: true },
      })
    : [];
  const nameById = new Map(doctors.map((d) => [d.id, d.nome]));

  const taxaFalta = totalComStatus === 0 ? 0 : Math.round((faltas / totalComStatus) * 100);

  return {
    atendimentosHoje,
    atendimentosSemana,
    pacientesAtivos,
    taxaFalta,
    atendimentosPorMedico: porMedicoRaw.map((r) => ({
      doctorId: r.doctorId,
      doctorNome: nameById.get(r.doctorId) ?? 'Medico',
      total: r._count._all,
    })),
  };
}

module.exports = { getAdminSummary };
