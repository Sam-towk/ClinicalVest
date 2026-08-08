require('dotenv').config();
const app = require('./app');
const { connectDB } = require('./config/prisma');

const PORT = process.env.PORT || 3000;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Clinical Vest backend rodando em http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Falha ao conectar no Postgres (Supabase)', err);
    process.exit(1);
  });
