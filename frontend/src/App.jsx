import React, { useState, useEffect } from 'react';
import StepIndicator from './components/StepIndicator';
import Step1_TraCuu from './components/PaymentSteps/Step1_TraCuu';
import Step2_XacThucOTP from './components/PaymentSteps/Step2_XacThucOTP';
import Step3_KetQua from './components/PaymentSteps/Step3_KetQua';
import { mockLogin } from './services/authService.jsx'; // Nhập hàm giả lập
import './components/TuitionPaymentForm.css'; // Import CSS khung chính

const TOTAL_STEPS = 3;

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({});

  // 1. Logic Đăng nhập đơn giản nhất
  useEffect(() => {
    // Tự động gọi hàm giả lập đăng nhập khi component được mount lần đầu
    const userData = mockLogin();
    setFormData(userData); // Lưu thông tin người dùng vào formData
    setIsLoggedIn(true);
    // Lưu ý: Trong thực tế, bạn sẽ gọi API POST /auth/login ở đây.
  }, []);

  // 2. Hàm quản lý luồng form
  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, TOTAL_STEPS));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));
  
  const updateFormData = (newData) => {
    setFormData(prev => ({ ...prev, ...newData }));
  };

  // 3. Hàm hiển thị bước form
  const renderStep = () => {
    const stepProps = { data: formData, updateData: updateFormData, nextStep, prevStep };
    
    switch (currentStep) {
      case 1:
        return <Step1_TraCuu {...stepProps} />;
      case 2:
        return <Step2_XacThucOTP {...stepProps} />;
      case 3:
        return <Step3_KetQua {...stepProps} />;
      default:
        return <div>Đang tải form...</div>;
    }
  };

  if (!isLoggedIn) {
    // Màn hình loading hoặc login giả lập
    return <h1>Đang đăng nhập giả lập...</h1>; 
  }

  // 4. Giao diện chính (Khung form)
  return (
    <div className="payment-form-wrapper">
      <div className="payment-form-sidebar">
        <StepIndicator currentStep={currentStep} totalSteps={TOTAL_STEPS} />
      </div>
      <div className="payment-form-content">
        {renderStep()}
      </div>
    </div>
  );
}

export default App;