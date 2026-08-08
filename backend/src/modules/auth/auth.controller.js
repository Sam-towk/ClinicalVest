const service = require('./auth.service');

function requireCredentials(email, password, { minPasswordLength = 1 } = {}) {
  if (!email || !password || typeof password !== 'string' || password.length < minPasswordLength) {
    const err = new Error(
      minPasswordLength > 1
        ? `Email e senha (minimo ${minPasswordLength} caracteres) sao obrigatorios.`
        : 'Email e senha sao obrigatorios.'
    );
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
    requireCredentials(email, password, { minPasswordLength: 8 });

    const result = await service.register({ tenantId, nome, email, password });
    res.status(201).json(result);
  } catch (err) { next(err); }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body || {};
    requireCredentials(email, password);

    const result = await service.login({ email, password });
    res.json(result);
  } catch (err) { next(err); }
}

module.exports = { register, login };
