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
    const message = (body && typeof body === 'object' && 'error' in body && String(body.error)) || `Erro na requisicao (${res.status})`;
    throw new ApiError(message, res.status);
  }

  return body as T;
}

// Requisicoes autenticadas: o tenant e identificado pelo JWT do usuario logado,
// nunca por um valor enviado pelo cliente.
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

export const api = {
  list: (resource: string) => request<ModuleRecord[]>(`/${resource}`),
  get: (resource: string, id: string) => request<ModuleRecord>(`/${resource}/${id}`),
  create: (resource: string, data: Record<string, unknown>) =>
    request<ModuleRecord>(`/${resource}`, { method: 'POST', body: JSON.stringify(data) }),
  update: (resource: string, id: string, data: Record<string, unknown>) =>
    request<ModuleRecord>(`/${resource}/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  remove: (resource: string, id: string) => request<null>(`/${resource}/${id}`, { method: 'DELETE' }),
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
