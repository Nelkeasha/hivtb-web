import Cookies from 'js-cookie';
import { api } from './api';

const COOKIE_OPTS = { expires: 7, sameSite: 'lax' as const };

export async function login(email: string, password: string) {
  const { data } = await api.post('/api/auth/login', { email, password });
  Cookies.set('access_token', data.accessToken, COOKIE_OPTS);
  Cookies.set('refresh_token', data.refreshToken, COOKIE_OPTS);
  Cookies.set('user_role', data.role, COOKIE_OPTS);
  Cookies.set('user_name', data.fullName, COOKIE_OPTS);
  Cookies.set('user_id', data.userId, COOKIE_OPTS);
  return data as {
    accessToken: string;
    refreshToken: string;
    role: string;
    fullName: string;
    userId: string;
    mustChangePassword: boolean;
  };
}

export function logout() {
  ['access_token', 'refresh_token', 'user_role', 'user_name', 'user_id'].forEach(
    (k) => Cookies.remove(k)
  );
  window.location.href = '/login';
}

export function getRole(): string | undefined {
  return Cookies.get('user_role');
}

export function getUserName(): string {
  return Cookies.get('user_name') ?? 'User';
}

export function isAuthenticated(): boolean {
  return !!Cookies.get('access_token');
}

/** Map role to home URL */
export function roleHome(role: string): string {
  switch (role) {
    case 'FACILITY_PROVIDER':
    case 'CLINICAL_STAFF':
      return '/clinical';
    case 'SUPERVISOR':
      return '/supervisor';
    case 'SYSTEM_ADMIN':
    case 'ADMIN':
      return '/admin';
    default:
      return '/login';
  }
}
