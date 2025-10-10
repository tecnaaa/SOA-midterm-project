import React, { useState } from 'react';
import './Step1_TraCuu.css';
import tuitionService from '../../services/tuitionService.jsx';
import Swal from 'sweetalert2';

const Step1_TraCuu = ({ data, updateData, nextStep }) => {
  const [studentIdInput, setStudentIdInput] = useState("");
  const [isFeeLoaded, setIsFeeLoaded] = useState(false);
  
  const handleTraCuu = async () => {
    try {
      // Reset state before new search
      setIsFeeLoaded(false);
      updateData({
        studentId: "",
        studentName: "",
        feeAmount: 0,
        isPaid: false
      });

      const studentData = await tuitionService.searchTuition(studentIdInput);
      
      if (!studentData) {
        throw new Error('Không tìm thấy thông tin sinh viên');
      }

      // Update with new student data
      updateData({
        studentId: studentData.studentId,
        studentName: studentData.fullName,
        feeAmount: studentData.tuitionAmount,
        isPaid: studentData.isPaid
      });
      
      if (studentData.isPaid) {
        await Swal.fire({
          icon: "info",
          title: "Thông báo", 
          text: "Học phí của sinh viên này đã được thanh toán!",
          confirmButtonText: "OK"
        });
        return;
      }
      
      setIsFeeLoaded(true);
    } catch (error) {
      setIsFeeLoaded(false);
      await Swal.fire({
        icon: "error",
        title: "Lỗi tra cứu",
        text: error.message || "Không thể tra cứu thông tin sinh viên",
        confirmButtonText: "Đóng"
      });
    }
  };

  // Reset input when clicking search again
  const handleInputChange = (e) => {
    setStudentIdInput(e.target.value);
    setIsFeeLoaded(false);
  };
  
  const handleInitiatePayment = async () => {
    try {
      if (data.feeAmount > data.balance) {
        await Swal.fire({
          icon: "error",
          title: "Số dư không đủ",
          text: "Số dư trong tài khoản không đủ để thanh toán học phí",
          confirmButtonText: "Đóng"
        });
        return;
      }

      const result = await tuitionService.initiatePayment(data.studentId, data.feeAmount);
      updateData({ 
        transactionId: result.transactionId
      });
      nextStep();
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "Lỗi thanh toán",
        text: error.message,
        confirmButtonText: "Đóng"
      });
    }
  };

  return (
    <div className="step1-container">
      <div className="step-content">
        <h2>1. Thông tin Người nộp tiền & Tra cứu Học phí</h2>
        
        <div className="section-header">THÔNG TIN NGƯỜI DÙNG (CHỈ ĐỌC)</div>
        
        <div className="input-row">
          <div className="input-group half-width">
            <label>Họ và Tên</label>
            <input type="text" value={data.fullName} readOnly className="read-only" />
          </div>
          
          <div className="input-group half-width">
            <label>Số dư Khả dụng</label>
            <input 
              type="text" 
              value={`${(data.balance || 0).toLocaleString()} VND`}
              readOnly 
              className="read-only balance-field" 
            />
          </div>
        </div>
        
        <div className="input-row">
          <div className="input-group full-width">
            <label>Email (Nhận OTP)</label>
            <input type="text" value={data.email} readOnly className="read-only" />
          </div>
        </div>

        <div className="section-header">THÔNG TIN HỌC PHÍ</div>

        <div className="input-row lookup-row">
          <div className="input-group three-quarters-width">
            <label>Mã số sinh viên</label>
            <input
              type="text"
              placeholder="Nhập MSSV"
              value={studentIdInput}
              onChange={handleInputChange}
            />
          </div>
          
          <div className="input-group quarter-width button-aligner">
            <button onClick={handleTraCuu} className="btn-secondary lookup-button" disabled={!studentIdInput}>
              Tra Cứu
            </button>
          </div>
        </div>
        
        {isFeeLoaded && (
          <>
            <div className="input-row">
              <div className="input-group half-width">
                <label>Tên sinh viên</label>
                <input type="text" value={data.studentName} readOnly className="read-only" />
              </div>
              
              <div className="input-group half-width">
                <label>Số tiền cần đóng</label>
                <input 
                  type="text" 
                  value={`${(data.feeAmount || 0).toLocaleString()} VND`}
                  readOnly 
                  className="read-only fee-amount-field" 
                />
              </div>
            </div>

            <button 
              onClick={handleInitiatePayment} 
              className="btn-primary confirm-button"
              disabled={data.isPaid || data.feeAmount > data.balance}
            >
              Xác nhận Giao dịch & Gửi OTP
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default Step1_TraCuu;