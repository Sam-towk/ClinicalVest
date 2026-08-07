// Toda requisicao autenticada precisa de um JWT valido no header Authorization.
// O tenantId nunca vem do cliente (antes vinha de x-tenant-id, o que permitia
// qualquer requisicao acessar dados de qualquer clinica) - ele e extraido do
// token assinado pelo servidor no login.
const { verifyToken } = require('../utils/jwt');

function authMiddleware(req, res, next) {
  const header = req.header('authorization') || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Nao autenticado.' });
  }

  try {
    const payload = verifyToken(token);
    req.tenantId = payload.tenantId;
    req.userId = payload.sub;
    req.userRole = payload.role;
    next();
  } catch {
    return res.status(401).json({ error: 'Token invalido ou expirado.' });
  }
}

module.exports = authMiddleware;
