import axios from 'axios';

const getBaseUrl = () => {
    if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
    if (typeof window !== 'undefined') {
        const hostname = window.location.hostname;
        return `http://${hostname}:5000/api`;
    }
    return 'http://localhost:5000/api';
};

const api = axios.create({
    baseURL: getBaseUrl(),
    withCredentials: true, // Important for cookies/JWT
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config as (typeof error.config & { _retry?: boolean });
        const requestUrl = String(originalRequest?.url || '');
        const isRefreshRequest = requestUrl.includes('/auth/refresh');

        if (error.response?.status === 401 && originalRequest && !originalRequest._retry && !isRefreshRequest) {
            originalRequest._retry = true;
            try {
                await api.post('/auth/refresh');
                return api(originalRequest);
            } catch {
                return Promise.reject(error);
            }
        }
        return Promise.reject(error);
    }
);

export default api;
