const service = require('./patients.service');

async function list(req, res, next) {
  try {
    const items = await service.findAll(req.tenantId);
    res.json(items);
  } catch (err) {
    next(err);
  }
}

async function search(req, res, next) {
  try {
    const items = await service.search(req.tenantId, req.query.q);
    res.json(items);
  } catch (err) {
    next(err);
  }
}

async function summary(req, res, next) {
  try {
    const item = await service.summary(req.tenantId, req.params.id, req.userRole);
    if (!item) return res.status(404).json({ error: 'Paciente nao encontrado(a).' });
    res.json(item);
  } catch (err) {
    next(err);
  }
}

async function getOne(req, res, next) {
  try {
    const item = await service.findById(req.tenantId, req.params.id);
    if (!item) return res.status(404).json({ error: 'Paciente nao encontrado(a).' });
    if (req.userRole === 'assistente') {
      const { alergias, ...rest } = item;
      return res.json(rest);
    }
    res.json(item);
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const item = await service.create(req.tenantId, req.body);
    res.status(201).json(item);
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const item = await service.update(req.tenantId, req.params.id, { ...req.body, _role: req.userRole });
    if (!item) return res.status(404).json({ error: 'Paciente nao encontrado(a).' });
    res.json(item);
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    await service.remove(req.tenantId, req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = { list, getOne, create, update, remove, search, summary };
