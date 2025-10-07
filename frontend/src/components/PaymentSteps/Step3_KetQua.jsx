import React from 'react';
import './Step3_KetQua.css';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';

const Step3_KetQua = ({ data, updateData, nextStep, prevStep }) => {
  const { updateUser } = useAuth();
  const isSuccess = data.transactionStatus === 'success';

  const handleBackHome = async () => {
    try {
      // Gọi API để lấy thông tin user mới nhất
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:8000/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      // Cập nhật thông tin user trong context và localStorage
      const updatedUser = response.data;
      updateUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));

      // Quay về bước 1 (form sẽ tự reset do useEffect trong TuitionPaymentForm)
      prevStep();
      prevStep();
    } catch (error) {
      console.error('Error updating user info:', error);
      // Vẫn quay về bước 1 nếu có lỗi
      prevStep();
      prevStep();
    }
  };

  return (
    <div className="step-content">
      <h2>3. Kết quả Giao dịch</h2>
      
      <div className={`result-box ${isSuccess ? 'success' : 'failed'}`}>
        <div className="result-icon">{isSuccess ? '✅' : '❌'}</div>
        <p className="result-message">
          {isSuccess 
            ? 'Giao dịch ĐÓNG HỌC PHÍ thành công!' 
            : 'Giao dịch thất bại! Vui lòng kiểm tra lại thông tin hoặc số dư.'}
        </p>
      </div>
      
      {isSuccess && (
        <div className="transaction-details">
          <p>Mã giao dịch: <b>{data.transactionId}</b></p>
          <p>Số tiền: <b>{(data.feeAmount || 0).toLocaleString()} VND</b></p>
          <p>Thời gian: {new Date().toLocaleString()}</p>
        </div>
      )}
      
      <button 
        onClick={handleBackHome}
        className="btn-primary"
      >
        Về Trang Chủ
      </button>
    </div>
  );
};

export default Step3_KetQua;