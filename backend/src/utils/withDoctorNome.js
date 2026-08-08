const Doctor = require('../models/Doctor');

async function withDoctorNome(tenantId, items) {
  const ids = [...new Set(items.map((item) => item.doctorId).filter(Boolean).map(String))];

  const nameById = new Map();
  if (ids.length > 0) {
    const doctors = await Doctor.find({ tenantId, _id: { $in: ids } }, 'nome');
    for (const doctor of doctors) nameById.set(doctor.id, doctor.nome);
  }

  return items.map((item) => ({
    ...item,
    doctorNome: item.doctorId ? (nameById.get(String(item.doctorId)) ?? 'Medico removido') : '',
  }));
}

module.exports = withDoctorNome;
