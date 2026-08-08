// Modulo: Dashboard
// So leitura/agregacao - nao tem model proprio, so conta documentos de outros.
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
    // "Atendidos hoje", nao "atendidos desde sempre" - senao o numero so cresce
    // e nunca reflete o plantao do dia. updatedAt e usado como proxy de quando
    // o status virou "Atendido" (a fila nao guarda um timestamp dedicado pra isso).
    QueueTicket.countDocuments({ tenantId, status: 'Atendido', updatedAt: { $gte: startOfToday() } }),
  ]);

  return { medicosDePlantao, pacientesAguardando, pacientesAtendidosHoje };
}

module.exports = { getAdminSummary };
