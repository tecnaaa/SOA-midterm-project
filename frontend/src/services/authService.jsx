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

const authService = {
    login,
    logout,
    getCurrentUser,
    isAuthenticated
};

export default authService;