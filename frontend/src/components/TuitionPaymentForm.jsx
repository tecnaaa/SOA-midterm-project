import React, { useState } from 'react';
import StepIndicator from './StepIndicator';
import Step1_TraCuu from './PaymentSteps/Step1_TraCuu';
import Step2_XacThucOTP from './PaymentSteps/Step2_XacThucOTP';
import Step3_KetQua from './PaymentSteps/Step3_KetQua';
import './PaymentForm.css'; // <--- LIÊN KẾT CSS

const TOTAL_STEPS = 3;

const PaymentForm = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Dữ liệu ban đầu (lấy từ API Login)
    fullName: 'Nguyễn Văn A',
    email: 'vana@example.com',
    availableBalance: 50000000,
    // Dữ liệu sẽ thu thập/cập nhật:
    studentId: '',
    feeAmount: 0,
    transactionId: '',
    otp: '',
    transactionStatus: null, // 'success' hoặc 'failed'
  });

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, TOTAL_STEPS));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));
  
  const updateFormData = (newData) => {
    setFormData(prev => ({ ...prev, ...newData }));
  };

  const renderStep = () => {
    // Truyền các hàm quản lý state xuống các component con
    const stepProps = { data: formData, updateData: updateFormData, nextStep, prevStep };
    
    switch (currentStep) {
      case 1:
        return <Step1_TraCuu {...stepProps} />;
      case 2:
        return <Step2_XacThucOTP {...stepProps} />;
      case 3:
        return <Step3_KetQua {...stepProps} />;
      default:
        return <div>Lỗi: Không tìm thấy bước</div>;
    }
  };

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
};

export default PaymentForm;