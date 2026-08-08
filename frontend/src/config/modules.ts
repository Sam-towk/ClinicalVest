import {
  Users,
  FileText,
  CalendarClock,
  Ticket,
  Pill,
  ClipboardList,
  Stethoscope,
  UserCog,
} from 'lucide-react';
import type { ModuleConfig } from '@/types/module';

const PRIORITY_OPTIONS = [
  { value: 'Alta', label: 'Alta' },
  { value: 'Média', label: 'Média' },
  { value: 'Baixa', label: 'Baixa' },
];

const DOCTOR_OPTIONS_SOURCE = { resource: 'doctors', labelKey: 'nome' };

export const modules: ModuleConfig[] = [
  {
    slug: 'patients',
    resource: 'patients',
    title: 'Pacientes / Pets',
    singular: 'paciente',
    description: 'Cadastro central de pacientes humanos e animais.',
    icon: Users,
    searchPlaceholder: 'Buscar por nome, documento ou contato...',
    permissions: {
      view: ['admin', 'medico', 'assistente'],
      create: ['admin', 'assistente'],
      edit: ['admin', 'assistente'],
      delete: ['admin'],
    },
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
    permissions: {
      view: ['admin', 'medico', 'assistente'],
      create: ['medico'],
      edit: ['medico'],
      delete: ['admin'],
    },
    fields: [
      { key: 'paciente', label: 'Paciente', type: 'text', required: true, placeholder: 'Nome do paciente' },
      // CID e alergias sao dado clinico sensivel - o backend ja remove esses
      // campos da resposta pro assistente (medical-records.service.js), aqui
      // so evitamos mostrar uma coluna/campo que vai chegar sempre vazio.
      {
        key: 'alergias',
        label: 'Alergias',
        type: 'textarea',
        placeholder: 'Alergias conhecidas',
        helperText: 'Separe por vírgula, se houver mais de uma.',
        hideForRoles: ['assistente'],
      },
      { key: 'exames_solicitados', label: 'Exames solicitados', type: 'textarea' },
      { key: 'itens_prescritos', label: 'Itens prescritos', type: 'textarea' },
      { key: 'classificacao_doenca', label: 'Classificação (CID)', type: 'text', placeholder: 'Ex: J45', hideForRoles: ['assistente'] },
      { key: 'doctorNome', label: 'Médico responsável', type: 'text', hideInForm: true },
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
    permissions: {
      view: ['admin', 'medico', 'assistente'],
      create: ['admin', 'assistente'],
      edit: ['admin', 'assistente', 'medico'],
      delete: ['admin', 'assistente'],
    },
    fields: [
      // Medico so pode mudar o status da propria consulta (ver
      // scheduling.service.js) - os outros campos ficam ocultos pra ele no
      // formulario de edicao, ja que o backend ignora qualquer valor
      // enviado neles.
      { key: 'paciente', label: 'Paciente', type: 'text', required: true, hideForRoles: ['medico'] },
      // Antes era um campo de texto livre ("profissional"); agora referencia
      // um Doctor de verdade, entao vira um select alimentado por /api/doctors.
      { key: 'doctorId', label: 'Profissional', type: 'select', required: true, optionsSource: DOCTOR_OPTIONS_SOURCE, hideInTable: true, hideForRoles: ['medico'] },
      { key: 'doctorNome', label: 'Profissional', type: 'text', hideInForm: true },
      { key: 'data_hora', label: 'Data e hora', type: 'text', placeholder: 'Ex: 20/08/2026 14:30', hideForRoles: ['medico'] },
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
    permissions: {
      view: ['admin', 'medico', 'assistente'],
      create: ['admin', 'assistente'],
      edit: ['admin', 'assistente', 'medico'],
      delete: ['admin', 'assistente'],
    },
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
    permissions: {
      view: ['admin', 'medico', 'assistente'],
      create: ['medico', 'assistente'],
      edit: ['medico', 'assistente', 'admin'],
      delete: ['admin'],
    },
    fields: [
      { key: 'paciente', label: 'Paciente', type: 'text', required: true },
      // So aparece pro assistente: quando é o médico logado quem cria, o
      // backend usa o doctorId dele automaticamente e ignora este campo.
      {
        key: 'doctorId',
        label: 'Médico responsável',
        type: 'select',
        optionsSource: DOCTOR_OPTIONS_SOURCE,
        hideInTable: true,
        hideForRoles: ['medico'],
        helperText: 'Em nome de qual médico este encaminhamento está sendo registrado.',
      },
      { key: 'doctorNome', label: 'Médico responsável', type: 'text', hideInForm: true },
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
    permissions: {
      view: ['admin', 'medico', 'assistente'],
      create: ['medico', 'assistente'],
      edit: ['medico', 'assistente', 'admin'],
      delete: ['admin'],
    },
    fields: [
      { key: 'paciente', label: 'Paciente', type: 'text', required: true },
      {
        key: 'doctorId',
        label: 'Médico responsável',
        type: 'select',
        optionsSource: DOCTOR_OPTIONS_SOURCE,
        hideInTable: true,
        hideForRoles: ['medico'],
        helperText: 'Em nome de qual médico este encaminhamento está sendo registrado.',
      },
      { key: 'doctorNome', label: 'Médico responsável', type: 'text', hideInForm: true },
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
    badgeField: 'plantao',
    searchPlaceholder: 'Buscar por nome ou especialidade...',
    permissions: {
      view: ['admin', 'medico', 'assistente'],
      create: ['admin'],
      edit: ['admin'],
      delete: ['admin'],
    },
    fields: [
      { key: 'nome', label: 'Nome', type: 'text', required: true },
      { key: 'email', label: 'Email', type: 'email' },
      { key: 'telefone', label: 'Telefone', type: 'tel', placeholder: '(00) 00000-0000' },
      { key: 'especialidade', label: 'Especialidade', type: 'text' },
      {
        key: 'plantao',
        label: 'Plantão hoje',
        type: 'select',
        placeholder: 'Selecione',
        options: [
          { value: 'Sim', label: 'Sim' },
          { value: 'Não', label: 'Não' },
        ],
      },
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
    // So admin gerencia contas - o backend (users.routes.js) exige requireRole('admin')
    // em toda a rota, isto aqui e so pra nem mostrar o modulo pros outros papeis.
    permissions: {
      view: ['admin'],
      create: ['admin'],
      delete: ['admin'],
      // Sem 'edit': trocar role/vinculo de uma conta existente nao esta
      // implementado ainda - pra corrigir, exclua a conta e crie de novo.
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
