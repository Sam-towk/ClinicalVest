// Cria usuario de teste: admin@admin / admin
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { prisma } = require('../src/config/prisma');

const EMAIL = 'admin@admin';
const PASSWORD = 'admin';
const TENANT_ID = 'admin';

async function main() {
  const existing = await prisma.user.findUnique({ where: { email: EMAIL } });
  if (existing) {
    console.log(`seed: usuario ${EMAIL} ja existe`);
    return;
  }

  const passwordHash = await bcrypt.hash(PASSWORD, 12);
  await prisma.user.create({
    data: {
      tenantId: TENANT_ID,
      nome: 'Admin',
      email: EMAIL,
      passwordHash,
      role: 'admin',
    },
  });
  console.log(`seed: criado ${EMAIL} (senha: ${PASSWORD})`);
}

main()
  .catch((err) => {
    console.error('seed falhou', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
