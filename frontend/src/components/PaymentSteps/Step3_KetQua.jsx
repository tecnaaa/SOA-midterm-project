import React, { useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import './Step3_KetQua.css';

const Step3_KetQua = ({ data }) => {
  const { refreshUser } = useAuth();
  const isSuccess = data.transactionStatus === 'success';

  // Refresh user data when component mounts and transaction is successful
  useEffect(() => {
    const updateUserData = async () => {
      if (isSuccess) {
        try {
          await refreshUser();
        } catch (error) {
          console.error('Failed to refresh user data:', error);
        }
      }
    };
    updateUserData();
  }, [isSuccess, refreshUser]);

  // Also refresh when page is reloaded
  useEffect(() => {
    const handleBeforeUnload = async () => {
      if (isSuccess) {
        try {
          await refreshUser();
        } catch (error) {
          console.error('Failed to refresh user data:', error);
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isSuccess, refreshUser]);

  const handleBackToHome = async () => {
    if (isSuccess) {
      try {
        await refreshUser(); // Refresh user data before returning home
      } catch (error) {
        console.error('Failed to refresh user data:', error);
      }
    }
    window.location.href = '/'; // Force page reload when returning home
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
        onClick={handleBackToHome}
        className="btn-primary"
      >
        Về Trang Chủ
      </button>
    </div>
  );
};

export default Step3_KetQua;