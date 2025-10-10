import React, { useState, useEffect, useCallback } from 'react';
import './Step2_XacThucOTP.css';
import tuitionService from '../../services/tuitionService.jsx';
import Swal from 'sweetalert2';

const TIMER_DURATION = 300; // 5 phút = 300 giây

const Step2_XacThucOTP = ({ data, updateData, nextStep, prevStep }) => {
  const [otpInput, setOtpInput] = useState('');
  const [timeLeft, setTimeLeft] = useState(TIMER_DURATION);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  
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

  const handleResendOTP = async () => {
    if (isResending) return;
    
    try {
      setIsResending(true);
      const result = await tuitionService.resendOTP(data.transactionId);
      
      if (result.isExisting) {
        // OTP hiện tại vẫn còn hiệu lực
        setTimeLeft(Math.floor(result.expiresIn));
        await Swal.fire({
          icon: 'info',
          title: 'Mã OTP vẫn còn hiệu lực',
          text: result.message,
          confirmButtonText: 'Đã hiểu'
        });
      } else {
        // OTP mới đã được gửi
        setTimeLeft(TIMER_DURATION);
        localStorage.setItem('otpStartTime', Date.now().toString());
        setOtpInput(''); // Clear OTP input field
        
        await Swal.fire({
          icon: 'success',
          title: 'Đã gửi lại mã OTP',
          text: result.message,
          confirmButtonText: 'Đã hiểu'
        });
      }
    } catch (error) {
      console.error('Resend OTP error:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Lỗi',
        text: error.message,
        confirmButtonText: 'Đóng'
      });
    } finally {
      setIsResending(false);
    }
  };

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
        updateData({ transactionStatus: 'success' });
        await Swal.fire({
          icon: 'success',
          title: 'Xác thực thành công',
          text: 'Giao dịch đã được xác nhận',
          confirmButtonText: 'Tiếp tục'
        });
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
        <button 
          onClick={handleResendOTP} 
          className="btn-secondary resend-otp-btn"
          disabled={timeLeft > 0 || isResending || isVerifying}
        >
          {isResending ? 'Đang gửi lại mã...' : 'Gửi lại mã OTP'}
        </button>
      </div>
      
      <button 
        onClick={handleConfirmPayment} 
        className="btn-primary" 
        disabled={otpInput.length !== 6 || timeLeft === 0 || isVerifying}
      >
        {isVerifying ? 'Đang xác thực...' : 'Hoàn tất Thanh toán'}
      </button>
      <button onClick={prevStep} className="btn-secondary" disabled={isVerifying || isResending}>
        Quay lại
      </button>
    </div>
  );
};

export default Step2_XacThucOTP;