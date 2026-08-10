import { Link, Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { consultationsApi } from '@/lib/api';
import { getUser } from '@/lib/auth';

export default function MeuHistoricoPage() {
  const user = getUser();
  const isMedico = user?.role === 'medico';

  const { data, isLoading } = useQuery({
    queryKey: ['consultations', 'history'],
    queryFn: consultationsApi.history,
    enabled: isMedico,
  });

  if (!isMedico) return <Navigate to="/" replace />;

  const rows = (data ?? []) as {
    id: string;
    iniciadaEm: string;
    finalizadaEm: string | null;
    queixa: string | null;
    patient: { id: string; nome: string };
  }[];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-heading text-2xl font-bold text-text">Meu histórico</h2>
        <p className="mt-1 text-sm text-text-muted">Consultas que você finalizou nesta clínica.</p>
      </div>

      {isLoading ? (
        <p className="text-sm text-text-muted">Carregando…</p>
      ) : (
        <div className="overflow-hidden rounded-[var(--radius-lg)] border border-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-alt text-xs uppercase text-text-faint">
              <tr>
                <th className="px-4 py-2.5 font-semibold">Data</th>
                <th className="px-4 py-2.5 font-semibold">Paciente</th>
                <th className="px-4 py-2.5 font-semibold">Resumo</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-border">
                  <td className="px-4 py-3">
                    {new Date(r.finalizadaEm || r.iniciadaEm).toLocaleString('pt-BR')}
                  </td>
                  <td className="px-4 py-3">
                    <Link to={`/patients/${r.patient.id}`} className="text-primary hover:underline">
                      {r.patient.nome}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-text-muted">{(r.queixa || '—').slice(0, 80)}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-text-muted">
                    Nenhuma consulta finalizada
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
