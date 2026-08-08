// Config usado só pelo CLI do Prisma (migrate/generate/studio) - a aplicação
// em runtime conecta via driver adapter (ver src/config/prisma.js) usando
// DATABASE_URL (connection pooler). Migrations precisam de conexão direta
// (sessão longa, sem pgbouncer em modo transaction), por isso usam DIRECT_URL.
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env.DIRECT_URL || process.env.DATABASE_URL,
  },
});
