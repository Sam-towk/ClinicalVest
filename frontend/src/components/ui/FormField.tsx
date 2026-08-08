import type { UseFormRegisterReturn } from 'react-hook-form';
import type { ModuleField } from '@/types/module';
import { clsx } from 'clsx';

interface FormFieldProps {
  field: ModuleField;
  register: UseFormRegisterReturn;
  error?: string;
}

const CONTROL_CLASSES =
  'w-full rounded-[var(--radius)] border bg-surface px-3.5 py-2.5 text-sm text-text placeholder:text-text-faint transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-primary';

export function FormField({ field, register, error }: FormFieldProps) {
  const inputId = `field-${field.key}`;
  const describedBy = error ? `${inputId}-error` : field.helperText ? `${inputId}-helper` : undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-sm font-medium text-text">
        {field.label}
        {field.required && <span className="ml-0.5 text-danger">*</span>}
      </label>

      {field.type === 'textarea' ? (
        <textarea
          id={inputId}
          rows={3}
          placeholder={field.placeholder}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          className={clsx(CONTROL_CLASSES, 'resize-y', error && 'border-danger focus:ring-danger/30 focus:border-danger')}
          {...register}
        />
      ) : field.type === 'select' ? (
        <select
          id={inputId}
          defaultValue=""
          aria-invalid={!!error}
          aria-describedby={describedBy}
          className={clsx(CONTROL_CLASSES, 'cursor-pointer', error && 'border-danger focus:ring-danger/30 focus:border-danger')}
          {...register}
        >
          <option value="" disabled>
            {field.placeholder ?? 'Selecione'}
          </option>
          {field.options?.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          id={inputId}
          type={field.type}
          placeholder={field.placeholder}
          autoComplete={field.type === 'password' ? 'new-password' : undefined}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          className={clsx(CONTROL_CLASSES, error && 'border-danger focus:ring-danger/30 focus:border-danger')}
          {...register}
        />
      )}

      {error ? (
        <p id={`${inputId}-error`} className="text-xs font-medium text-danger">
          {error}
        </p>
      ) : field.helperText ? (
        <p id={`${inputId}-helper`} className="text-xs text-text-muted">
          {field.helperText}
        </p>
      ) : null}
    </div>
  );
}
