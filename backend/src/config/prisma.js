// Conexao unica com o Postgres (Supabase) via Prisma.
// Todos os models usam o campo tenantId + filtros por tenantId nos services
// para garantir o isolamento multi-tenant (linha a linha).
const { PrismaClient } = require('../generated/prisma');
const { PrismaPg } = require('@prisma/adapter-pg');
require('dotenv').config();

function assertSupabaseUrl(url, name) {
  if (!url) {
    throw new Error(`${name} nao configurada. Copie backend/.env.example → backend/.env e cole as URLs do Supabase.`);
  }
  if (url.includes('[PASSWORD]') || url.includes('[PROJECT-REF]') || url.includes('[REGION]') || url.includes('[SUA-SENHA]')) {
    throw new Error(`${name} ainda tem placeholder. Use a URI do pooler do Supabase (veja .env.example).`);
  }
}

// pg v8 trata sslmode=require como verify-full; uselibpqcompat evita falha com a cadeia do Supabase.
function withPgSslCompat(url) {
  if (!url || url.includes('uselibpqcompat=')) return url;
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}uselibpqcompat=true`;
}

const DATABASE_URL = withPgSslCompat(process.env.DATABASE_URL);

assertSupabaseUrl(DATABASE_URL, 'DATABASE_URL');

const adapter = new PrismaPg({ connectionString: DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// Bloqueia SQL montado por string (vetor classico de injection).
// Queries vao so pelo Prisma Client API (parametrizado).
for (const method of ['$queryRawUnsafe', '$executeRawUnsafe']) {
  prisma[method] = () => {
    throw new Error(`${method} desabilitado: use o Prisma Client API.`);
  };
}

async function connectDB() {
  await prisma.$connect();
}

module.exports = { prisma, connectDB };
