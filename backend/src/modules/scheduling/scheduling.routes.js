const { Router } = require('express');
const controller = require('./scheduling.controller');
const requireRole = require('../../middlewares/requireRole');

const router = Router();

// Leitura
router.get('/', controller.list);
router.get('/range', controller.range);
// UUID only so "/range" never cai em getOne se a ordem das rotas mudar.
router.get('/:id([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})', controller.getOne);

// Escrita
router.post('/', requireRole('admin', 'assistente'), controller.create);
router.put('/:id', requireRole('admin', 'assistente', 'medico'), controller.update);
router.delete('/:id', requireRole('admin', 'assistente'), controller.remove);

module.exports = router;
