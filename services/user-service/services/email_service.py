import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import time
import os
from dotenv import load_dotenv
import logging

load_dotenv()

logging.basicConfig(
    filename='logs/email.log',
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

class EmailService:
    def __init__(self):
        self.host = os.getenv('EMAIL_HOST', 'smtp.gmail.com')
        self.port = int(os.getenv('EMAIL_PORT', 587))
        self.username = os.getenv('EMAIL_HOST_USER', 'noreply@example.com')
        self.password = os.getenv('EMAIL_HOST_PASSWORD', 'default_password')
        self.use_tls = os.getenv('EMAIL_USE_TLS', 'True').lower() == 'true'
        self.timeout = int(os.getenv('EMAIL_TIMEOUT', 30))
        self.retry_count = int(os.getenv('EMAIL_RETRY_COUNT', 3))
        self.retry_delay = int(os.getenv('EMAIL_RETRY_DELAY', 5))
        self.enabled = os.getenv('EMAIL_ENABLED', 'True').lower() == 'true'

    def send_email(self, to_email: str, subject: str, body: str) -> bool:
        if not self.enabled:
            logging.warning("Email service is disabled. Would have sent email to: " + to_email)
            return True
            
        try:
            msg = MIMEMultipart()
            msg['From'] = self.username
            msg['To'] = to_email
            msg['Subject'] = subject
            msg.attach(MIMEText(body, 'plain'))

            for attempt in range(self.retry_count):
                try:
                    with smtplib.SMTP(self.host, self.port, timeout=self.timeout) as server:
                        if self.use_tls:
                            server.starttls()
                        server.login(self.username, self.password)
                        server.send_message(msg)
                        logging.info(f"Email sent successfully to {to_email}")
                        return True
                except Exception as e:
                    if attempt == self.retry_count - 1:
                        logging.error(f"Failed to send email to {to_email}: {str(e)}")
                        return False
                    time.sleep(self.retry_delay)
                    continue
                
        except Exception as e:
            logging.error(f"Error preparing email for {to_email}: {str(e)}")
            return False

    def send_otp_email(self, to_email: str, otp: str) -> bool:
        try:
            subject = "Mã OTP Xác nhận Thanh toán"
            body = f"""
            Mã OTP của bạn là: {otp}
            Mã có hiệu lực trong 5 phút.
            Không chia sẻ mã này với người khác.
            """
            return self.send_email(to_email, subject, body)
        except Exception as e:
            logging.error(f"Error sending OTP email: {str(e)}")
            return False

    def send_transaction_success_email(self, to_email: str, transaction_data: dict) -> bool:
        subject = "Xác nhận Thanh toán Thành công"
        body = f"""
        Giao dịch thanh toán học phí thành công!
        
        Chi tiết giao dịch:
        - Mã giao dịch: {transaction_data['transaction_id']}
        - MSSV: {transaction_data['student_id']}
        - Số tiền: {transaction_data['amount']:,} VND
        - Thời gian: {transaction_data['completed_at']}
        
        Cảm ơn bạn đã sử dụng dịch vụ.
        """
        return self.send_email(to_email, subject, body)

    def send_transaction_failed_email(self, to_email: str, transaction_data: dict) -> bool:
        subject = "Thông báo Giao dịch Thất bại"
        body = f"""
        Giao dịch thanh toán học phí không thành công.
        
        Chi tiết giao dịch:
        - Mã giao dịch: {transaction_data['transaction_id']}
        - MSSV: {transaction_data['student_id']}
        - Lý do: {transaction_data.get('error_message', 'Lỗi không xác định')}
        - Thời gian: {transaction_data['timestamp']}
        
        Vui lòng thử lại sau hoặc liên hệ hỗ trợ nếu cần giúp đỡ.
        """
        return self.send_email(to_email, subject, body)