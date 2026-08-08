// Uso: router.post('/', requireRole('admin'), controller.create)
// Sempre depois do authMiddleware - precisa de req.userRole já preenchido.
function requireRole(...allowedRoles) {
  return function (req, res, next) {
    if (!allowedRoles.includes(req.userRole)) {
      return res.status(403).json({ error: 'Voce nao tem permissao para esta acao.' });
    }
    next();
  };
}

module.exports = requireRole;
