import React from 'react';
import './StepIndicator.css'; // <--- LIÊN KẾT CSS

const StepIndicator = ({ currentStep, totalSteps }) => {
  const steps = [
    "1. Tra cứu & Xác nhận TT", 
    "2. Xác thực OTP", 
    "3. Kết quả Giao dịch"
  ];
  
  return (
    <div className="step-indicator">
      {steps.map((label, index) => {
        const stepNumber = index + 1;
        const isActive = stepNumber === currentStep;
        const isCompleted = stepNumber < currentStep;

        return (
          <div 
            key={stepNumber} 
            className={`step-item ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
          >
            <div className="step-circle">
              {isCompleted ? '✓' : stepNumber}
            </div>
            <div className="step-label">{label}</div>
            {/* Đường kẻ nối giữa các bước */}
            {index < totalSteps - 1 && <div className="step-line"></div>}
          </div>
        );
      })}
    </div>
  );
};

export default StepIndicator;