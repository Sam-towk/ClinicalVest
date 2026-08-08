const TOKEN_KEY = 'cv_token';
const USER_KEY = 'cv_user';

export type Role = 'admin' | 'medico' | 'assistente';

export interface AuthUser {
  id: string;
  tenantId: string;
  nome: string;
  email: string;
  role: Role;
  // So vem preenchido quando role === 'medico'.
  doctorId?: string | null;
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getUser(): AuthUser | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

export function setSession(token: string, user: AuthUser) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}
