import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { getModuleBySlug } from '@/config/modules';

export function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const slug = location.pathname.replace(/^\//, '');
  const currentModule = getModuleBySlug(slug);
  const title = currentModule?.title ?? 'Dashboard';
  const description = currentModule?.description ?? 'Visao geral da clinica em tempo real.';

  return (
    <div className="min-h-screen bg-bg">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-[var(--radius)] focus:bg-primary focus:px-4 focus:py-2 focus:text-white"
      >
        Pular para o conteudo
      </a>

      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

      <div className="lg:pl-[var(--sidebar-width)]">
        <Topbar title={title} description={description} onOpenMenu={() => setMobileOpen(true)} />
        <main id="main-content" className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
