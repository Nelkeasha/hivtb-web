import axios, { type InternalAxiosRequestConfig } from 'axios';
import Cookies from 'js-cookie';

const COOKIE_OPTS = { expires: 7, sameSite: 'lax' as const };
const AUTH_COOKIE_KEYS = ['access_token', 'refresh_token', 'user_role', 'user_name', 'user_id'];

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

// One pending refresh at a time — concurrent 401s share the same promise.
let _refreshPromise: Promise<string> | null = null;

async function _doRefresh(): Promise<string> {
  const refreshToken = Cookies.get('refresh_token');
  if (!refreshToken) throw new Error('no-refresh-token');
  // Use a plain axios call (not `api`) so the refresh request never re-enters
  // this interceptor and can't trigger an infinite loop.
  const { data } = await axios.post('/api/auth/refresh-token', { refreshToken });
  Cookies.set('access_token', data.accessToken, COOKIE_OPTS);
  Cookies.set('refresh_token', data.refreshToken, COOKIE_OPTS);
  return data.accessToken as string;
}

function _refreshOnce(): Promise<string> {
  if (!_refreshPromise) {
    _refreshPromise = _doRefresh().finally(() => { _refreshPromise = null; });
  }
  return _refreshPromise;
}

function _clearSession() {
  AUTH_COOKIE_KEYS.forEach((k) => Cookies.remove(k));
  window.location.href = '/login?reason=session_expired';
}

// 401 on auth/login = wrong credentials → let the form's catch block handle it.
// 401 elsewhere     = expired token → silently refresh then retry once.
// 403               = insufficient role → never redirect; caller shows the error.
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (!err.response) {
      console.error('API network error — code:', err.code, 'message:', err.message);
      return Promise.reject(err);
    }

    const status  = err.response?.status;
    const config  = err.config as InternalAxiosRequestConfig & { _retried?: boolean };
    const isLogin = (config?.url ?? '').includes('/api/auth/login');
    const isRefresh = (config?.url ?? '').includes('/api/auth/refresh-token');

    if (status === 401 && !isLogin && !isRefresh && !config._retried && typeof window !== 'undefined') {
      config._retried = true;
      try {
        const newToken = await _refreshOnce();
        config.headers.Authorization = `Bearer ${newToken}`;
        return api(config);
      } catch {
        _clearSession();
      }
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
