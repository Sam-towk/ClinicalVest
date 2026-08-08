const { Router } = require('express');
const controller = require('./queue.controller');
const requireRole = require('../../middlewares/requireRole');

const router = Router();

// Fila digital - por setor/prioridade, nao por medico (ver nota no guia:
// travar por doctorId aqui atrapalharia o proximo profissional livre de chamar).
router.get('/', controller.list);
router.get('/:id', controller.getOne);
router.post('/', requireRole('admin', 'assistente'), controller.create);
router.put('/:id', requireRole('admin', 'assistente', 'medico'), controller.update);
router.delete('/:id', requireRole('admin', 'assistente'), controller.remove);

module.exports = router;
