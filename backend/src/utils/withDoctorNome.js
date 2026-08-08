// Os models de agendamento/prontuario/encaminhamento guardam so o doctorId
// (ObjectId) - isso e o suficiente pro backend, mas a tabela do frontend
// precisa mostrar um nome, nao um hex de 24 caracteres. Em vez de usar
// populate() (que trocaria o formato de doctorId de string pra objeto em
// toda resposta, quebrando o formulario de edicao que espera o id puro),
// resolvemos os nomes numa consulta a parte e anexamos como campo extra.
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
