import { useQuery } from '@tanstack/react-query';
import { CalendarCheck, Users, UserX, Activity } from 'lucide-react';
import { dashboardApi } from '@/lib/api';
import { StatCard } from '@/components/StatCard';

export function AdminDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', 'admin-summary'],
    queryFn: dashboardApi.adminSummary,
    refetchInterval: 30_000,
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={CalendarCheck}
          label="Atendimentos hoje"
          value={data?.atendimentosHoje}
          isLoading={isLoading}
        />
        <StatCard
          icon={Activity}
          label="Atendimentos na semana"
          value={data?.atendimentosSemana}
          isLoading={isLoading}
        />
        <StatCard
          icon={Users}
          label="Pacientes ativos (12 meses)"
          value={data?.pacientesAtivos}
          isLoading={isLoading}
        />
        <StatCard
          icon={UserX}
          label="Taxa de falta (semana)"
          value={data ? `${data.taxaFalta}%` : undefined}
          isLoading={isLoading}
        />
      </div>

      {(data?.atendimentosPorMedico?.length ?? 0) > 0 && (
        <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-text-faint">
            Atendimentos por médico (semana)
          </p>
          <ul className="flex flex-col gap-2 text-sm">
            {data!.atendimentosPorMedico.map((row) => (
              <li key={row.doctorId} className="flex justify-between border-b border-border py-1.5 last:border-0">
                <span className="text-text">{row.doctorNome}</span>
                <span className="font-medium text-text">{row.total}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
