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
            // Kiểm tra thông tin sinh viên trước
            const studentInfo = await api.get(`/students/${studentId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (studentInfo.data.isPaid) {
                throw new Error('Sinh viên đã được thanh toán học phí');
            }

            // Kiểm tra giao dịch đang pending
            const pendingCheck = await api.get(`/transactions/pending/${studentId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (pendingCheck.data.hasPending) {
                // Nếu giao dịch cũ còn hạn và chưa quá số lần thử
                if (!pendingCheck.data.isExpired && !pendingCheck.data.exceedAttempts) {
                    return {
                        transactionId: pendingCheck.data.transactionId,
                        remainingTime: pendingCheck.data.remainingTime,
                        message: 'Đang chuyển về trang xác thực OTP cũ'
                    };
                }
            }

            // Tạo giao dịch mới
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
    },

    resendOTP: async (transactionId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await api.post('/transactions/resend-otp',
                { transaction_id: transactionId },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.detail || 'Không thể gửi lại mã OTP');
        }
    },

    checkTransactionStatus: async (transactionId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await api.get(`/transactions/status/${transactionId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.detail || 'Không thể kiểm tra trạng thái giao dịch');
        }
    }
};

export default tuitionService;