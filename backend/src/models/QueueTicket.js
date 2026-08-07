const mongoose = require('mongoose');
const toJSON = require('./plugins/toJSON');

const queueTicketSchema = new mongoose.Schema(
  {
    tenantId: { type: String, required: true, index: true },
    paciente: { type: String, required: true },
    setor: String,
    prioridade: String,
    status: String, // aguardando/chamado/atendido
  },
  { timestamps: true, collection: 'queue_tickets' }
);

toJSON(queueTicketSchema);

module.exports = mongoose.model('QueueTicket', queueTicketSchema);
