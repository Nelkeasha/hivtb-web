import axios from 'axios';
import Cookies from 'js-cookie';

/**
 * All requests use a relative base URL so they are sent to the same origin as
 * the Next.js server. next.config.ts rewrites /api/* → backend URL, which
 * means the browser never makes a cross-origin request and CORS is not an issue.
 */
export const api = axios.create({
  baseURL: '/',
  timeout: 90_000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT from cookie on every request
api.interceptors.request.use((config) => {
  const token = Cookies.get('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// 401 on auth endpoints = wrong credentials — let the login form's catch block handle it.
// 401 on other endpoints = session expired — redirect with an explanation.
// 403 = authenticated but not permitted — never redirect; the caller shows the error.
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (!err.response) {
      console.error('API network error — code:', err.code, 'message:', err.message);
      return Promise.reject(err);
    }

    const status = err.response?.status;
    const isAuthCall = (err.config?.url ?? '').includes('/api/auth/login');

    if (status === 401 && !isAuthCall && typeof window !== 'undefined') {
      Cookies.remove('access_token');
      Cookies.remove('refresh_token');
      Cookies.remove('user_role');
      Cookies.remove('user_name');
      Cookies.remove('user_id');
      window.location.href = '/login?reason=session_expired';
    }

    return Promise.reject(err);
  }
);

/**
 * The backend's 400 responses carry a `details` map of field → message
 * (from @Valid bean validation) alongside a generic top-level `message`
 * (usually just "Validation failed"). Reading `message` alone shows that
 * generic placeholder instead of the actual reason a request was rejected.
 */
export function extractErrorMessage(err: unknown, fallback: string): string {
  const status = (err as { response?: { status?: number } })?.response?.status;
  const code   = (err as { code?: string })?.code;

  if (status === 403) return "Access denied. You don't have permission to perform this action.";
  if (status && status >= 500) return 'Server error. Please try again later.';
  if (code === 'ECONNABORTED' || code === 'ERR_CANCELED') return 'Request timed out. Please try again.';
  if (!status && (code === 'ERR_NETWORK' || code === 'ERR_CONNECTION_REFUSED')) {
    return 'Cannot reach the server. Check your connection or wait for it to start.';
  }

  const data = (err as { response?: { data?: unknown } })?.response?.data;
  if (data && typeof data === 'object') {
    const details = (data as Record<string, unknown>).details;
    if (details && typeof details === 'object') {
      const first = Object.values(details as Record<string, unknown>)[0];
      if (typeof first === 'string' && first.length > 0) return first;
    }
    const message = (data as Record<string, unknown>).message;
    if (typeof message === 'string' && message.length > 0 && message !== 'Validation failed') {
      return message;
    }
  }
  return fallback;
}

/**
 * Same `details` map `extractErrorMessage` reads, but returned whole so a
 * form can attach each message to its matching field instead of only
 * showing the first one in a generic banner.
 */
export function extractFieldErrors(err: unknown): Record<string, string> {
  const data = (err as { response?: { data?: unknown } })?.response?.data;
  if (data && typeof data === 'object') {
    const details = (data as Record<string, unknown>).details;
    if (details && typeof details === 'object') {
      return details as Record<string, string>;
    }
  }
  return {};
}
