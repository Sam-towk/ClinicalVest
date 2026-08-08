import { useQuery } from '@tanstack/react-query';
import { Stethoscope, Hourglass, CheckCircle2 } from 'lucide-react';
import { dashboardApi } from '@/lib/api';
import { StatCard } from '@/components/StatCard';

export function AdminDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', 'admin-summary'],
    queryFn: dashboardApi.adminSummary,
    refetchInterval: 30_000,
  });

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <StatCard
        icon={Stethoscope}
        label="Médicos de plantão"
        value={data?.medicosDePlantao}
        isLoading={isLoading}
      />
      <StatCard
        icon={Hourglass}
        label="Pacientes aguardando"
        value={data?.pacientesAguardando}
        isLoading={isLoading}
      />
      <StatCard
        icon={CheckCircle2}
        label="Pacientes atendidos hoje"
        value={data?.pacientesAtendidosHoje}
        isLoading={isLoading}
      />
    </div>
  );
}
