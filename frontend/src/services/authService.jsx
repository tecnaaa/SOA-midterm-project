import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

export const login = async (username, password) => {
    try {
        // Tạo form data để gửi request
        const formData = new URLSearchParams();
        formData.append('username', username);
        formData.append('password', password);

        const response = await axios.post(`${API_URL}/auth/login`, formData, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        if (response.data.access_token) {
            // Lưu token và thông tin user
            localStorage.setItem('token', response.data.access_token);
            localStorage.setItem('user', JSON.stringify(response.data.user));
            return response.data.user;
        }
        throw new Error('Không nhận được token từ server');
    } catch (error) {
        console.error('Login error:', error.response?.data || error.message);
        throw new Error(error.response?.data?.detail || 'Đăng nhập thất bại');
    }
};

export const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
};

export const getCurrentUser = () => {
    return JSON.parse(localStorage.getItem('user'));
};

export const isAuthenticated = () => {
    const token = localStorage.getItem('token');
    return !!token;
};

export const refreshUserInfo = async () => {
    try {
        const token = localStorage.getItem('token');
        if (!token) return null;

        const response = await axios.get(`${API_URL}/auth/me`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.data) {
            localStorage.setItem('user', JSON.stringify(response.data));
            return response.data;
        }
        return null;
    } catch (error) {
        console.error('Refresh user info error:', error);
        return null;
    }
};

const authService = {
    login,
    logout,
    getCurrentUser,
    isAuthenticated,
    refreshUserInfo
};

export default authService;