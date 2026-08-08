const { prisma } = require('../config/prisma');

async function withDoctorNome(tenantId, items) {
  const ids = [...new Set(items.map((item) => item.doctorId).filter(Boolean).map(String))];

  const nameById = new Map();
  if (ids.length > 0) {
    const doctors = await prisma.doctor.findMany({
      where: { tenantId, id: { in: ids } },
      select: { id: true, nome: true },
    });
    for (const doctor of doctors) nameById.set(doctor.id, doctor.nome);
  }

  return items.map((item) => ({
    ...item,
    doctorNome: item.doctorId ? (nameById.get(String(item.doctorId)) ?? 'Medico removido') : '',
  }));
}

module.exports = withDoctorNome;
