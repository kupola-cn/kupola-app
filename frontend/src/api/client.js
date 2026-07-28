import axios from 'axios';

export const TOKEN_KEY = 'kupola-app-token';
export const AUTH_EXPIRED_EVENT = 'kupola:auth-expired';

function canUseStorage() {
  return typeof window !== 'undefined' && Boolean(window.localStorage);
}

export function getToken() {
  return canUseStorage() ? window.localStorage.getItem(TOKEN_KEY) : null;
}

export function setToken(token) {
  if (canUseStorage()) {
    window.localStorage.setItem(TOKEN_KEY, token);
  }
}

export function clearToken() {
  if (canUseStorage()) {
    window.localStorage.removeItem(TOKEN_KEY);
  }
}

function notifyAuthExpired() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(AUTH_EXPIRED_EVENT));
  }
}

export function getApiErrorMessage(error, fallback = '请求失败，请稍后重试。') {
  if (error?.isApiError && error.message) {
    return error.message;
  }
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message || error.message || fallback;
  }
  return error?.message || fallback;
}

function normalizeApiError(error) {
  if (!axios.isAxiosError(error)) {
    return error;
  }

  const normalized = new Error(getApiErrorMessage(error));
  normalized.name = 'ApiError';
  normalized.isApiError = true;
  normalized.status = error.response?.status || 0;
  normalized.code = error.code || '';
  normalized.details = error.response?.data || null;
  normalized.cause = error;
  return normalized;
}

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 10000,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(config => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401 && !String(error.config?.url || '').endsWith('/auth/login')) {
      clearToken();
      notifyAuthExpired();
    }
    return Promise.reject(normalizeApiError(error));
  },
);
