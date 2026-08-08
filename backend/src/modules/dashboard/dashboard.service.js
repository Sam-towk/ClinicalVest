const Doctor = require('../../models/Doctor');
const QueueTicket = require('../../models/QueueTicket');

function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

async function getAdminSummary(tenantId) {
  const [medicosDePlantao, pacientesAguardando, pacientesAtendidosHoje] = await Promise.all([
    Doctor.countDocuments({ tenantId, plantao: 'Sim' }),
    QueueTicket.countDocuments({ tenantId, status: 'Aguardando' }),
    QueueTicket.countDocuments({ tenantId, status: 'Atendido', updatedAt: { $gte: startOfToday() } }),
  ]);

  return { medicosDePlantao, pacientesAguardando, pacientesAtendidosHoje };
}

module.exports = { getAdminSummary };
