import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';
import { clsx } from 'clsx';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: 'bg-primary text-white hover:bg-primary-dark shadow-sm',
  secondary: 'bg-surface text-text border border-border hover:bg-surface-alt',
  ghost: 'bg-transparent text-text-muted hover:bg-surface-alt hover:text-text',
  danger: 'bg-danger text-white hover:opacity-90 shadow-sm',
};

const SIZE_CLASSES: Record<Size, string> = {
  sm: 'h-9 px-3 text-sm gap-1.5',
  md: 'h-11 px-4 text-sm gap-2',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, disabled, className, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={clsx(
          'inline-flex cursor-pointer items-center justify-center rounded-[var(--radius)] font-medium transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-60',
          VARIANT_CLASSES[variant],
          SIZE_CLASSES[size],
          className
        )}
        {...props}
      >
        {loading && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
