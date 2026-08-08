const { Router } = require('express');
const controller = require('./scheduling.controller');
const requireRole = require('../../middlewares/requireRole');

const router = Router();

// Agendamentos
router.get('/', controller.list);
router.get('/:id', controller.getOne);
router.post('/', requireRole('admin', 'assistente'), controller.create);
// Medico pode chegar aqui (so muda status do que e dele - ver scheduling.service.js).
router.put('/:id', requireRole('admin', 'assistente', 'medico'), controller.update);
router.delete('/:id', requireRole('admin', 'assistente'), controller.remove);

module.exports = router;
