from fastapi import Request
import time
import logging
from datetime import datetime

# Cấu hình logging
logging.basicConfig(
    filename='app.log',
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

async def log_middleware(request: Request, call_next):
    # Ghi nhận thời điểm bắt đầu request
    start_time = time.time()
    
    # Lấy thông tin request
    request_id = request.headers.get('X-Request-ID', '')
    method = request.method
    path = request.url.path
    client_ip = request.client.host
    
    # Log thông tin request
    logging.info(f"Request {request_id} - {method} {path} from {client_ip}")
    
    try:
        # Xử lý request
        response = await call_next(request)
        
        # Tính thời gian xử lý
        process_time = time.time() - start_time
        
        # Log thông tin response
        logging.info(
            f"Response {request_id} - Status: {response.status_code} - "
            f"Process Time: {process_time:.3f}s"
        )
        
        # Thêm custom headers
        response.headers['X-Process-Time'] = str(process_time)
        response.headers['X-Request-ID'] = request_id
        
        return response
        
    except Exception as e:
        # Log lỗi nếu có
        logging.error(
            f"Error processing request {request_id}: {str(e)}"
        )
        raise