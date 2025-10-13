import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8000/api',  // Add /api prefix
    withCredentials: false, // Changed to false since we're using token auth
    timeout: 10000,
    headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    }
});

api.interceptors.request.use(config => {
    // Log request details
    console.log(`Making ${config.method?.toUpperCase()} request to: ${config.url}`, {
        headers: config.headers,
        data: config.data
    });
    
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, error => {
    console.error('Request error:', error);
    return Promise.reject(error);
});

api.interceptors.response.use(
    response => {
        console.log(`Response from ${response.config.url}:`, {
            status: response.status,
            headers: response.headers,
            data: response.data
        });
        return response;
    },
    error => {
        if (error.response?.status === 401) {
            // Clear token and redirect to login
            localStorage.removeItem('token');
            window.location.href = '/';
            return Promise.reject(new Error('Phiên đăng nhập đã hết hạn'));
        }
        if (error.response) {
            // Server responded with error
            console.error('Response error:', {
                url: error.config?.url,
                status: error.response.status,
                data: error.response.data,
                headers: error.response.headers
            });
        } else if (error.request) {
            // Request made but no response
            console.error('No response received:', {
                url: error.config?.url,
                request: error.request
            });
        } else {
            // Error in request configuration
            console.error('Request configuration error:', error.message);
        }
        return Promise.reject(error);
    }
);

export default api;