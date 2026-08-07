import { Link } from 'react-router-dom';
import { Users, CalendarClock, Ticket, Share2, ArrowRight } from 'lucide-react';
import { modules } from '@/config/modules';
import { useModuleRecords } from '@/hooks/useModuleRecords';
import { StatCard } from '@/components/StatCard';
import { getUser } from '@/lib/auth';

export default function Dashboard() {
  const user = getUser();
  const patients = useModuleRecords('patients');
  const scheduling = useModuleRecords('scheduling');
  const queue = useModuleRecords('queue');
  const medicationReferrals = useModuleRecords('medication-referrals');
  const procedureReferrals = useModuleRecords('procedure-referrals');

  const pendingReferrals = (medicationReferrals.data?.length ?? 0) + (procedureReferrals.data?.length ?? 0);
  const referralsLoading = medicationReferrals.isLoading || procedureReferrals.isLoading;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <p className="text-sm font-medium text-primary">Clinica: {user?.tenantId}</p>
        <h2 className="mt-1 font-heading text-2xl font-bold text-text sm:text-3xl">Bem-vindo(a) de volta</h2>
        <p className="mt-1.5 max-w-2xl text-sm text-text-muted">
          Acompanhe pacientes, agendamentos e encaminhamentos da clinica em um so lugar.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Users} label="Pacientes cadastrados" value={patients.data?.length} isLoading={patients.isLoading} />
        <StatCard icon={CalendarClock} label="Agendamentos" value={scheduling.data?.length} isLoading={scheduling.isLoading} />
        <StatCard icon={Ticket} label="Na fila digital" value={queue.data?.length} isLoading={queue.isLoading} />
        <StatCard icon={Share2} label="Encaminhamentos" value={pendingReferrals} isLoading={referralsLoading} />
      </div>

      <div>
        <h3 className="font-heading text-lg font-semibold text-text">Modulos</h3>
        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {modules.map((mod) => {
            const Icon = mod.icon;
            return (
              <Link
                key={mod.slug}
                to={`/${mod.slug}`}
                className="group flex flex-col justify-between gap-4 rounded-[var(--radius-lg)] border border-border bg-surface p-5 shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:shadow-lg hover:border-primary/40 focus-visible:-translate-y-0.5"
              >
                <div className="flex items-start justify-between">
                  <div className="flex size-11 items-center justify-center rounded-[var(--radius)] bg-primary-soft text-primary">
                    <Icon className="size-5" aria-hidden="true" />
                  </div>
                  <ArrowRight className="size-4 text-text-faint transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-primary" aria-hidden="true" />
                </div>
                <div>
                  <p className="font-heading font-semibold text-text">{mod.title}</p>
                  <p className="mt-1 text-sm text-text-muted">{mod.description}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
