const { Router } = require('express');
const controller = require('./patients.controller');
const requireRole = require('../../middlewares/requireRole');

const router = Router();

// Pacientes/Pets - dado cadastral, nao clinico. Medico precisa ver a lista
// inteira pra poder abrir agendamento/prontuario de qualquer paciente, entao
// aqui nao ha "so os meus" (isso e restrito nos modulos clinicos, nao aqui).
router.get('/', controller.list);
router.get('/:id', controller.getOne);
router.post('/', requireRole('admin', 'assistente'), controller.create);
router.put('/:id', requireRole('admin', 'assistente'), controller.update);
router.delete('/:id', requireRole('admin'), controller.remove);

module.exports = router;
