const { Prisma } = require('../generated/prisma');

function errorHandler(err, req, res, next) {
  console.error(err);

  if (err instanceof Prisma.PrismaClientValidationError) {
    return res.status(400).json({ error: 'Dados invalidos para esta operacao.' });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'Ja existe um registro com esses dados.' });
    }
    if (err.code === 'P2003') {
      return res.status(400).json({ error: 'Referencia invalida (registro relacionado nao encontrado).' });
    }
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Registro nao encontrado.' });
    }
  }

  const status = err.status || 500;

  // Erros >=500 nao previstos (ex: falha do driver do Postgres) podem conter
  // detalhes internos na mensagem - so os erros de negocio (4xx, com status
  // definido explicitamente) tem a mensagem exposta ao cliente.
  const message = status < 500 ? err.message : 'Erro interno do servidor';
  res.status(status).json({ error: message });
}

module.exports = errorHandler;
