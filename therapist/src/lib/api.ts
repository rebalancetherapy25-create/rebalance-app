import axios from 'axios';
import { getApiBaseUrl, unwrapApiData } from './runtime';

const api = axios.create({
  baseURL: getApiBaseUrl(),
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.response.use(
  (response) => {
    response.data = unwrapApiData(response.data);
    return response;
  },
  async (error) => {
    const originalRequest = error.config as (typeof error.config & { _retry?: boolean });
    const requestUrl = String(originalRequest?.url || '');
    const isRefreshRequest = requestUrl.includes('/therapist-auth/refresh');

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry && !isRefreshRequest) {
      originalRequest._retry = true;
      try {
        await api.post('/therapist-auth/refresh');
        return api(originalRequest);
      } catch {
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
