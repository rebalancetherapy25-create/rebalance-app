import axios from 'axios';
import { getApiBaseUrl } from './runtime';
import { attachApiClientBehavior } from '../../../shared/api';

const api = axios.create({
    baseURL: getApiBaseUrl(),
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

attachApiClientBehavior(api, '/auth/refresh');

export default api;
