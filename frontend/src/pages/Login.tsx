import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { HeartPulse } from 'lucide-react';
import { toast } from 'sonner';
import { authApi } from '@/lib/api';
import { ApiError } from '@/lib/api';
import { Button } from '@/components/ui/Button';

const CONTROL_CLASSES =
  'w-full rounded-[var(--radius)] border border-border bg-surface px-3.5 py-2.5 text-sm text-text placeholder:text-text-faint transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-primary';

export default function Login() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);

  const [tenantId, setTenantId] = useState('');
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'login') {
        await authApi.login(email, password);
      } else {
        await authApi.register({ tenantId: tenantId.trim(), nome: nome.trim(), email, password });
      }
      navigate('/', { replace: true });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Nao foi possivel autenticar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4">
      <div className="w-full max-w-sm rounded-[var(--radius-lg)] border border-border bg-surface p-6 shadow-sm sm:p-8">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <div className="flex size-11 items-center justify-center rounded-[var(--radius)] bg-primary text-white">
            <HeartPulse className="size-6" aria-hidden="true" />
          </div>
          <h1 className="font-heading text-xl font-bold text-text">Clinical Vest</h1>
          <p className="text-sm text-text-muted">
            {mode === 'login' ? 'Entre com sua conta da clinica.' : 'Crie a conta da sua clinica.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {mode === 'register' && (
            <>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="tenantId" className="text-sm font-medium text-text">
                  Identificador da clinica
                </label>
                <input
                  id="tenantId"
                  value={tenantId}
                  onChange={(e) => setTenantId(e.target.value)}
                  placeholder="minha-clinica"
                  required
                  className={CONTROL_CLASSES}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="nome" className="text-sm font-medium text-text">
                  Seu nome
                </label>
                <input
                  id="nome"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  required
                  className={CONTROL_CLASSES}
                />
              </div>
            </>
          )}

          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-sm font-medium text-text">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={CONTROL_CLASSES}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-sm font-medium text-text">
              Senha
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              required
              className={CONTROL_CLASSES}
            />
          </div>

          <Button type="submit" loading={loading} className="mt-1 w-full">
            {mode === 'login' ? 'Entrar' : 'Criar conta'}
          </Button>
        </form>

        <button
          type="button"
          onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
          className="mt-4 w-full cursor-pointer text-center text-sm text-primary hover:underline"
        >
          {mode === 'login' ? 'Ainda nao tem conta? Cadastre sua clinica' : 'Ja tem conta? Entrar'}
        </button>
      </div>
    </div>
  );
}
