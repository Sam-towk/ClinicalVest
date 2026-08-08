const { Router } = require('express');
const controller = require('./medical-records.controller');
const requireRole = require('../../middlewares/requireRole');

const router = Router();

// Leitura
router.get('/', controller.list);
router.get('/:id', controller.getOne);

// Escrita (medico)
router.post('/', requireRole('medico'), controller.create);
router.put('/:id', requireRole('medico'), controller.update);

// Exclusao (admin)
router.delete('/:id', requireRole('admin'), controller.remove);

module.exports = router;
