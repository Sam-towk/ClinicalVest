const { Router } = require('express');
const controller = require('./users.controller');
const requireRole = require('../../middlewares/requireRole');

const router = Router();

// So admin gerencia contas - criar um medico/assistente/outro admin do
// proprio tenant, listar quem tem acesso, ou revogar acesso.
router.use(requireRole('admin'));

router.get('/', controller.list);
router.post('/', controller.create);
router.delete('/:id', controller.remove);

module.exports = router;
