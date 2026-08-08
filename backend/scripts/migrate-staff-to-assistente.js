// Roda uma vez, manualmente: node scripts/migrate-staff-to-assistente.js
//
// User.role era um enum ['admin', 'staff']; virou ['admin', 'medico', 'assistente'].
// Contas antigas com role 'staff' nao validam mais no schema novo (embora o
// Mongo nao valide leitura, qualquer update futuro nelas falharia). Isso so
// resolve o rename do papel - nao ha como inferir automaticamente o
// User.doctorId de um medico a partir de dados existentes (o vinculo nunca
// existiu antes), entao contas que deveriam virar 'medico' precisam ser
// recriadas manualmente pelo admin via tela de "Contas de usuario" depois
// de rodar isto.
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../src/config/db');
const User = require('../src/models/User');

async function main() {
  await connectDB();

  const result = await User.updateMany(
    { role: 'staff' },
    { $set: { role: 'assistente' } }
  );

  console.log(`Migrados ${result.modifiedCount} usuario(s) de 'staff' para 'assistente'.`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('Falha na migracao:', err);
  process.exit(1);
});
