const { Router } = require('express');
const controller = require('./consultations.controller');
const requireRole = require('../../middlewares/requireRole');

const router = Router();
const medico = requireRole('medico');

router.get('/current', medico, controller.current);
router.get('/history', medico, controller.history);
router.post('/call-next', medico, controller.callNext);
router.post('/prescriptions/:prescriptionId/end', medico, controller.endPrescription);

router.patch('/:id', medico, controller.patch);
router.post('/:id/pause', medico, controller.pause);
router.post('/:id/finish', medico, controller.finish);
router.post('/:id/undo-finish', medico, controller.undoFinish);
router.post('/:id/reopen', medico, controller.reopen);

router.post('/:id/prescriptions', medico, controller.addPrescription);
router.post('/:id/prescriptions/:prescriptionId/renew', medico, controller.renewPrescription);

router.post('/:id/exams', medico, controller.addExam);
router.post('/:id/certificates', medico, controller.addCertificate);
router.post('/:id/referrals', medico, controller.addReferral);
router.delete('/:id/:kind/:itemId', medico, controller.removeAttached);

module.exports = router;
