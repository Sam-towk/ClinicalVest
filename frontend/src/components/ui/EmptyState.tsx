import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-[var(--radius-lg)] border border-dashed border-border py-16 px-6 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-primary-soft text-primary">
        <Icon className="size-6" aria-hidden="true" />
      </div>
      <div>
        <p className="font-heading text-base font-semibold text-text">{title}</p>
        <p className="mt-1 max-w-sm text-sm text-text-muted">{description}</p>
      </div>
      {action}
    </div>
  );
}
