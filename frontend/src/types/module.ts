import type { LucideIcon } from 'lucide-react';
import type { Role } from '@/lib/auth';

export type FieldType = 'text' | 'email' | 'tel' | 'password' | 'textarea' | 'select' | 'date' | 'datetime-local';

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
  /** Em vez de `options` fixo, busca a lista de outro resource (ex: medicos) e usa id/label dele. */
  optionsSource?: { resource: string; labelKey: string };
  /** Coluna oculta na tabela (ainda editavel no formulario) */
  hideInTable?: boolean;
  /** Campo so existe pra exibicao (preenchido pelo backend) - nunca aparece no formulario */
  hideInForm?: boolean;
  /** Campo so no formulario de criacao (nao aparece na edicao) */
  createOnly?: boolean;
  /** Valor inicial no formulario de criacao */
  defaultValue?: string;
  /** Esconde o campo do formulario pra quem esta logado com um desses papeis */
  hideForRoles?: Role[];
}

export interface ModulePermissions {
  /** Quem pode ver o modulo/rota. Fora daqui, a rota nem aparece na sidebar. */
  view: Role[];
  create?: Role[];
  edit?: Role[];
  delete?: Role[];
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
  permissions: ModulePermissions;
}
