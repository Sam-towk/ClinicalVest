function errorHandler(err, req, res, next) {
  console.error(err);

  if (err.name === 'ValidationError' || err.name === 'CastError') {
    return res.status(400).json({ error: err.message });
  }

  const status = err.status || 500;

  // Erros >=500 nao previstos (ex: falha do driver do Mongo) podem conter
  // detalhes internos na mensagem - so os erros de negocio (4xx, com status
  // definido explicitamente) tem a mensagem exposta ao cliente.
  const message = status < 500 ? err.message : 'Erro interno do servidor';
  res.status(status).json({ error: message });
}

module.exports = errorHandler;
