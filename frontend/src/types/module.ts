import type { LucideIcon } from 'lucide-react';

export type FieldType = 'text' | 'email' | 'tel' | 'textarea' | 'select' | 'datetime-local';

export interface FieldOption {
  value: string;
  label: string;
}

export interface ModuleField {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  placeholder?: string;
  helperText?: string;
  options?: FieldOption[];
  /** Coluna oculta na tabela (ainda editavel no formulario) */
  hideInTable?: boolean;
}

export interface ModuleConfig {
  slug: string;
  resource: string;
  title: string;
  singular: string;
  description: string;
  icon: LucideIcon;
  fields: ModuleField[];
  /** Campo renderizado como badge colorido na tabela (status/prioridade) */
  badgeField?: string;
  searchPlaceholder: string;
}
