// Allowlist de campos escalares para writes no Prisma.
// Bloqueia nested writes (users.create, connect, etc.) e objetos-operador
// que entrariam via spread de req.body.
function pickFields(data, keys) {
  const out = {};
  if (!data || typeof data !== 'object' || Array.isArray(data)) return out;

  for (const key of keys) {
    if (!Object.prototype.hasOwnProperty.call(data, key)) continue;
    const value = data[key];
    if (value === null || typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      out[key] = value;
    }
  }
  return out;
}

if (require.main === module) {
  const got = pickFields(
    { nome: 'Ana', users: { create: {} }, tenantId: 'x', id: '1', ativo: true },
    ['nome', 'ativo']
  );
  console.assert(JSON.stringify(got) === JSON.stringify({ nome: 'Ana', ativo: true }), got);
  console.assert(Object.keys(pickFields(null, ['nome'])).length === 0);
  console.log('pickFields ok');
}

module.exports = pickFields;
