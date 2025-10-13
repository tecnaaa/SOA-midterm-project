import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import StepIndicator from "./StepIndicator.jsx";
import Step1_TraCuu from "./PaymentSteps/Step1_TraCuu.jsx";
import Step2_XacThucOTP from "./PaymentSteps/Step2_XacThucOTP.jsx";
import Step3_KetQua from "./PaymentSteps/Step3_KetQua.jsx";
import "./TuitionPaymentForm.css";

const TOTAL_STEPS = 3;

const PaymentForm = ({ initialData }) => {
  const { logout } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    ...initialData,
    balance: Number(initialData.balance),
    studentId: "",
    studentName: "",
    feeAmount: 0,
    transactionId: "",
    otp: "",
    transactionStatus: null,
  });

  const nextStep = () => setCurrentStep((prev) => Math.min(prev + 1, TOTAL_STEPS));
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

  const updateFormData = (newData) => {
    // Nếu có giao dịch đang tồn tại, cập nhật state và chuyển đến trang OTP
    if (newData.isExistingTransaction) {
      setFormData((prev) => ({
        ...prev,
        ...newData,
        transactionId: newData.transactionId,
        studentId: newData.studentId,
        studentName: newData.studentName,
        feeAmount: newData.feeAmount
      }));
      // Chuyển đến trang OTP
      setCurrentStep(2);
      return;
    }

    // Xử lý cập nhật dữ liệu bình thường
    setFormData((prev) => ({ ...prev, ...newData }));
  };

  // Reset form data khi quay về bước 1
  useEffect(() => {
    if (currentStep === 1) {
      setFormData((prev) => ({
        ...prev,
        studentId: "",
        studentName: "",
        feeAmount: 0,
        transactionId: "",
        otp: "",
        transactionStatus: null
      }));
    }
  }, [currentStep]);

  const stepProps = {
    data: formData,
    updateData: updateFormData,
    nextStep,
    prevStep
  };

  return (
    <>
      <div className="payment-form-header">
        <button onClick={logout} className="logout-button">
          Đăng xuất
        </button>
      </div>
      <div className="payment-form-wrapper">
        <div className="payment-form-sidebar">
          <StepIndicator currentStep={currentStep} totalSteps={TOTAL_STEPS} />
        </div>
        <div className="payment-form-content">
          {currentStep === 1 && <Step1_TraCuu {...stepProps} />}
          {currentStep === 2 && <Step2_XacThucOTP {...stepProps} />}
          {currentStep === 3 && <Step3_KetQua {...stepProps} />}
        </div>
      </div>
    </>
  );
};

export default PaymentForm;
