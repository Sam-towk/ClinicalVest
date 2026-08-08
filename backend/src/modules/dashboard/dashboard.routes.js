const { Router } = require('express');
const controller = require('./dashboard.controller');
const requireRole = require('../../middlewares/requireRole');

const router = Router();

// So admin ve esse resumo - medico e assistente tem seus proprios paineis
// (agenda do dia, fila), nao numeros consolidados da clinica inteira.
router.get('/admin-summary', requireRole('admin'), controller.adminSummary);

module.exports = router;
