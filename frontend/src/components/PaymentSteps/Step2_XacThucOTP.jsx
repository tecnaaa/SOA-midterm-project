import React, { useState, useEffect, useCallback } from 'react';
import './Step2_XacThucOTP.css';
import tuitionService from '../../services/tuitionService.jsx';
import Swal from 'sweetalert2';

const TIMER_DURATION = 300; // 5 phút = 300 giây

const Step2_XacThucOTP = ({ data, updateData, nextStep, prevStep }) => {
  const [otpInput, setOtpInput] = useState('');
  const [timeLeft, setTimeLeft] = useState(TIMER_DURATION);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    console.log('Step2_XacThucOTP mounted with data:', data);
    const startTime = localStorage.getItem('otpStartTime');
    if (!startTime) {
      localStorage.setItem('otpStartTime', Date.now().toString());
      console.log('Started new OTP timer');
    } else {
      const elapsed = Math.floor((Date.now() - parseInt(startTime)) / 1000);
      const remaining = Math.max(TIMER_DURATION - elapsed, 0);
      console.log('Restored OTP timer with remaining time:', remaining);
      setTimeLeft(remaining);
    }

    return () => {
      localStorage.removeItem('otpStartTime');
      console.log('Cleaned up OTP timer');
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prevTime) => {
        const newTime = prevTime <= 0 ? 0 : prevTime - 1;
        if (newTime === 0) {
          console.log('OTP timer expired');
          clearInterval(timer);
        }
        return newTime;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
      console.log('Cleared OTP timer interval');
    };
  }, []);

  const formatTime = useCallback((seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
  }, []);

  const handleConfirmPayment = async () => {
    if (isVerifying) {
      console.log('Already verifying OTP, ignoring click');
      return;
    }

    try {
      setIsVerifying(true);
      console.log('Starting OTP verification for:', {
        transactionId: data.transactionId,
        otpInput: otpInput
      });
      
      const result = await tuitionService.verifyOTP(data.transactionId, otpInput);
      console.log('OTP verification result:', result);
      
      if (result.status === 'success') {
        console.log('OTP verification successful');
        // Cập nhật số dư sau khi thanh toán thành công
        const newBalance = data.balance - data.feeAmount;
        updateData({ 
          transactionStatus: 'success',
          balance: newBalance
        });

        await Swal.fire({
          icon: 'success',
          title: 'Xác thực thành công',
          text: 'Giao dịch đã được xác nhận',
          confirmButtonText: 'Tiếp tục'
        });
        
        // Lưu số dư mới vào localStorage
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        user.balance = newBalance;
        localStorage.setItem('user', JSON.stringify(user));
        
        nextStep();
      } else {
        console.log('OTP verification returned non-success status:', result);
        throw new Error(result.message || 'Xác thực OTP thất bại');
      }
    } catch (error) {
      console.error('OTP verification error:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Lỗi xác thực',
        text: error.message,
        confirmButtonText: 'Thử lại'
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    if (value.length <= 6) {
      setOtpInput(value);
      console.log('OTP input updated:', value);
    }
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
          onChange={handleInputChange}
          maxLength="6"
          className="otp-input-field"
          disabled={timeLeft === 0 || isVerifying}
        />
        <p className={`timer ${timeLeft <= 60 ? 'timer-warning' : ''}`}>
          Thời gian còn lại: {formatTime(timeLeft)}
        </p>
      </div>
      
      <button 
        onClick={handleConfirmPayment} 
        className="btn-primary" 
        disabled={otpInput.length !== 6 || timeLeft === 0 || isVerifying}
      >
        {isVerifying ? 'Đang xác thực...' : 'Hoàn tất Thanh toán'}
      </button>
      <button onClick={prevStep} className="btn-secondary" disabled={isVerifying}>
        Quay lại
      </button>
    </div>
  );
};

export default Step2_XacThucOTP;