import { Link } from 'react-router-dom';
import { Users, CalendarClock, Ticket, Stethoscope, History, ArrowRight } from 'lucide-react';
import { useModuleRecords } from '@/hooks/useModuleRecords';
import { StatCard } from '@/components/StatCard';
import { AdminDashboard } from '@/pages/AdminDashboard';
import { getUser } from '@/lib/auth';

export default function Dashboard() {
  const user = getUser();
  const isMedico = user?.role === 'medico';
  const patients = useModuleRecords('patients');
  const scheduling = useModuleRecords('scheduling', !isMedico);
  const queue = useModuleRecords('queue', !isMedico);

  if (user?.role === 'medico') {
    return (
      <div className="flex flex-col gap-8">
        <div>
          <p className="text-sm font-medium text-primary">Clinica: {user.tenantId}</p>
          <h2 className="mt-1 font-heading text-2xl font-bold text-text sm:text-3xl">
            Bem-vindo(a), {user.nome}
          </h2>
          <p className="mt-1.5 max-w-2xl text-sm text-text-muted">
            Foque na consulta. A recepção organiza a fila.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Link
            to="/atendimento"
            className="group flex flex-col justify-between gap-4 rounded-[var(--radius-lg)] border border-border bg-surface p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg"
          >
            <div className="flex size-11 items-center justify-center rounded-[var(--radius)] bg-primary-soft text-primary">
              <Stethoscope className="size-5" />
            </div>
            <div>
              <p className="font-heading font-semibold text-text">Consulta atual</p>
              <p className="mt-1 text-sm text-text-muted">Abrir a tela de atendimento</p>
            </div>
          </Link>
          <Link
            to="/patients"
            className="group flex flex-col justify-between gap-4 rounded-[var(--radius-lg)] border border-border bg-surface p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg"
          >
            <div className="flex size-11 items-center justify-center rounded-[var(--radius)] bg-primary-soft text-primary">
              <Users className="size-5" />
            </div>
            <div>
              <p className="font-heading font-semibold text-text">Pacientes</p>
              <p className="mt-1 text-sm text-text-muted">{patients.data?.length ?? '—'} cadastrados</p>
            </div>
          </Link>
          <Link
            to="/meu-historico"
            className="group flex flex-col justify-between gap-4 rounded-[var(--radius-lg)] border border-border bg-surface p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg"
          >
            <div className="flex size-11 items-center justify-center rounded-[var(--radius)] bg-primary-soft text-primary">
              <History className="size-5" />
            </div>
            <div>
              <p className="font-heading font-semibold text-text">Meu histórico</p>
              <p className="mt-1 text-sm text-text-muted">Consultas que você finalizou</p>
            </div>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <p className="text-sm font-medium text-primary">Clinica: {user?.tenantId}</p>
        <h2 className="mt-1 font-heading text-2xl font-bold text-text sm:text-3xl">Bem-vindo(a) de volta</h2>
        <p className="mt-1.5 max-w-2xl text-sm text-text-muted">
          Pacientes, agenda e fila do dia da clínica.
        </p>
      </div>

      {user?.role === 'admin' ? (
        <AdminDashboard />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard icon={Users} label="Pacientes cadastrados" value={patients.data?.length} isLoading={patients.isLoading} />
          <StatCard icon={CalendarClock} label="Agendamentos" value={scheduling.data?.length} isLoading={scheduling.isLoading} />
          <StatCard icon={Ticket} label="Na fila digital" value={queue.data?.length} isLoading={queue.isLoading} />
        </div>
      )}

      <div>
        <h3 className="font-heading text-lg font-semibold text-text">Atalhos</h3>
        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { to: '/patients', title: 'Pacientes', desc: 'Cadastro e perfil' },
            { to: '/scheduling', title: 'Agendamentos', desc: 'Agenda e check-in' },
            { to: '/queue', title: 'Fila digital', desc: 'Ordem e encaminhar' },
          ].map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="group flex flex-col justify-between gap-4 rounded-[var(--radius-lg)] border border-border bg-surface p-5 shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg"
            >
              <div className="flex items-start justify-between">
                <p className="font-heading font-semibold text-text">{item.title}</p>
                <ArrowRight className="size-4 text-text-faint transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
              </div>
              <p className="text-sm text-text-muted">{item.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
