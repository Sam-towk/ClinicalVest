const service = require('./users.service');

async function list(req, res, next) {
  try {
    res.json(await service.findAll(req.tenantId));
  } catch (err) { next(err); }
}

async function create(req, res, next) {
  try {
    const user = await service.create(req.tenantId, req.body);
    res.status(201).json(user);
  } catch (err) { next(err); }
}

async function remove(req, res, next) {
  try {
    await service.remove(req.tenantId, req.params.id, req.userId);
    res.status(204).send();
  } catch (err) { next(err); }
}

module.exports = { list, create, remove };
