const { Router } = require('express');
const controller = require('./scheduling.controller');

const router = Router();

// Agendamentos
router.get('/', controller.list);
router.get('/:id', controller.getOne);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.remove);

module.exports = router;
