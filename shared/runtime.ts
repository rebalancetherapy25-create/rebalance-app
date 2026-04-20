const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '');

const getExplicitApiUrl = () => process.env.NEXT_PUBLIC_API_URL?.trim();

export const isLocalApiBaseUrl = (value: string) => {
  try {
    const hostname = new URL(value).hostname;
    return hostname === 'localhost' || hostname === '127.0.0.1';
  } catch {
    return false;
  }
};

export const getApiBaseUrl = () => {
  const explicit = getExplicitApiUrl();
  if (explicit) return trimTrailingSlash(explicit);

  if (process.env.NODE_ENV !== 'production') {
    return 'http://localhost:5000/api';
  }

  throw new Error(
    'Missing required environment variable: NEXT_PUBLIC_API_URL. '
      + 'Set it in your deployment or .env.local before running a production build.'
  );
};

export const unwrapApiData = <T>(payload: T | { data: T }) => {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return (payload as { data: T }).data;
  }

  return payload as T;
};
