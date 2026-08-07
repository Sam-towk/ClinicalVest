// Conexao unica com o MongoDB via Mongoose.
// Todos os models usam o campo tenantId + filtros por tenantId nos services
// para garantir o isolamento multi-tenant (documento a documento).
const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/saas_hospitalar';

mongoose.connection.on('error', (err) => {
  console.error('Erro inesperado na conexao com o MongoDB', err);
});

async function connectDB() {
  await mongoose.connect(MONGO_URI);
}

module.exports = connectDB;
