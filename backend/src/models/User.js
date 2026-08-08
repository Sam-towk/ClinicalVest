const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    tenantId: { type: String, required: true, index: true },
    nome: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['admin', 'medico', 'assistente'], default: 'admin' },
    // Só é preenchido quando role === 'medico'. Liga a conta de login ao
    // cadastro em Doctor, que é quem carrega especialidade/telefone/etc.
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', default: null },
  },
  { timestamps: true, collection: 'users' }
);

userSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    delete ret._id;
    delete ret.passwordHash;
  },
});

module.exports = mongoose.model('User', userSchema);
