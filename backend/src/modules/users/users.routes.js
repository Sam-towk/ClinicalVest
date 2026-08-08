const { Router } = require('express');
const controller = require('./users.controller');
const requireRole = require('../../middlewares/requireRole');

const router = Router();

router.use(requireRole('admin'));

// Leitura
router.get('/', controller.list);

// Escrita
router.post('/', controller.create);
router.delete('/:id', controller.remove);

module.exports = router;
