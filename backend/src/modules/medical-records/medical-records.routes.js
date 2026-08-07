const { Router } = require('express');
const controller = require('./medical-records.controller');

const router = Router();

// Prontuarios
router.get('/', controller.list);
router.get('/:id', controller.getOne);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.remove);

module.exports = router;
