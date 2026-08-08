// Migracao: node scripts/migrate-staff-to-assistente.js
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
