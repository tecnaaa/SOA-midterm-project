import React from 'react';
import './Step3_KetQua.css';

const Step3_KetQua = ({ data }) => {
  const isSuccess = data.transactionStatus === 'success';

  return (
    <div className="step-content">
      <h2>3. Kết quả Giao dịch</h2>
      
      <div className={`result-box ${isSuccess ? 'success' : 'failed'}`}>
        <div className="result-icon">{isSuccess ? '✅' : '❌'}</div>
        <p className="result-message">
          {isSuccess 
            ? 'Giao dịch ĐÓNG HỌC PHÍ thành công!' 
            : 'Giao dịch thất bại! Vui lòng kiểm tra lại thông tin hoặc số dư.'}
        </p>
      </div>
      
      {isSuccess && (
        <div className="transaction-details">
          <p>Mã giao dịch: <b>{data.transactionId}</b></p>
          <p>Số tiền: <b>{data.feeAmount.toLocaleString()} VND</b></p>
          <p>Thời gian: {new Date().toLocaleString()}</p>
        </div>
      )}
      
      <button 
        onClick={() => window.location.reload()} // Tải lại để về trang chủ
        className="btn-primary"
      >
        Về Trang Chủ
      </button>
    </div>
  );
};

export default Step3_KetQua;