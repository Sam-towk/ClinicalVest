const { Router } = require('express');
const controller = require('./dashboard.controller');
const requireRole = require('../../middlewares/requireRole');

const router = Router();

router.get('/admin-summary', requireRole('admin'), controller.adminSummary);

module.exports = router;
