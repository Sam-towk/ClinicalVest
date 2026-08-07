import { useNavigate } from 'react-router-dom';
import { LogOut, User as UserIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { clearSession, getUser } from '@/lib/auth';
import { IconButton } from '../ui/IconButton';

export function UserMenu() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = getUser();

  function handleLogout() {
    clearSession();
    queryClient.clear();
    toast.success('Sessao encerrada.');
    navigate('/login', { replace: true });
  }

  return (
    <div className="flex items-center gap-2 rounded-[var(--radius)] border border-border bg-surface px-3 py-2 text-sm font-medium text-text">
      <UserIcon className="size-4 text-primary" aria-hidden="true" />
      <span className="hidden max-w-[160px] truncate sm:inline" title={user?.email}>
        {user?.nome ?? 'Usuario'}
      </span>
      <IconButton label="Sair" onClick={handleLogout} className="ml-1 -mr-1">
        <LogOut className="size-4" />
      </IconButton>
    </div>
  );
}
