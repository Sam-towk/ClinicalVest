const { Router } = require('express');
const controller = require('./doctors.controller');
const requireRole = require('../../middlewares/requireRole');

const router = Router();

// Medicos - cadastro do corpo clinico. So admin mantem; os outros so consultam
// (o select de "profissional responsavel" nas telas de agenda/prontuario/
// encaminhamento le esta lista, mas nao pode altera-la).
router.get('/', controller.list);
router.get('/:id', controller.getOne);
router.post('/', requireRole('admin'), controller.create);
router.put('/:id', requireRole('admin'), controller.update);
router.delete('/:id', requireRole('admin'), controller.remove);

module.exports = router;
