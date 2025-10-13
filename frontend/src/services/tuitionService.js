import api from './api';

export const tuitionService = {
    searchTuition: async (studentId) => {
        try {
            const response = await api.get(`/students/${studentId}`);
            if (!response.data) {
                throw new Error('Không tìm thấy thông tin sinh viên');
            }
            return {
                studentId: response.data.studentId,
                fullName: response.data.fullName,
                tuitionAmount: response.data.tuitionAmount,
                isPaid: response.data.isPaid
            };
        } catch (error) {
            console.error('Search error:', error);
            throw new Error(error.response?.data?.detail || 'Không tìm thấy thông tin sinh viên');
        }
    },

    initiatePayment: async (studentId, amount) => {
        try {
            const response = await api.post('/transactions/initiate', {
                studentId,
                amount
            });
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.detail || 'Không thể khởi tạo giao dịch');
        }
    }
};