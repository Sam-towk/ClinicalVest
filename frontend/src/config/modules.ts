import {
  Users,
  FileText,
  CalendarClock,
  Ticket,
  Pill,
  ClipboardList,
  Stethoscope,
} from 'lucide-react';
import type { ModuleConfig } from '@/types/module';

const PRIORITY_OPTIONS = [
  { value: 'Alta', label: 'Alta' },
  { value: 'Média', label: 'Média' },
  { value: 'Baixa', label: 'Baixa' },
];

export const modules: ModuleConfig[] = [
  {
    slug: 'patients',
    resource: 'patients',
    title: 'Pacientes / Pets',
    singular: 'paciente',
    description: 'Cadastro central de pacientes humanos e animais.',
    icon: Users,
    searchPlaceholder: 'Buscar por nome, documento ou contato...',
    fields: [
      { key: 'nome', label: 'Nome', type: 'text', required: true, placeholder: 'Nome completo do paciente ou pet' },
      {
        key: 'especie',
        label: 'Espécie',
        type: 'select',
        placeholder: 'Selecione',
        options: [
          { value: 'Humano', label: 'Humano' },
          { value: 'Cão', label: 'Cão' },
          { value: 'Gato', label: 'Gato' },
          { value: 'Outro animal', label: 'Outro animal' },
        ],
      },
      { key: 'documento', label: 'CPF / Tutor', type: 'text', placeholder: 'CPF ou nome do tutor' },
      { key: 'contato', label: 'Contato', type: 'tel', placeholder: '(00) 00000-0000' },
    ],
  },
  {
    slug: 'medical-records',
    resource: 'medical-records',
    title: 'Prontuários',
    singular: 'prontuário',
    description: 'Alergias, exames solicitados, itens prescritos e classificação da doença (CID).',
    icon: FileText,
    searchPlaceholder: 'Buscar por paciente ou CID...',
    fields: [
      { key: 'paciente', label: 'Paciente', type: 'text', required: true, placeholder: 'Nome do paciente' },
      { key: 'alergias', label: 'Alergias', type: 'textarea', placeholder: 'Alergias conhecidas', helperText: 'Separe por vírgula, se houver mais de uma.' },
      { key: 'exames_solicitados', label: 'Exames solicitados', type: 'textarea' },
      { key: 'itens_prescritos', label: 'Itens prescritos', type: 'textarea' },
      { key: 'classificacao_doenca', label: 'Classificação (CID)', type: 'text', placeholder: 'Ex: J45' },
    ],
  },
  {
    slug: 'scheduling',
    resource: 'scheduling',
    title: 'Agendamentos',
    singular: 'agendamento',
    description: 'Marcação de consultas com acompanhamento de status.',
    icon: CalendarClock,
    badgeField: 'status',
    searchPlaceholder: 'Buscar por paciente ou profissional...',
    fields: [
      { key: 'paciente', label: 'Paciente', type: 'text', required: true },
      { key: 'profissional', label: 'Profissional', type: 'text' },
      { key: 'data_hora', label: 'Data e hora', type: 'text', placeholder: 'Ex: 20/08/2026 14:30' },
      {
        key: 'status',
        label: 'Status',
        type: 'select',
        placeholder: 'Selecione',
        options: [
          { value: 'Agendado', label: 'Agendado' },
          { value: 'Confirmado', label: 'Confirmado' },
          { value: 'Em andamento', label: 'Em andamento' },
          { value: 'Concluído', label: 'Concluído' },
          { value: 'Cancelado', label: 'Cancelado' },
        ],
      },
    ],
  },
  {
    slug: 'queue',
    resource: 'queue',
    title: 'Fila digital',
    singular: 'senha',
    description: 'Substitui a retirada física de senha para atendimento.',
    icon: Ticket,
    badgeField: 'status',
    searchPlaceholder: 'Buscar por paciente ou setor...',
    fields: [
      { key: 'paciente', label: 'Paciente', type: 'text', required: true },
      { key: 'setor', label: 'Setor', type: 'text', placeholder: 'Ex: Triagem, Pediatria' },
      { key: 'prioridade', label: 'Prioridade', type: 'select', placeholder: 'Selecione', options: PRIORITY_OPTIONS },
      {
        key: 'status',
        label: 'Status',
        type: 'select',
        placeholder: 'Selecione',
        options: [
          { value: 'Aguardando', label: 'Aguardando' },
          { value: 'Chamado', label: 'Chamado' },
          { value: 'Atendido', label: 'Atendido' },
        ],
      },
    ],
  },
  {
    slug: 'medication-referral',
    resource: 'medication-referrals',
    title: 'Encaminhar medicamentos',
    singular: 'encaminhamento',
    description: 'Roteamento de medicamentos por nível de prioridade.',
    icon: Pill,
    badgeField: 'nivel_prioridade',
    searchPlaceholder: 'Buscar por paciente ou medicamento...',
    fields: [
      { key: 'paciente', label: 'Paciente', type: 'text', required: true },
      { key: 'medicamento', label: 'Medicamento', type: 'text' },
      { key: 'nivel_prioridade', label: 'Nível de prioridade', type: 'select', placeholder: 'Selecione', options: PRIORITY_OPTIONS },
      { key: 'setor_destino', label: 'Setor destino', type: 'text' },
    ],
  },
  {
    slug: 'procedure-referral',
    resource: 'procedure-referrals',
    title: 'Encaminhar procedimentos',
    singular: 'encaminhamento',
    description: 'Roteamento de procedimentos por nível de prioridade.',
    icon: ClipboardList,
    badgeField: 'nivel_prioridade',
    searchPlaceholder: 'Buscar por paciente ou procedimento...',
    fields: [
      { key: 'paciente', label: 'Paciente', type: 'text', required: true },
      { key: 'procedimento', label: 'Procedimento', type: 'text' },
      { key: 'nivel_prioridade', label: 'Nível de prioridade', type: 'select', placeholder: 'Selecione', options: PRIORITY_OPTIONS },
      { key: 'setor_destino', label: 'Setor destino', type: 'text' },
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
    fields: [
      { key: 'nome', label: 'Nome', type: 'text', required: true },
      { key: 'email', label: 'Email', type: 'email' },
      { key: 'telefone', label: 'Telefone', type: 'tel', placeholder: '(00) 00000-0000' },
      { key: 'especialidade', label: 'Especialidade', type: 'text' },
    ],
  },
];

export function getModuleBySlug(slug: string | undefined): ModuleConfig | undefined {
  return modules.find((m) => m.slug === slug);
}
