const service = require('./scheduling.service');
const withDoctorNome = require('../../utils/withDoctorNome');

function requesterFrom(req) {
  return { role: req.userRole, doctorId: req.doctorId };
}

async function list(req, res, next) {
  try {
    const items = await service.findAll(req.tenantId, requesterFrom(req));
    res.json(await withDoctorNome(req.tenantId, items.map((item) => item.toJSON())));
  } catch (err) { next(err); }
}

async function getOne(req, res, next) {
  try {
    const item = await service.findById(req.tenantId, req.params.id, requesterFrom(req));
    if (!item) return res.status(404).json({ error: 'Agendamentos nao encontrado(a).' });
    const [withName] = await withDoctorNome(req.tenantId, [item.toJSON()]);
    res.json(withName);
  } catch (err) { next(err); }
}

async function create(req, res, next) {
  try {
    const item = await service.create(req.tenantId, req.body);
    res.status(201).json(item);
  } catch (err) { next(err); }
}

async function update(req, res, next) {
  try {
    const item = await service.update(req.tenantId, req.params.id, req.body, requesterFrom(req));
    if (!item) return res.status(404).json({ error: 'Agendamentos nao encontrado(a) ou sem permissao para edita-lo.' });
    res.json(item);
  } catch (err) { next(err); }
}

async function remove(req, res, next) {
  try {
    await service.remove(req.tenantId, req.params.id);
    res.status(204).send();
  } catch (err) { next(err); }
}

module.exports = { list, getOne, create, update, remove };
