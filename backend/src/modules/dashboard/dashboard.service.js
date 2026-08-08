const { prisma } = require('../../config/prisma');

function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

async function getAdminSummary(tenantId) {
  const [medicosDePlantao, pacientesAguardando, pacientesAtendidosHoje] = await Promise.all([
    prisma.doctor.count({ where: { tenantId, plantao: 'Sim' } }),
    prisma.queueTicket.count({ where: { tenantId, status: 'Aguardando' } }),
    prisma.queueTicket.count({
      where: { tenantId, status: 'Atendido', updatedAt: { gte: startOfToday() } },
    }),
  ]);

  return { medicosDePlantao, pacientesAguardando, pacientesAtendidosHoje };
}

module.exports = { getAdminSummary };
