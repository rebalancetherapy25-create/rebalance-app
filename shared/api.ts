import { CSRF_HEADER_NAME, ensureCsrfToken } from './auth';
import { unwrapApiData } from './runtime';

type ApiClient = {
  (config: any): Promise<any>;
  interceptors: {
    request: {
      use: (fulfilled: (config: any) => any | Promise<any>) => void;
    };
    response: {
      use: (fulfilled: (response: any) => any, rejected: (error: any) => any) => void;
    };
  };
  post: (url: string, body?: any) => Promise<any>;
};

const SAFE_METHODS = new Set(['get', 'head', 'options']);

const isSafeMethod = (method?: string) => SAFE_METHODS.has(String(method || 'get').toLowerCase());

export const attachApiClientBehavior = (api: ApiClient, refreshPath: string) => {
  api.interceptors.request.use(async (config) => {
    if (!isSafeMethod(config.method)) {
      const csrfToken = await ensureCsrfToken();
      if (csrfToken) {
        config.headers = config.headers ?? {};
        config.headers[CSRF_HEADER_NAME] = csrfToken;
      }
    }
    return config;
  });

  api.interceptors.response.use(
    (response) => {
      response.data = unwrapApiData(response.data);
      return response;
    },
    async (error) => {
        const originalRequest = error.config as { url?: string; _retry?: boolean };
      const requestUrl = String(originalRequest?.url || '');
      const isRefreshRequest = requestUrl.includes(refreshPath);

        if (error.response?.status === 401 && originalRequest && !originalRequest._retry && !isRefreshRequest) {
          originalRequest._retry = true;
          try {
            await api.post(refreshPath);
            return api(originalRequest);
          } catch {
            return Promise.reject(error);
          }
        }

      return Promise.reject(error);
    }
  );

  return api;
};
