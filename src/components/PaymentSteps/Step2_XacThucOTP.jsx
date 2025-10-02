import React, { useState } from 'react';
import './Step2_XacThucOTP.css';

const Step2_XacThucOTP = ({ data, updateData, nextStep, prevStep }) => {
  const [otpInput, setOtpInput] = useState('');
  
  const handleConfirmPayment = async () => {
    // 1. GỌI API: POST /payments/confirm
    // Giả lập logic kiểm tra OTP
    if (otpInput === '123456') {
      updateData({ transactionStatus: 'success' });
    } else {
      updateData({ transactionStatus: 'failed' });
    }
    
    // 2. Chuyển sang bước kết quả
    nextStep();
  };

  return (
    <div className="step-content">
      <h2>2. Xác thực OTP</h2>
      <p className="otp-info">Mã OTP đã được gửi đến email: <b>{data.email}</b>. Mã có hiệu lực trong 5 phút.</p>
      
      <div className="otp-input-area">
        <input
          type="text"
          placeholder="Nhập mã OTP (6 chữ số)"
          value={otpInput}
          onChange={(e) => setOtpInput(e.target.value)}
          maxLength="6"
          className="otp-input-field"
        />
        <p className="timer">Thời gian còn lại: 04:55</p> {/* Thêm logic timer thực tế sau */}
      </div>
      
      <button onClick={handleConfirmPayment} className="btn-primary" disabled={otpInput.length !== 6}>
        Hoàn tất Thanh toán
      </button>
      <button onClick={prevStep} className="btn-secondary">
        Quay lại
      </button>
    </div>
  );
};

export default Step2_XacThucOTP;