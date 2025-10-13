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
            const currentUser = JSON.parse(localStorage.getItem('user'));

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
                if (pendingCheck.data.isOwnTransaction) {
                    // Nếu là giao dịch của chính user hiện tại và còn hạn
                    if (!pendingCheck.data.isExpired && !pendingCheck.data.exceedAttempts) {
                        // Lấy thêm thông tin sinh viên và trạng thái giao dịch
                        const [studentData, transactionStatus] = await Promise.all([
                            api.get(`/students/${studentId}`, {
                                headers: { 'Authorization': `Bearer ${token}` }
                            }),
                            api.get(`/transactions/status/${pendingCheck.data.transactionId}`, {
                                headers: { 'Authorization': `Bearer ${token}` }
                            })
                        ]);

                        const expiryTime = new Date(transactionStatus.expiresAt);
                        const now = new Date();
                        const remainingSeconds = Math.max(0, Math.floor((expiryTime - now) / 1000));

                        return {
                            isExistingTransaction: true,
                            transactionId: pendingCheck.data.transactionId,
                            remainingTime: remainingSeconds,
                            studentId: studentData.data.studentId,
                            studentName: studentData.data.fullName,
                            feeAmount: studentData.data.tuitionAmount,
                            expiresAt: transactionStatus.expiresAt,
                            status: transactionStatus.data.status
                        };
                    }
                } else {
                    // Nếu là giao dịch của user khác
                    throw new Error('Đang có giao dịch khác với sinh viên này');
                }
            }

            // Tạo giao dịch mới nếu không có giao dịch pending hoặc giao dịch cũ đã hết hạn
            const response = await api.post('/transactions/initiate', 
                { studentId, amount },
                { headers: { 'Authorization': `Bearer ${token}` } }
            );

            return {
                ...response.data,
                isExistingTransaction: false,
                remainingTime: 300 // Chỉ set 300s cho giao dịch mới
            };
        } catch (error) {
            console.error('Payment initiation error:', error);
            throw new Error(error.response?.data?.detail || error.message || 'Không thể khởi tạo giao dịch');
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