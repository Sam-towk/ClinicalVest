import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { AppLayout } from '@/components/layout/AppLayout';
import { RequireAuth } from '@/components/auth/RequireAuth';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import ModulePage from '@/pages/ModulePage';
import AtendimentoPage from '@/pages/AtendimentoPage';
import PatientProfilePage from '@/pages/PatientProfilePage';
import MeuHistoricoPage from '@/pages/MeuHistoricoPage';
import QueueDayPage from '@/pages/QueueDayPage';
import SchedulingWeekPage from '@/pages/SchedulingWeekPage';
import NotFound from '@/pages/NotFound';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 15_000,
      retry: 1,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<RequireAuth />}>
            <Route element={<AppLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="atendimento" element={<AtendimentoPage />} />
              <Route path="meu-historico" element={<MeuHistoricoPage />} />
              <Route path="patients/:id" element={<PatientProfilePage />} />
              <Route path="queue" element={<QueueDayPage />} />
              <Route path="scheduling" element={<SchedulingWeekPage />} />
              <Route path=":moduleSlug" element={<ModulePage />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'var(--color-surface)',
            color: 'var(--color-text)',
            border: '1px solid var(--color-border)',
          },
        }}
      />
    </QueryClientProvider>
  );
}
