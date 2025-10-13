import React, { useState, useEffect, useCallback } from 'react';
import './Step2_XacThucOTP.css';
import tuitionService from '../../services/tuitionService.jsx';
import Swal from 'sweetalert2';

const Step2_XacThucOTP = ({ data, updateData, nextStep, prevStep }) => {
  const [otpInput, setOtpInput] = useState('');
  const [timeLeft, setTimeLeft] = useState(data.remainingTime || 300);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  // Khởi tạo timer khi component mount hoặc khi transactionId thay đổi
  useEffect(() => {
    let isMounted = true;

    const initializeTimer = async () => {
      if (!data.transactionId) return;

      setIsInitializing(true);
      try {
        // Nếu đã có remainingTime từ giao dịch pending, sử dụng nó
        if (data.remainingTime) {
          setTimeLeft(Math.floor(data.remainingTime));
        } else {
          // Nếu không, kiểm tra trạng thái giao dịch
          const status = await tuitionService.checkTransactionStatus(data.transactionId);
          
          if (isMounted && status.expiresAt) {
            const expiryTime = new Date(status.expiresAt);
            const now = new Date();
            const remainingSeconds = Math.max(0, Math.floor((expiryTime - now) / 1000));
            
            if (remainingSeconds > 0) {
              setTimeLeft(remainingSeconds);
            } else {
              // Nếu đã hết hạn, tự động gửi OTP mới
              const result = await tuitionService.resendOTP(data.transactionId);
              if (isMounted) {
                setTimeLeft(Math.floor(result.expiresIn || 300));
              }
            }
          }
        }
      } catch (error) {
        console.error('Error initializing timer:', error);
        if (isMounted) {
          await Swal.fire({
            icon: 'error',
            title: 'Lỗi',
            text: 'Không thể khởi tạo bộ đếm thời gian',
            confirmButtonText: 'Đóng'
          });
        }
      } finally {
        if (isMounted) {
          setIsInitializing(false);
        }
      }
    };

    initializeTimer();

    return () => {
      isMounted = false;
    };
  }, [data.transactionId, data.remainingTime]);

  // Timer đếm ngược
  useEffect(() => {
    if (timeLeft <= 0 || isInitializing) return;

    const timer = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 0) {
          clearInterval(timer);
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, isInitializing]);

  const formatTime = useCallback((seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
  }, []);

  const handleResendOTP = async () => {
    if (isResending || timeLeft > 0) return;

    try {
      setIsResending(true);
      const result = await tuitionService.resendOTP(data.transactionId);
      
      if (result.isExisting) {
        setTimeLeft(Math.floor(result.expiresIn));
        await Swal.fire({
          icon: 'info',
          title: 'Mã OTP vẫn còn hiệu lực',
          text: result.message,
          confirmButtonText: 'Đã hiểu'
        });
      } else {
        setTimeLeft(300);
        setOtpInput('');
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
        text: error.message || 'Không thể gửi lại mã OTP',
        confirmButtonText: 'Đóng'
      });
    } finally {
      setIsResending(false);
    }
  };

  const handleConfirmPayment = async () => {
    if (isVerifying || !otpInput || timeLeft <= 0) return;

    try {
      setIsVerifying(true);
      const result = await tuitionService.verifyOTP(data.transactionId, otpInput);
      
      if (result.status === 'success') {
        updateData({ transactionStatus: 'success' });
        await Swal.fire({
          icon: 'success',
          title: 'Xác thực thành công',
          text: 'Giao dịch đã được xác nhận',
          confirmButtonText: 'Tiếp tục'
        });
        nextStep();
      } else {
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
      setOtpInput('');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    if (value.length <= 6) {
      setOtpInput(value);
    }
  };

  return (
    <div className="step-content">
      <h2>2. Xác thực OTP</h2>
      
      <p className="otp-info">
        Mã OTP đã được gửi đến email: <b>{data.email}</b>
      </p>
      
      <div className="otp-input-area">
        <input
          type="text"
          placeholder="Nhập mã OTP (6 chữ số)"
          value={otpInput}
          onChange={handleInputChange}
          maxLength="6"
          className="otp-input-field"
          disabled={timeLeft === 0 || isVerifying || isInitializing}
        />
        
        <p className={`timer ${timeLeft <= 60 ? 'timer-warning' : ''}`}>
          {isInitializing ? 'Đang tải...' : `Thời gian còn lại: ${formatTime(timeLeft)}`}
        </p>

        <button 
          onClick={handleResendOTP} 
          className="btn-secondary resend-otp-btn"
          disabled={timeLeft > 0 || isResending || isVerifying || isInitializing}
        >
          {isResending ? 'Đang gửi lại mã...' : 'Gửi lại mã OTP'}
        </button>
      </div>
      
      <div className="button-group">
        <button 
          onClick={handleConfirmPayment} 
          className="btn-primary" 
          disabled={otpInput.length !== 6 || timeLeft === 0 || isVerifying || isInitializing}
        >
          {isVerifying ? 'Đang xác thực...' : 'Hoàn tất Thanh toán'}
        </button>
        
        <button 
          onClick={prevStep} 
          className="btn-secondary"
          disabled={isVerifying || isResending || isInitializing}
        >
          Quay lại
        </button>
      </div>
    </div>
  );
};

export default Step2_XacThucOTP;