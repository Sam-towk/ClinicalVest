const { Router } = require('express');
const controller = require('./patients.controller');
const requireRole = require('../../middlewares/requireRole');

const router = Router();

router.get('/search', controller.search);
router.get('/', controller.list);
router.get('/:id/summary', controller.summary);
router.get('/:id', controller.getOne);

router.post('/', requireRole('admin', 'assistente'), controller.create);
router.put('/:id', requireRole('admin', 'assistente', 'medico'), controller.update);
router.delete('/:id', requireRole('admin'), controller.remove);

module.exports = router;
