// Remove o passwordHash antes de expor um User na API.
// Equivalente ao toJSON custom do model Mongoose de User.
function toPublicUser(user) {
  if (!user) return user;
  const { passwordHash, ...publicUser } = user;
  return publicUser;
}

module.exports = toPublicUser;
