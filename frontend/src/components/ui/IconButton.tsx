import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { clsx } from 'clsx';

type Variant = 'default' | 'danger';

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  variant?: Variant;
}

const VARIANT_CLASSES: Record<Variant, string> = {
  default: 'text-text-muted hover:bg-surface-alt hover:text-text',
  danger: 'text-text-muted hover:bg-danger-soft hover:text-danger',
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ label, variant = 'default', className, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        aria-label={label}
        title={label}
        className={clsx(
          'inline-flex size-11 cursor-pointer items-center justify-center rounded-[var(--radius-sm)] transition-colors duration-150',
          VARIANT_CLASSES[variant],
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

IconButton.displayName = 'IconButton';
