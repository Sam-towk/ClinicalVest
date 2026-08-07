import { Menu } from 'lucide-react';
import { IconButton } from '../ui/IconButton';
import { ThemeToggle } from './ThemeToggle';
import { UserMenu } from './UserMenu';

interface TopbarProps {
  title: string;
  description?: string;
  onOpenMenu: () => void;
}

export function Topbar({ title, description, onOpenMenu }: TopbarProps) {
  return (
    <header className="sticky top-0 z-20 flex h-[var(--topbar-height)] items-center gap-3 border-b border-border bg-surface/90 px-4 backdrop-blur sm:px-6">
      <IconButton label="Abrir menu" onClick={onOpenMenu} className="lg:hidden">
        <Menu className="size-5" />
      </IconButton>

      <div className="min-w-0 flex-1">
        <h1 className="truncate font-heading text-lg font-bold text-text">{title}</h1>
        {description && <p className="hidden truncate text-xs text-text-muted sm:block">{description}</p>}
      </div>

      <div className="flex items-center gap-2">
        <UserMenu />
        <ThemeToggle />
      </div>
    </header>
  );
}
