import React, { useState } from 'react';
import './Step1_TraCuu.css'; 
import bg from '../../assets/images/gradient.jpg';

const Step1_TraCuu = ({ data, updateData, nextStep }) => {
  const [studentIdInput, setStudentIdInput] = useState(data.studentId);
  const [isFeeLoaded, setIsFeeLoaded] = useState(data.feeAmount > 0);
  
  // Các hàm xử lý (Tra Cứu và Khởi tạo Thanh toán) giữ nguyên như trước

  const handleTraCuu = async () => {
    // 1. GỌI API: GET /tuition/{studentIdInput}
    // Giả lập dữ liệu tra cứu thành công
    const feeData = { studentName: 'Trần Thị B', feeAmount: 12500000 };

    updateData({
      studentId: studentIdInput,
      studentName: feeData.studentName,
      feeAmount: feeData.feeAmount
    });
    setIsFeeLoaded(true);
  };
  
  const handleInitiatePayment = async () => {
    // 2. GỌI API: POST /payments/initiate (để gửi OTP)
    updateData({ transactionId: 'TXN_123456789' });
    alert(`Đã gửi OTP đến email: ${data.email}. Chuyển sang bước 2.`);
    nextStep();
  };

  return (
    <div className="step1-container">
          <div className="step-content">
      <h2>1. Thông tin Người nộp tiền & Tra cứu Học phí</h2>
      
      {/* ---------------------------------------------------- */}
      {/* PHẦN 1: THÔNG TIN NGƯỜI NỘP TIỀN (READ-ONLY)         */}
      {/* ---------------------------------------------------- */}
      <div className="section-header">THÔNG TIN NGƯỜI DÙNG (CHỈ ĐỌC)</div>
      
      <div className="input-row">
        {/* Ô 1: Họ và Tên */}
        <div className="input-group half-width">
          <label>Họ và Tên</label>
          <input type="text" value={data.fullName} readOnly className="read-only" />
        </div>
        
        {/* Ô 2: Số dư Khả dụng */}
        <div className="input-group half-width">
          <label>Số dư Khả dụng</label>
          <input type="text" value={data.availableBalance.toLocaleString() + ' VND'} readOnly className="read-only balance-field" />
        </div>
      </div>
      
      <div className="input-row">
        {/* Ô 3: Email */}
        <div className="input-group full-width">
          <label>Email (Nhận OTP)</label>
          <input type="text" value={data.email} readOnly className="read-only" />
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* PHẦN 2: TRA CỨU HỌC PHÍ (INPUT & OUTPUT)              */}
      {/* ---------------------------------------------------- */}
      <div className="section-header">THÔNG TIN HỌC PHÍ</div>

      <div className="input-row lookup-row">
        {/* Ô 4: Nhập Mã số sinh viên */}
        <div className="input-group three-quarters-width">
          <label>Mã số sinh viên</label>
          <input
            type="text"
            placeholder="Nhập MSSV"
            value={studentIdInput}
            onChange={(e) => setStudentIdInput(e.target.value)}
          />
        </div>
        
        {/* Nút Tra cứu */}
        <div className="input-group quarter-width button-aligner">
          <button onClick={handleTraCuu} className="btn-secondary lookup-button" disabled={!studentIdInput}>
            Tra Cứu
          </button>
        </div>
      </div>
      
      {isFeeLoaded && (
        <>
          <div className="input-row">
            {/* Ô 5: Tên sinh viên */}
            <div className="input-group half-width">
              <label>Tên sinh viên</label>
              <input type="text" value={data.studentName} readOnly className="read-only" />
            </div>
            
            {/* Ô 6: Số tiền cần đóng */}
            <div className="input-group half-width">
              <label>Số tiền cần đóng</label>
              <input type="text" value={data.feeAmount.toLocaleString() + ' VND'} readOnly className="read-only fee-amount-field" />
            </div>
          </div>

          <button onClick={handleInitiatePayment} className="btn-primary confirm-button">
            Xác nhận Giao dịch & Gửi OTP
          </button>
        </>
      )}
    </div>
    </div>


  );
};

export default Step1_TraCuu;