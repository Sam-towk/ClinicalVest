const mongoose = require('mongoose');
const toJSON = require('./plugins/toJSON');

const doctorSchema = new mongoose.Schema(
  {
    tenantId: { type: String, required: true, index: true },
    nome: { type: String, required: true },
    email: String,
    telefone: String,
    especialidade: String,
    // Status operacional do dia, nao um dado de cadastro - mas mora aqui
    // porque e uma propriedade do medico, nao de um agendamento especifico.
    plantao: { type: String, enum: ['Sim', 'Não'], default: 'Não' },
  },
  { timestamps: true, collection: 'doctors' }
);

toJSON(doctorSchema);

module.exports = mongoose.model('Doctor', doctorSchema);
