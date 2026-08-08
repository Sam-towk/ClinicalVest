const { Router } = require('express');
const controller = require('./queue.controller');
const requireRole = require('../../middlewares/requireRole');

const router = Router();

// Leitura
router.get('/', controller.list);
router.get('/:id', controller.getOne);

// Escrita
router.post('/', requireRole('admin', 'assistente'), controller.create);
router.put('/:id', requireRole('admin', 'assistente', 'medico'), controller.update);
router.delete('/:id', requireRole('admin', 'assistente'), controller.remove);

module.exports = router;
