const service = require('./consultations.service');

function doctorId(req) {
  return req.doctorId;
}

async function current(req, res, next) {
  try {
    res.json(await service.getCurrent(req.tenantId, doctorId(req)));
  } catch (err) {
    next(err);
  }
}

async function history(req, res, next) {
  try {
    res.json(await service.myHistory(req.tenantId, doctorId(req)));
  } catch (err) {
    next(err);
  }
}

async function patch(req, res, next) {
  try {
    const item = await service.patchDraft(req.tenantId, req.params.id, doctorId(req), req.body);
    if (!item) return res.status(404).json({ error: 'Consulta nao encontrada.' });
    res.json(item);
  } catch (err) {
    next(err);
  }
}

async function pause(req, res, next) {
  try {
    const item = await service.pause(req.tenantId, req.params.id, doctorId(req));
    if (!item) return res.status(404).json({ error: 'Consulta nao encontrada.' });
    res.json(item);
  } catch (err) {
    next(err);
  }
}

async function finish(req, res, next) {
  try {
    const result = await service.finish(req.tenantId, req.params.id, doctorId(req));
    if (!result) return res.status(404).json({ error: 'Consulta nao encontrada.' });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function undoFinish(req, res, next) {
  try {
    const result = await service.undoFinish(req.tenantId, req.params.id, doctorId(req));
    if (!result) return res.status(404).json({ error: 'Consulta nao encontrada.' });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function callNext(req, res, next) {
  try {
    res.json(await service.callNext(req.tenantId, doctorId(req)));
  } catch (err) {
    next(err);
  }
}

async function reopen(req, res, next) {
  try {
    const result = await service.reopen(req.tenantId, req.params.id, doctorId(req));
    if (!result) return res.status(404).json({ error: 'Consulta nao encontrada.' });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function addPrescription(req, res, next) {
  try {
    const item = await service.addPrescription(req.tenantId, req.params.id, doctorId(req), req.body);
    if (!item) return res.status(404).json({ error: 'Consulta nao encontrada.' });
    res.status(201).json(item);
  } catch (err) {
    next(err);
  }
}

async function renewPrescription(req, res, next) {
  try {
    const item = await service.renewPrescription(
      req.tenantId,
      req.params.id,
      doctorId(req),
      req.params.prescriptionId
    );
    if (!item) return res.status(404).json({ error: 'Consulta ou prescricão nao encontrada.' });
    res.status(201).json(item);
  } catch (err) {
    next(err);
  }
}

async function endPrescription(req, res, next) {
  try {
    const item = await service.endPrescription(req.tenantId, req.params.prescriptionId);
    if (!item) return res.status(404).json({ error: 'Prescricao nao encontrada.' });
    res.json(item);
  } catch (err) {
    next(err);
  }
}

async function addExam(req, res, next) {
  try {
    const item = await service.addExam(req.tenantId, req.params.id, doctorId(req), req.body);
    if (!item) return res.status(404).json({ error: 'Consulta nao encontrada.' });
    res.status(201).json(item);
  } catch (err) {
    next(err);
  }
}

async function addCertificate(req, res, next) {
  try {
    const item = await service.addCertificate(req.tenantId, req.params.id, doctorId(req), req.body);
    if (!item) return res.status(404).json({ error: 'Consulta nao encontrada.' });
    res.status(201).json(item);
  } catch (err) {
    next(err);
  }
}

async function addReferral(req, res, next) {
  try {
    const item = await service.addReferral(req.tenantId, req.params.id, doctorId(req), req.body);
    if (!item) return res.status(404).json({ error: 'Consulta nao encontrada.' });
    res.status(201).json(item);
  } catch (err) {
    next(err);
  }
}

async function removeAttached(req, res, next) {
  try {
    const ok = await service.removeAttached(
      req.tenantId,
      req.params.id,
      doctorId(req),
      req.params.kind,
      req.params.itemId
    );
    if (!ok) return res.status(404).json({ error: 'Item nao encontrado.' });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = {
  current,
  history,
  patch,
  pause,
  finish,
  undoFinish,
  callNext,
  reopen,
  addPrescription,
  renewPrescription,
  endPrescription,
  addExam,
  addCertificate,
  addReferral,
  removeAttached,
};
