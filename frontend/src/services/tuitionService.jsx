import api from './api';

export const tuitionService = {
    searchTuition: async (studentId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await api.get(`/students/${studentId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
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
            const token = localStorage.getItem('token');
            const response = await api.post('/transactions/initiate', 
                {
                    studentId,
                    amount
                },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.detail || 'Không thể khởi tạo giao dịch');
        }
    },

    verifyOTP: async (transactionId, otpCode) => {
        try {
            console.log('Verifying OTP:', { transactionId, otpCode });
            const token = localStorage.getItem('token');
            const response = await api.post('/transactions/verify-otp',
                {
                    transaction_id: transactionId,
                    otp_code: otpCode
                },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );
            console.log('OTP verification response:', response.data);
            
            // Chuẩn hóa response
            if (response.status === 200) {
                return {
                    status: 'success',
                    message: 'Thanh toán đã hoàn tất'
                };
            }
            return response.data;
        } catch (error) {
            console.error('OTP verification error:', {
                error: error,
                response: error.response?.data,
                status: error.response?.status
            });
            throw new Error(error.response?.data?.detail || 'Xác thực OTP thất bại');
        }
    },

    getTransactionHistory: async (page = 1, limit = 10) => {
        try {
            const token = localStorage.getItem('token');
            const skip = (page - 1) * limit;
            const response = await api.get(`/transactions/history?skip=${skip}&limit=${limit}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.detail || 'Không thể lấy lịch sử giao dịch');
        }
    }
};

export default tuitionService;