import { clsx } from 'clsx';

export function Skeleton({ className }: { className?: string }) {
  return <div className={clsx('animate-pulse rounded-[var(--radius-sm)] bg-surface-alt', className)} />;
}
