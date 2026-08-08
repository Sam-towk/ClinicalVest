const { Router } = require('express');
const controller = require('./medication-referral.controller');
const requireRole = require('../../middlewares/requireRole');

const router = Router();

// Encaminhamento de medicamentos
router.get('/', controller.list);
router.get('/:id', controller.getOne);
// Decisao clinica - so quem atende o paciente cria (medico ou, em nome dele, assistente).
router.post('/', requireRole('medico', 'assistente'), controller.create);
router.put('/:id', requireRole('medico', 'assistente', 'admin'), controller.update);
// Sem exclusao "de verdade" no fluxo normal - cancelamento e feito por status/setor.
// Fica so como acao administrativa de limpeza.
router.delete('/:id', requireRole('admin'), controller.remove);

module.exports = router;
