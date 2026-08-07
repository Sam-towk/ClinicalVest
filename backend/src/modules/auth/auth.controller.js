const service = require('./auth.service');

function validateCredentials(email, password) {
  if (!email || !password || typeof password !== 'string' || password.length < 8) {
    const err = new Error('Email e senha (minimo 8 caracteres) sao obrigatorios.');
    err.status = 400;
    throw err;
  }
}

async function register(req, res, next) {
  try {
    const { tenantId, nome, email, password } = req.body || {};
    if (!tenantId || !nome) {
      return res.status(400).json({ error: 'tenantId e nome sao obrigatorios.' });
    }
    validateCredentials(email, password);

    const result = await service.register({ tenantId, nome, email, password });
    res.status(201).json(result);
  } catch (err) { next(err); }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body || {};
    validateCredentials(email, password);

    const result = await service.login({ email, password });
    res.json(result);
  } catch (err) { next(err); }
}

module.exports = { register, login };
