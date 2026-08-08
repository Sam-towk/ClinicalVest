const { Router } = require('express');
const controller = require('./doctors.controller');
const requireRole = require('../../middlewares/requireRole');

const router = Router();

// Leitura
router.get('/', controller.list);
router.get('/:id', controller.getOne);

// Escrita (admin)
router.post('/', requireRole('admin'), controller.create);
router.put('/:id', requireRole('admin'), controller.update);
router.delete('/:id', requireRole('admin'), controller.remove);

module.exports = router;
