const mongoose = require('mongoose');
const toJSON = require('./plugins/toJSON');

const appointmentSchema = new mongoose.Schema(
  {
    tenantId: { type: String, required: true, index: true },
    paciente: { type: String, required: true },
    // Antes era uma string livre ("profissional"). Vira referência real pro
    // médico responsável — é o campo que permite filtrar "a agenda desse médico".
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true, index: true },
    data_hora: String,
    status: String,
  },
  { timestamps: true, collection: 'appointments' }
);

toJSON(appointmentSchema);

module.exports = mongoose.model('Appointment', appointmentSchema);
