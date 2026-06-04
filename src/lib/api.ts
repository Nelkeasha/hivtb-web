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

// Redirect to login on 401 (invalid/missing token) or 403 (expired token).
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (!err.response) {
      console.error('API network error — code:', err.code, 'message:', err.message);
      return Promise.reject(err);
    }

    const status = err.response?.status;
    if ((status === 401 || status === 403) && typeof window !== 'undefined') {
      Cookies.remove('access_token');
      Cookies.remove('refresh_token');
      Cookies.remove('user_role');
      Cookies.remove('user_name');
      Cookies.remove('user_id');
      window.location.href = '/login';
    }

    return Promise.reject(err);
  }
);
