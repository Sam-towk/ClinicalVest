import {
  Users,
  CalendarClock,
  Stethoscope,
  UserCog,
} from 'lucide-react';
import type { ModuleConfig } from '@/types/module';

const DOCTOR_OPTIONS_SOURCE = { resource: 'doctors', labelKey: 'nome' };
const PATIENT_OPTIONS_SOURCE = { resource: 'patients', labelKey: 'nome' };

export const modules: ModuleConfig[] = [
  {
    slug: 'patients',
    resource: 'patients',
    title: 'Pacientes',
    singular: 'paciente',
    description: 'Cadastro de pacientes. Em geral, quem chega para atendimento já entra na fila.',
    icon: Users,
    searchPlaceholder: 'Buscar por nome, documento ou contato...',
    permissions: {
      view: ['admin', 'medico', 'assistente'],
      create: ['admin', 'assistente'],
      edit: ['admin', 'assistente'],
      delete: ['admin'],
    },
    fields: [
      { key: 'nome', label: 'Nome', type: 'text', required: true, placeholder: 'Nome completo do paciente' },
      { key: 'documento', label: 'CPF', type: 'text', placeholder: '000.000.000-00' },
      { key: 'contato', label: 'Contato', type: 'tel', placeholder: '(00) 00000-0000' },
      { key: 'dataNasc', label: 'Data de nascimento', type: 'date', hideInTable: true },
      {
        key: 'adicionarNaFila',
        label: 'Adicionar à fila digital',
        type: 'select',
        required: true,
        createOnly: true,
        hideInTable: true,
        defaultValue: 'Sim',
        helperText: 'Padrão: sim — o paciente costuma ser cadastrado quando já está presente.',
        options: [
          { value: 'Sim', label: 'Sim' },
          { value: 'Não', label: 'Não' },
        ],
      },
    ],
  },
  {
    slug: 'scheduling',
    resource: 'scheduling',
    title: 'Agendamentos',
    singular: 'agendamento',
    description: 'Marcação de consultas com check-in para a fila do dia.',
    icon: CalendarClock,
    badgeField: 'status',
    searchPlaceholder: 'Buscar por paciente ou profissional...',
    permissions: {
      view: ['admin', 'assistente'],
      create: ['admin', 'assistente'],
      edit: ['admin', 'assistente'],
      delete: ['admin', 'assistente'],
    },
    fields: [
      {
        key: 'patientId',
        label: 'Paciente',
        type: 'select',
        required: true,
        optionsSource: PATIENT_OPTIONS_SOURCE,
        hideInTable: true,
      },
      { key: 'paciente', label: 'Paciente', type: 'text', hideInForm: true },
      {
        key: 'doctorId',
        label: 'Profissional',
        type: 'select',
        required: true,
        optionsSource: DOCTOR_OPTIONS_SOURCE,
        hideInTable: true,
      },
      { key: 'doctorNome', label: 'Profissional', type: 'text', hideInForm: true },
      { key: 'data_hora', label: 'Data e hora', type: 'datetime-local' },
      {
        key: 'status',
        label: 'Status',
        type: 'select',
        placeholder: 'Selecione',
        options: [
          { value: 'agendado', label: 'Agendado' },
          { value: 'confirmado', label: 'Confirmado' },
          { value: 'na_fila', label: 'Na fila' },
          { value: 'atendido', label: 'Atendido' },
          { value: 'faltou', label: 'Faltou' },
          { value: 'cancelado', label: 'Cancelado' },
        ],
      },
    ],
  },
  {
    slug: 'doctors',
    resource: 'doctors',
    title: 'Médicos',
    singular: 'médico',
    description: 'Cadastro do corpo clínico e suas especialidades.',
    icon: Stethoscope,
    searchPlaceholder: 'Buscar por nome ou especialidade...',
    permissions: {
      view: ['admin'],
      create: ['admin'],
      edit: ['admin'],
      delete: ['admin'],
    },
    fields: [
      { key: 'nome', label: 'Nome', type: 'text', required: true },
      { key: 'email', label: 'Email', type: 'email' },
      { key: 'telefone', label: 'Telefone', type: 'tel', placeholder: '(00) 00000-0000' },
      { key: 'especialidade', label: 'Especialidade', type: 'text' },
    ],
  },
  {
    slug: 'users',
    resource: 'users',
    title: 'Contas de usuário',
    singular: 'usuário',
    description: 'Contas de acesso ao sistema - quem é admin, médico ou assistente.',
    icon: UserCog,
    badgeField: 'role',
    searchPlaceholder: 'Buscar por nome ou email...',
    permissions: {
      view: ['admin'],
      create: ['admin'],
      delete: ['admin'],
    },
    fields: [
      { key: 'nome', label: 'Nome', type: 'text', required: true },
      { key: 'email', label: 'Email', type: 'email', required: true },
      { key: 'password', label: 'Senha', type: 'password', required: true, helperText: 'Mínimo 8 caracteres.', hideInTable: true },
      {
        key: 'role',
        label: 'Papel',
        type: 'select',
        required: true,
        placeholder: 'Selecione',
        options: [
          { value: 'admin', label: 'Admin' },
          { value: 'medico', label: 'Médico' },
          { value: 'assistente', label: 'Assistente' },
        ],
      },
      {
        key: 'doctorId',
        label: 'Médico vinculado',
        type: 'select',
        optionsSource: DOCTOR_OPTIONS_SOURCE,
        helperText: 'Obrigatório quando o papel é "Médico" - liga esta conta ao cadastro do corpo clínico.',
      },
    ],
  },
];

export function getModuleBySlug(slug: string | undefined): ModuleConfig | undefined {
  return modules.find((m) => m.slug === slug);
}
