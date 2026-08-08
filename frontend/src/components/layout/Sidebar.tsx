import { NavLink } from 'react-router-dom';
import { LayoutDashboard, HeartPulse, X } from 'lucide-react';
import { modules } from '@/config/modules';
import { getUser } from '@/lib/auth';
import { IconButton } from '../ui/IconButton';

const NAV_GROUPS: { label: string; slugs: string[] }[] = [
  { label: 'Atendimento', slugs: ['patients', 'medical-records', 'scheduling', 'queue'] },
  { label: 'Encaminhamentos', slugs: ['medication-referral', 'procedure-referral'] },
  { label: 'Administracao', slugs: ['doctors', 'users'] },
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
  const visibleModules = (slugs: string[]) =>
    slugs
      .map((slug) => modules.find((m) => m.slug === slug))
      .filter((mod): mod is (typeof modules)[number] => !!mod && !!role && mod.permissions.view.includes(role));

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

          {NAV_GROUPS.map((group) => {
            const groupModules = visibleModules(group.slugs);
            if (groupModules.length === 0) return null;
            return (
              <div key={group.label} className="flex flex-col gap-1">
                <p className="px-3 text-xs font-semibold uppercase tracking-wider text-white/50">{group.label}</p>
                {groupModules.map((mod) => {
                  const Icon = mod.icon;
                  return (
                    <NavLink key={mod.slug} to={`/${mod.slug}`} className={linkClasses} onClick={onClose}>
                      <Icon className="size-5 shrink-0" aria-hidden="true" />
                      {mod.title}
                    </NavLink>
                  );
                })}
              </div>
            );
          })}
        </nav>

        <div className="rounded-[var(--radius)] bg-white/10 px-3 py-3 text-xs leading-relaxed text-white/70">
          Ambiente multi-clinica. Todos os dados sao isolados por tenant.
        </div>
      </aside>
    </>
  );
}
