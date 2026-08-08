const service = require('./dashboard.service');

async function adminSummary(req, res, next) {
  try {
    res.json(await service.getAdminSummary(req.tenantId));
  } catch (err) { next(err); }
}

module.exports = { adminSummary };
