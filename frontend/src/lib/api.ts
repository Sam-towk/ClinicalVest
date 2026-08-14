import { getToken, clearSession, setSession, type AuthUser } from './auth';

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export interface BaseRecord {
  id: string;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

export type ModuleRecord = BaseRecord & Record<string, string | undefined>;

async function parseResponse<T>(res: Response): Promise<T> {
  if (res.status === 204) return null as T;

  const body = await res.json().catch(() => null);

  if (!res.ok) {
    const message =
      (body && typeof body === 'object' && 'error' in body && String(body.error)) ||
      `Erro na requisicao (${res.status})`;
    throw new ApiError(message, res.status);
  }

  return body as T;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken() ?? ''}`,
      ...(options.headers ?? {}),
    },
  });

  if (res.status === 401) {
    clearSession();
    window.location.href = '/login';
    throw new ApiError('Sessao expirada. Faca login novamente.', 401);
  }

  return parseResponse<T>(res);
}

export interface AdminDashboardSummary {
  atendimentosHoje: number;
  atendimentosSemana: number;
  pacientesAtivos: number;
  taxaFalta: number;
  atendimentosPorMedico: { doctorId: string; doctorNome: string; total: number }[];
}

export interface PatientSearchHit {
  id: string;
  nome: string;
  documentoMascarado: string | null;
  dataNasc: string | null;
  ultimaConsulta: { data: string; doctorNome: string } | null;
}

export interface ConsultationCurrent {
  consultation: {
    id: string;
    patientId: string;
    doctorId: string;
    queixa: string | null;
    conduta: string | null;
    cid: string | null;
    status: string;
    iniciadaEm: string;
    finalizadaEm: string | null;
  } | null;
  context: {
    patient: {
      id: string;
      nome: string;
      documentoMascarado: string | null;
      contato: string | null;
      dataNasc: string | null;
      alergias: string | null;
      ultimaConsulta: string | null;
    } | null;
    continuousPrescriptions: {
      id: string;
      medicamento: string;
      dose: string | null;
      posologia: string | null;
      encerradaEm: string | null;
    }[];
    conditions: { cid: string; desde: string; doctorNome: string }[];
    recentConsultations: { id: string; data: string; doctorNome: string; resumo: string }[];
    attached: {
      prescriptions: { id: string; medicamento: string; dose: string | null; usoContinuo: boolean }[];
      exams: { id: string; tipo: string; status: string }[];
      certificates: { id: string; dias: number; cid: string | null }[];
      referrals: { id: string; destino: string; motivo: string | null }[];
    };
    miniQueue: { next: string[]; waitingCount: number };
  } | null;
  miniQueue: { next: string[]; waitingCount: number };
}

export interface PatientSummary {
  patient: {
    id: string;
    nome: string;
    documento?: string | null;
    documentoMascarado: string | null;
    contato: string | null;
    dataNasc: string | null;
    observacoes: string | null;
    alergias?: string | null;
  };
  continuousPrescriptions: {
    id: string;
    medicamento: string;
    dose: string | null;
    posologia: string | null;
    usoContinuo: boolean;
    encerradaEm: string | null;
  }[];
  conditions: { cid: string; desde: string; doctorNome: string }[];
  consultations: {
    id: string;
    status: string;
    iniciadaEm: string;
    finalizadaEm: string | null;
    doctorNome: string;
    doctorId: string;
    queixa?: string | null;
    conduta?: string | null;
    cid?: string | null;
  }[];
  prescriptions?: {
    id: string;
    medicamento: string;
    dose: string | null;
    posologia: string | null;
    usoContinuo: boolean;
    encerradaEm: string | null;
    iniciadaEm: string;
  }[];
  exams: {
    id: string;
    tipo: string;
    status: string;
    createdAt: string;
    justificativa?: string | null;
    resultado?: string | null;
  }[];
  documents: {
    certificates: { id: string; dias: number; cid?: string; createdAt: string; doctorNome: string }[];
    referrals: { id: string; destino: string; motivo: string | null; createdAt: string; doctorNome: string }[];
  };
}

export const api = {
  list: (resource: string) => request<ModuleRecord[]>(`/${resource}`),
  get: (resource: string, id: string) => request<ModuleRecord>(`/${resource}/${id}`),
  create: (resource: string, data: Record<string, unknown>) =>
    request<ModuleRecord>(`/${resource}`, { method: 'POST', body: JSON.stringify(data) }),
  update: (resource: string, id: string, data: Record<string, unknown>) =>
    request<ModuleRecord>(`/${resource}/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  remove: (resource: string, id: string) => request<null>(`/${resource}/${id}`, { method: 'DELETE' }),
};

export const dashboardApi = {
  adminSummary: () => request<AdminDashboardSummary>('/dashboard/admin-summary'),
};

export const patientsApi = {
  search: (q: string) => request<PatientSearchHit[]>(`/patients/search?q=${encodeURIComponent(q)}`),
  summary: (id: string) => request<PatientSummary>(`/patients/${id}/summary`),
};

export const consultationsApi = {
  current: () => request<ConsultationCurrent>('/consultations/current'),
  history: () => request<unknown[]>('/consultations/history'),
  patch: (id: string, data: Record<string, unknown>) =>
    request(`/consultations/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  pause: (id: string) => request(`/consultations/${id}/pause`, { method: 'POST' }),
  finish: (id: string) =>
    request<{ undoUntil: string; current: ConsultationCurrent }>(`/consultations/${id}/finish`, {
      method: 'POST',
    }),
  undoFinish: (id: string) => request<ConsultationCurrent>(`/consultations/${id}/undo-finish`, { method: 'POST' }),
  callNext: () => request<ConsultationCurrent>('/consultations/call-next', { method: 'POST' }),
  addPrescription: (id: string, data: Record<string, unknown>) =>
    request(`/consultations/${id}/prescriptions`, { method: 'POST', body: JSON.stringify(data) }),
  renewPrescription: (id: string, prescriptionId: string) =>
    request(`/consultations/${id}/prescriptions/${prescriptionId}/renew`, { method: 'POST' }),
  addExam: (id: string, data: Record<string, unknown>) =>
    request(`/consultations/${id}/exams`, { method: 'POST', body: JSON.stringify(data) }),
  addCertificate: (id: string, data: Record<string, unknown>) =>
    request<{ id: string; dias: number; cid: string | null; createdAt: string }>(
      `/consultations/${id}/certificates`,
      { method: 'POST', body: JSON.stringify(data) }
    ),
  addReferral: (id: string, data: Record<string, unknown>) =>
    request(`/consultations/${id}/referrals`, { method: 'POST', body: JSON.stringify(data) }),
  removeAttached: (id: string, kind: string, itemId: string) =>
    request<null>(`/consultations/${id}/${kind}/${itemId}`, { method: 'DELETE' }),
};

export interface AppointmentRecord {
  id: string;
  patientId: string;
  doctorId: string;
  data_hora: string | null;
  status: string | null;
  paciente: string;
  patientNome: string;
  doctorNome: string;
}

export const queueApi = {
  encaminhar: (id: string, doctorId: string) =>
    request(`/queue/${id}/encaminhar`, { method: 'POST', body: JSON.stringify({ doctorId }) }),
  reorder: (orderedIds: string[]) =>
    request('/queue/reorder', { method: 'POST', body: JSON.stringify({ orderedIds }) }),
};

interface AuthResponse {
  token: string;
  user: AuthUser;
}

async function authRequest(path: string, data: Record<string, unknown>): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE_URL}/auth${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const result = await parseResponse<AuthResponse>(res);
  setSession(result.token, result.user);
  return result;
}

export const authApi = {
  login: (email: string, password: string) => authRequest('/login', { email, password }),
  register: (data: { tenantId: string; nome: string; email: string; password: string }) =>
    authRequest('/register', data),
};
