const { Router } = require('express');
const controller = require('./medication-referral.controller');
const requireRole = require('../../middlewares/requireRole');

const router = Router();

// Leitura
router.get('/', controller.list);
router.get('/:id', controller.getOne);

// Escrita
router.post('/', requireRole('medico', 'assistente'), controller.create);
router.put('/:id', requireRole('medico', 'assistente', 'admin'), controller.update);

// Exclusao (admin)
router.delete('/:id', requireRole('admin'), controller.remove);

module.exports = router;
