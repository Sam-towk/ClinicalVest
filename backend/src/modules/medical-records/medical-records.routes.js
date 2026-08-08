const { Router } = require('express');
const controller = require('./medical-records.controller');
const requireRole = require('../../middlewares/requireRole');

const router = Router();

// Todo autenticado le a lista - o assistente recebe os registros com os
// campos clinicos sensiveis removidos (isso acontece no controller/service,
// nao aqui: a rota nao sabe nada sobre "quais campos", so sobre "pode ou nao").
router.get('/', controller.list);
router.get('/:id', controller.getOne);

// So medico registra/edita prontuario, e sempre o dele (garantido no service).
router.post('/', requireRole('medico'), controller.create);
router.put('/:id', requireRole('medico'), controller.update);

// Exclusao e uma acao administrativa/de auditoria, fora do fluxo clinico
// normal. Ideal seria soft-delete (manter historico) - fica de melhoria futura.
router.delete('/:id', requireRole('admin'), controller.remove);

module.exports = router;
