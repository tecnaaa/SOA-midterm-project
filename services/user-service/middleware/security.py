from fastapi import FastAPI, Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from fastapi.responses import JSONResponse
import time
from typing import Dict, List, Optional
import asyncio
import logging

logging.basicConfig(
    filename='logs/security.log',
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

class SecurityMiddleware(BaseHTTPMiddleware):
    def __init__(self, app):
        super().__init__(app)
        # Chỉ giữ rate limit cho các endpoint quan trọng
        self.rate_limits = {
            "/transactions/initiate": {"window": 60, "max_requests": 3},  # 3 lần/phút cho khởi tạo giao dịch
            "/transactions/verify-otp": {"window": 60, "max_requests": 3},  # 3 lần/phút cho xác thực OTP
            "default": {"window": 60, "max_requests": 100}  # Mặc định 100 request/phút
        }
        self.ip_requests: Dict[str, Dict[str, List[float]]] = {}
        
        # Chạy task dọn dẹp IP cũ
        asyncio.create_task(self.cleanup_old_requests())
    
    async def cleanup_old_requests(self):
        while True:
            current_time = time.time()
            for ip in list(self.ip_requests.keys()):
                for endpoint in list(self.ip_requests[ip].keys()):
                    window = self.rate_limits.get(endpoint, self.rate_limits["default"])["window"]
                    self.ip_requests[ip][endpoint] = [
                        t for t in self.ip_requests[ip][endpoint] 
                        if current_time - t < window
                    ]
                    if not self.ip_requests[ip][endpoint]:
                        del self.ip_requests[ip][endpoint]
                if not self.ip_requests[ip]:
                    del self.ip_requests[ip]
            await asyncio.sleep(60)
    
    def get_endpoint_key(self, path: str) -> str:
        """Xác định endpoint key cho rate limiting"""
        for endpoint in self.rate_limits.keys():
            if endpoint in path:
                return endpoint
        return "default"
    
    async def check_rate_limit(self, ip: str, path: str) -> bool:
        endpoint_key = self.get_endpoint_key(path)
        current_time = time.time()
        
        if ip not in self.ip_requests:
            self.ip_requests[ip] = {}
        if endpoint_key not in self.ip_requests[ip]:
            self.ip_requests[ip][endpoint_key] = []
        
        # Lấy cấu hình rate limit
        limit_config = self.rate_limits.get(endpoint_key, self.rate_limits["default"])
        window = limit_config["window"]
        max_requests = limit_config["max_requests"]
        
        # Xóa các request cũ
        self.ip_requests[ip][endpoint_key] = [
            t for t in self.ip_requests[ip][endpoint_key] 
            if current_time - t < window
        ]
        
        if len(self.ip_requests[ip][endpoint_key]) >= max_requests:
            logging.warning(f"Rate limit exceeded for IP {ip} on endpoint {endpoint_key}")
            return False
        
        self.ip_requests[ip][endpoint_key].append(current_time)
        return True
    
    async def dispatch(self, request: Request, call_next):
        # Handle preflight requests
        if request.method == "OPTIONS":
            response = JSONResponse(content={})
            response.headers["Access-Control-Allow-Origin"] = "*"
            response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
            response.headers["Access-Control-Allow-Headers"] = "Authorization, Content-Type"
            response.headers["Access-Control-Max-Age"] = "3600"
            return response

        # Kiểm tra rate limit
        client_ip = request.client.host
        if not await self.check_rate_limit(client_ip, request.url.path):
            raise HTTPException(
                status_code=429, 
                detail="Too many requests. Please try again later."
            )
        
        # Thêm security headers
        response = await call_next(request)
        response.headers.update({
            "X-Content-Type-Options": "nosniff",
            "X-Frame-Options": "DENY",
            "X-XSS-Protection": "1; mode=block",
            "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "Authorization, Content-Type",
            "Content-Security-Policy": (
                "default-src 'self'; "
                "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
                "style-src 'self' 'unsafe-inline'; "
                "img-src 'self' data: https:; "
                "font-src 'self' data:;"
            )
        })
        
        return response