const { Router } = require('express');
const controller = require('./queue.controller');
const requireRole = require('../../middlewares/requireRole');

const router = Router();

router.get('/', controller.list);
router.post('/reorder', requireRole('admin', 'assistente'), controller.reorder);
router.post('/', requireRole('admin', 'assistente'), controller.create);
router.post('/:id/encaminhar', requireRole('admin', 'assistente'), controller.encaminhar);
router.get('/:id', controller.getOne);
router.put('/:id', requireRole('admin', 'assistente'), controller.update);
router.delete('/:id', requireRole('admin', 'assistente'), controller.remove);

module.exports = router;
