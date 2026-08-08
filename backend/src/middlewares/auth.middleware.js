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
    req.doctorId = payload.doctorId || null;
    next();
  } catch {
    return res.status(401).json({ error: 'Token invalido ou expirado.' });
  }
}

module.exports = authMiddleware;
