const { Router } = require('express');
const rateLimit = require('express-rate-limit');
const controller = require('./auth.controller');

const router = Router();

// Login/registro sao alvo tipico de brute force e enumeracao de usuarios,
// por isso tem um limite bem mais apertado que o resto da API.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas tentativas. Tente novamente em alguns minutos.' },
});

router.post('/register', authLimiter, controller.register);
router.post('/login', authLimiter, controller.login);

module.exports = router;
