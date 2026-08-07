// Aplica um toJSON consistente a todos os models: expoe "id" (string) em vez
// de "_id"/"__v", para o frontend nao precisar conhecer detalhes do Mongo.
function toJSON(schema) {
  schema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: (_doc, ret) => {
      delete ret._id;
    },
  });
}

module.exports = toJSON;
