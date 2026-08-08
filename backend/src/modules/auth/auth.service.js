const bcrypt = require('bcryptjs');
const User = require('../../models/User');
const { signToken } = require('../../utils/jwt');

const SALT_ROUNDS = 12;

async function register({ tenantId, nome, email, password }) {
  const normalizedEmail = String(email || '').trim().toLowerCase();

  const existing = await User.findOne({ email: normalizedEmail });
  if (existing) {
    const err = new Error('Ja existe uma conta com este email.');
    err.status = 409;
    throw err;
  }

  const tenantJaTemUsuario = await User.exists({ tenantId });
  if (tenantJaTemUsuario) {
    const err = new Error('Esta clinica ja possui um administrador. Peca para ele criar sua conta.');
    err.status = 409;
    throw err;
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await User.create({ tenantId, nome, email: normalizedEmail, passwordHash, role: 'admin' });

  return buildAuthResponse(user);
}

async function login({ email, password }) {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const user = await User.findOne({ email: normalizedEmail });

  const invalidCredentialsError = () => {
    const err = new Error('Email ou senha invalidos.');
    err.status = 401;
    return err;
  };

  if (!user) throw invalidCredentialsError();

  const matches = await bcrypt.compare(password, user.passwordHash);
  if (!matches) throw invalidCredentialsError();

  return buildAuthResponse(user);
}

function buildAuthResponse(user) {
  const token = signToken({
    sub: user.id,
    tenantId: user.tenantId,
    role: user.role,
    doctorId: user.doctorId || undefined,
  });
  return { token, user: user.toJSON() };
}

module.exports = { register, login };
