import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  HeartPulse,
  X,
  Stethoscope,
  History,
  Users,
  CalendarClock,
  Ticket,
  UserCog,
} from 'lucide-react';
import { getUser, type Role } from '@/lib/auth';
import { IconButton } from '../ui/IconButton';
import type { LucideIcon } from 'lucide-react';

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  roles: Role[];
}

const CUSTOM_LINKS: NavItem[] = [
  { to: '/atendimento', label: 'Consulta atual', icon: Stethoscope, roles: ['medico'] },
  { to: '/patients', label: 'Pacientes', icon: Users, roles: ['medico'] },
  { to: '/meu-historico', label: 'Meu histórico', icon: History, roles: ['medico'] },
];

const NAV_GROUPS: { label: string; items: NavItem[] }[] = [
  {
    label: 'Atendimento',
    items: [
      { to: '/patients', label: 'Pacientes', icon: Users, roles: ['admin', 'assistente'] },
      { to: '/scheduling', label: 'Agenda', icon: CalendarClock, roles: ['admin', 'assistente'] },
      { to: '/queue', label: 'Fila digital', icon: Ticket, roles: ['admin', 'assistente'] },
    ],
  },
  {
    label: 'Administracao',
    items: [
      { to: '/doctors', label: 'Médicos', icon: Stethoscope, roles: ['admin'] },
      { to: '/users', label: 'Contas de usuário', icon: UserCog, roles: ['admin'] },
    ],
  },
];

const linkClasses = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-3 rounded-[var(--radius)] px-3 py-2.5 text-sm font-medium transition-colors duration-150 ${
    isActive ? 'bg-primary text-white shadow-sm' : 'text-white/80 hover:bg-white/10 hover:text-white'
  }`;

interface SidebarProps {
  mobileOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ mobileOpen, onClose }: SidebarProps) {
  const role = getUser()?.role;

  return (
    <>
      {mobileOpen && (
        <button
          aria-label="Fechar menu"
          onClick={onClose}
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[var(--sidebar-width)] flex-col gap-6 overflow-y-auto scrollbar-thin bg-primary-dark px-4 py-6 text-white transition-transform duration-200 lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-[var(--radius)] bg-white/15">
              <HeartPulse className="size-5" aria-hidden="true" />
            </div>
            <span className="font-heading text-lg font-bold tracking-tight">Clinical Vest</span>
          </div>
          <IconButton label="Fechar menu" onClick={onClose} className="text-white hover:bg-white/10 lg:hidden">
            <X className="size-5" />
          </IconButton>
        </div>

        <nav className="flex flex-1 flex-col gap-6" aria-label="Navegacao principal">
          <div className="flex flex-col gap-1">
            <NavLink to="/" end className={linkClasses} onClick={onClose}>
              <LayoutDashboard className="size-5 shrink-0" aria-hidden="true" />
              Dashboard
            </NavLink>
          </div>

          {role === 'medico' && (
            <div className="flex flex-col gap-1">
              <p className="px-3 text-xs font-semibold uppercase tracking-wider text-white/50">Médico</p>
              {CUSTOM_LINKS.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink key={item.to} to={item.to} className={linkClasses} onClick={onClose}>
                    <Icon className="size-5 shrink-0" aria-hidden="true" />
                    {item.label}
                  </NavLink>
                );
              })}
            </div>
          )}

          {role &&
            role !== 'medico' &&
            NAV_GROUPS.map((group) => {
              const items = group.items.filter((item) => item.roles.includes(role));
              if (items.length === 0) return null;
              return (
                <div key={group.label} className="flex flex-col gap-1">
                  <p className="px-3 text-xs font-semibold uppercase tracking-wider text-white/50">{group.label}</p>
                  {items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <NavLink key={item.to} to={item.to} className={linkClasses} onClick={onClose}>
                        <Icon className="size-5 shrink-0" aria-hidden="true" />
                        {item.label}
                      </NavLink>
                    );
                  })}
                </div>
              );
            })}
        </nav>

        <div className="rounded-[var(--radius)] bg-white/10 px-3 py-3 text-xs leading-relaxed text-white/70">
          Clínica pequena · atendimento centrado no paciente.
        </div>
      </aside>
    </>
  );
}
