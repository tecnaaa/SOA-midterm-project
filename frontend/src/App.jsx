import React, { useState } from 'react';
import StepIndicator from './components/StepIndicator.jsx';
import Step1_TraCuu from './components/PaymentSteps/Step1_TraCuu.jsx';
import Step2_XacThucOTP from './components/PaymentSteps/Step2_XacThucOTP.jsx';
import Step3_KetQua from './components/PaymentSteps/Step3_KetQua.jsx';
import Login from './components/Login.jsx'; // 🔹 import Login
import './components/TuitionPaymentForm.css';

const TOTAL_STEPS = 3;

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({});

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, TOTAL_STEPS));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));
  const updateFormData = (newData) => {
    setFormData(prev => ({ ...prev, ...newData }));
  };

  const handleLogin = (userData) => {
    setFormData(userData);   // lưu thông tin từ Login
    setIsLoggedIn(true);     // bật trạng thái đăng nhập
  };

  const renderStep = () => {
    const stepProps = { data: formData, updateData: updateFormData, nextStep, prevStep };
    switch (currentStep) {
      case 1: return <Step1_TraCuu {...stepProps} />;
      case 2: return <Step2_XacThucOTP {...stepProps} />;
      case 3: return <Step3_KetQua {...stepProps} />;
      default: return <div>Đang tải form...</div>;
    }
  };

  // 🔹 Nếu chưa login thì render Login
  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} />;
  }

  // 🔹 Nếu login rồi thì render PaymentForm
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
