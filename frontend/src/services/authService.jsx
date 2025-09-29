// Dữ liệu giả lập (Mock Data) của người dùng sau khi đăng nhập thành công
const MOCK_USER_DATA = {
    // Thông tin người nộp tiền (Payer Info)
    fullName: 'Nguyễn Văn A',
    phoneNumber: '0912345678',
    email: 'vana@example.com', // Cần cho việc gửi OTP
    address: '123 Đường ABC',
    availableBalance: 50000000, // Số dư khả dụng
    userId: 'USER_MOCK_123',
    accessToken: 'MOCK_TOKEN_XYZ' 
};

/**
 * Hàm giả lập đăng nhập: Thay thế cho việc gọi API POST /auth/login
 */
export const mockLogin = () => {
    // Tạm thời lưu dữ liệu người dùng vào Local Storage để giả lập session
    localStorage.setItem('user', JSON.stringify(MOCK_USER_DATA));
    localStorage.setItem('token', MOCK_USER_DATA.accessToken);
    return MOCK_USER_DATA;
};

/**
 * Hàm kiểm tra xem đã "đăng nhập" chưa
 */
export const isUserLoggedIn = () => {
    return localStorage.getItem('token') !== null;
};

/**
 * Lấy dữ liệu người dùng đã giả lập
 */
export const getLoggedInUser = () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
};