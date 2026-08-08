const bcrypt = require('bcryptjs');
const { prisma } = require('../../config/prisma');
const { signToken } = require('../../utils/jwt');
const toPublicUser = require('../../utils/toPublicUser');

const SALT_ROUNDS = 12;

async function register({ tenantId, nome, email, password }) {
  const normalizedEmail = String(email || '').trim().toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    const err = new Error('Ja existe uma conta com este email.');
    err.status = 409;
    throw err;
  }

  const tenantJaTemUsuario = await prisma.user.findFirst({ where: { tenantId }, select: { id: true } });
  if (tenantJaTemUsuario) {
    const err = new Error('Esta clinica ja possui um administrador. Peca para ele criar sua conta.');
    err.status = 409;
    throw err;
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await prisma.user.create({
    data: { tenantId, nome, email: normalizedEmail, passwordHash, role: 'admin' },
  });

  return buildAuthResponse(user);
}

async function login({ email, password }) {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

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
  return { token, user: toPublicUser(user) };
}

module.exports = { register, login };
