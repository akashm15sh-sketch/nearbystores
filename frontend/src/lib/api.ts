import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add token to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Handle errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Don't auto-redirect on auth/support endpoints — let the page handle its own errors
            const requestUrl = error.config?.url || '';
            const skipRedirect = requestUrl.includes('/auth/') || requestUrl.includes('/support') || requestUrl.includes('/admin/login');
            if (!skipRedirect) {
                localStorage.removeItem('token');
                localStorage.removeItem('auth-storage');
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;
