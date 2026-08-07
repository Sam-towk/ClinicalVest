const mongoose = require('mongoose');
const toJSON = require('./plugins/toJSON');

const appointmentSchema = new mongoose.Schema(
  {
    tenantId: { type: String, required: true, index: true },
    paciente: { type: String, required: true },
    profissional: String,
    data_hora: String,
    status: String,
  },
  { timestamps: true, collection: 'appointments' }
);

toJSON(appointmentSchema);

module.exports = mongoose.model('Appointment', appointmentSchema);
