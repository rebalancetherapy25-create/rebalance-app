import { getApiBaseUrl, unwrapApiData } from './runtime';

export const CSRF_COOKIE_NAME = 'csrfToken';
export const CSRF_HEADER_NAME = 'x-csrf-token';

let csrfTokenCache: string | null = null;

const isBrowser = typeof window !== 'undefined';

export const readCookie = (name: string, cookieSource?: string | null) => {
  const source = cookieSource ?? (isBrowser ? document.cookie : '');
  if (!source) return null;

  const prefix = `${name}=`;
  const entry = source.split(';').map((part) => part.trim()).find((part) => part.startsWith(prefix));
  if (!entry) return null;

  return decodeURIComponent(entry.slice(prefix.length));
};

export const getCsrfTokenFromCookies = (cookieSource?: string | null) => readCookie(CSRF_COOKIE_NAME, cookieSource);

export const getCsrfHeaders = (cookieSource?: string | null) => {
  const token = getCsrfTokenFromCookies(cookieSource);
  return token ? { [CSRF_HEADER_NAME]: token } : {};
};

export const fetchCsrfToken = async (apiBaseUrl = getApiBaseUrl()) => {
  const response = await fetch(`${apiBaseUrl}/auth/csrf`, {
    method: 'GET',
    credentials: 'include',
    headers: {
      Accept: 'application/json',
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error('Failed to initialize CSRF token');
  }

  const payload = unwrapApiData(await response.json()) as { csrfToken?: string };
  const token = payload?.csrfToken || getCsrfTokenFromCookies();
  if (!token) {
    throw new Error('Missing CSRF token cookie');
  }

  csrfTokenCache = token;
  return token;
};

export const ensureCsrfToken = async (apiBaseUrl = getApiBaseUrl()) => {
  const cookieToken = getCsrfTokenFromCookies();
  if (cookieToken) {
    csrfTokenCache = cookieToken;
    return cookieToken;
  }

  if (!isBrowser) {
    return null;
  }

  if (csrfTokenCache) return csrfTokenCache;
  return fetchCsrfToken(apiBaseUrl);
};
