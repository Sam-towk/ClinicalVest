const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const authMiddleware = require('./middlewares/auth.middleware');
const errorHandler = require('./middlewares/errorHandler');

const authRoutes = require('./modules/auth/auth.routes');
const patientsRoutes = require('./modules/patients/patients.routes');
const schedulingRoutes = require('./modules/scheduling/scheduling.routes');
const queueRoutes = require('./modules/queue/queue.routes');
const doctorsRoutes = require('./modules/doctors/doctors.routes');
const usersRoutes = require('./modules/users/users.routes');
const dashboardRoutes = require('./modules/dashboard/dashboard.routes');
const consultationsRoutes = require('./modules/consultations/consultations.routes');

const app = express();

app.set('trust proxy', 1);

app.use(helmet());

const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins,
  })
);

app.use(express.json({ limit: '100kb' }));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', apiLimiter);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api', authMiddleware);

app.use('/api/patients', patientsRoutes);
app.use('/api/consultations', consultationsRoutes);
app.use('/api/scheduling', schedulingRoutes);
app.use('/api/queue', queueRoutes);
app.use('/api/doctors', doctorsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.use((req, res) => res.status(404).json({ error: 'Rota nao encontrada' }));
app.use(errorHandler);

module.exports = app;
