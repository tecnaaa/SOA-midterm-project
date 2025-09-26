import React, { useState } from 'react';

const Step1_TraCuu = ({ data, updateData, nextStep }) => {
  // State cục bộ cho input
  const [studentIdInput, setStudentIdInput] = useState(data.studentId);
  
  const handleTraCuu = async () => {
    // 1. GỌI API: GET /tuition/{studentIdInput}
    // const response = await fetch(`/api/tuition/${studentIdInput}`);
    // const feeData = await response.json();
    
    // Giả lập dữ liệu trả về từ API
    const feeData = { studentName: 'Trần Thị B', feeAmount: 12500000 };

    // 2. Cập nhật dữ liệu vào state chung của form
    updateData({
      studentId: studentIdInput,
      studentName: feeData.studentName,
      feeAmount: feeData.feeAmount
    });
    
    // 3. Gọi API khởi tạo giao dịch (POST /payments/initiate)
    // const initiateResponse = await fetch('/api/payments/initiate', { method: 'POST', ... });
    // const txData = await initiateResponse.json();
    
    // Giả lập:
    updateData({ transactionId: 'TXN_123456789' });
    
    // 4. Chuyển sang bước 2 (Xác thực OTP)
    nextStep();
  };

  return (
    <div className="step-1">
      <h2>Thông tin Người nộp tiền:</h2>
      {/* Hiển thị thông tin Read-only từ data.fullName, data.availableBalance */}
      <p>Số dư: {data.availableBalance.toLocaleString()} VND</p>
      
      <h2>Tra cứu học phí:</h2>
      <input
        type="text"
        placeholder="Nhập Mã số sinh viên"
        value={studentIdInput}
        onChange={(e) => setStudentIdInput(e.target.value)}
      />
      
      {data.feeAmount > 0 && (
          <p>Phí cần đóng: {data.feeAmount.toLocaleString()} VND</p>
      )}
      
      <button onClick={handleTraCuu} disabled={!studentIdInput}>
        Xác nhận Giao dịch (Gửi OTP)
      </button>
    </div>
  );
};

export default Step1_TraCuu;