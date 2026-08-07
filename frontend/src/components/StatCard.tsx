import type { LucideIcon } from 'lucide-react';
import { Skeleton } from './ui/Skeleton';

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: number | undefined;
  isLoading: boolean;
}

export function StatCard({ icon: Icon, label, value, isLoading }: StatCardProps) {
  return (
    <div className="flex items-center gap-4 rounded-[var(--radius-lg)] border border-border bg-surface p-5 shadow-sm">
      <div className="flex size-11 shrink-0 items-center justify-center rounded-[var(--radius)] bg-primary-soft text-primary">
        <Icon className="size-5" aria-hidden="true" />
      </div>
      <div className="min-w-0">
        <p className="text-sm text-text-muted">{label}</p>
        {isLoading ? (
          <Skeleton className="mt-1.5 h-7 w-14" />
        ) : (
          <p className="font-heading text-2xl font-bold text-text">{value ?? 0}</p>
        )}
      </div>
    </div>
  );
}
