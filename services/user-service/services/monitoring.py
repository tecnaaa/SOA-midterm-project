import psutil
import time
from prometheus_client import Counter, Gauge, start_http_server
import logging
from typing import Dict
import os
import asyncio
from prometheus_client import Counter, Histogram, Info, start_http_server
import time
import psutil
import logging
from datetime import datetime

class SystemMonitor:
    def __init__(self):
        # Prometheus metrics
        self.cpu_usage = Gauge('system_cpu_usage', 'System CPU usage')
        self.memory_usage = Gauge('system_memory_usage', 'System memory usage')
        self.request_count = Counter('http_requests_total', 'Total HTTP requests', ['endpoint'])
        self.rate_limit_hits = Counter('rate_limit_hits', 'Rate limit hits', ['endpoint'])
        
        # Rate limit thresholds
        self.rate_limit_thresholds = {
            'cpu_high': float(os.getenv('RATE_LIMIT_CPU_HIGH', 80.0)),
            'memory_high': float(os.getenv('RATE_LIMIT_MEMORY_HIGH', 80.0)),
            'cpu_critical': float(os.getenv('RATE_LIMIT_CPU_CRITICAL', 90.0)),
            'memory_critical': float(os.getenv('RATE_LIMIT_MEMORY_CRITICAL', 90.0))
        }
        
        # Dynamic rate limits
        self.current_limits: Dict[str, dict] = {
            'default': {
                'window': int(os.getenv('RATE_LIMIT_DEFAULT_WINDOW', 60)),
                'max_requests': int(os.getenv('RATE_LIMIT_DEFAULT_REQUESTS', 100))
            },
            '/auth/login': {
                'window': int(os.getenv('RATE_LIMIT_LOGIN_WINDOW', 300)),
                'max_requests': int(os.getenv('RATE_LIMIT_LOGIN_REQUESTS', 5))
            },
            '/transactions/initiate': {
                'window': int(os.getenv('RATE_LIMIT_TRANSACTION_WINDOW', 60)),
                'max_requests': int(os.getenv('RATE_LIMIT_TRANSACTION_REQUESTS', 3))
            }
        }
        
        # Start Prometheus HTTP server
        if os.getenv('PROMETHEUS_ENABLED', 'False').lower() == 'true':
            start_http_server(8001)
    
    def get_system_metrics(self):
        """Thu thập metrics hệ thống"""
        cpu_percent = psutil.cpu_percent()
        memory_percent = psutil.virtual_memory().percent
        
        self.cpu_usage.set(cpu_percent)
        self.memory_usage.set(memory_percent)
        
        return cpu_percent, memory_percent
    
    def adjust_rate_limits(self) -> Dict[str, dict]:
        """Điều chỉnh rate limits dựa trên tải hệ thống"""
        cpu_percent, memory_percent = self.get_system_metrics()
        adjusted_limits = self.current_limits.copy()
        
        # Điều chỉnh khi tải cao
        if cpu_percent > self.rate_limit_thresholds['cpu_critical'] or \
           memory_percent > self.rate_limit_thresholds['memory_critical']:
            # Giảm rate limit xuống 25%
            for endpoint in adjusted_limits:
                adjusted_limits[endpoint]['max_requests'] = max(
                    1,
                    int(self.current_limits[endpoint]['max_requests'] * 0.25)
                )
            logging.warning("System under critical load - reducing rate limits by 75%")
            
        elif cpu_percent > self.rate_limit_thresholds['cpu_high'] or \
             memory_percent > self.rate_limit_thresholds['memory_high']:
            # Giảm rate limit xuống 50%
            for endpoint in adjusted_limits:
                adjusted_limits[endpoint]['max_requests'] = max(
                    1,
                    int(self.current_limits[endpoint]['max_requests'] * 0.5)
                )
            logging.warning("System under high load - reducing rate limits by 50%")
            
        else:
            # Khôi phục rate limits mặc định
            adjusted_limits = self.current_limits.copy()
        
        return adjusted_limits
    
    def record_request(self, endpoint: str):
        """Ghi nhận request cho endpoint"""
        self.request_count.labels(endpoint=endpoint).inc()
    
    def record_rate_limit_hit(self, endpoint: str):
        """Ghi nhận rate limit hit"""
        self.rate_limit_hits.labels(endpoint=endpoint).inc()
        
    async def monitor_loop(self):
        """Vòng lặp monitoring chính"""
        while True:
            try:
                self.get_system_metrics()
                adjusted_limits = self.adjust_rate_limits()
                
                # Log significant changes
                for endpoint, limits in adjusted_limits.items():
                    if limits != self.current_limits[endpoint]:
                        logging.info(
                            f"Rate limit adjusted for {endpoint}: "
                            f"{self.current_limits[endpoint]} -> {limits}"
                        )
                
                self.current_limits = adjusted_limits
                
            except Exception as e:
                logging.error(f"Error in monitoring loop: {str(e)}")
            
            await asyncio.sleep(60)  # Cập nhật mỗi phút

# Initialize metrics
REQUEST_COUNT = Counter(
    'app_request_count', 
    'Application Request Count',
    ['method', 'endpoint', 'status']
)

REQUEST_LATENCY = Histogram(
    'app_request_latency_seconds',
    'Application Request Latency',
    ['method', 'endpoint']
)

FAILED_LOGIN_COUNT = Counter(
    'app_failed_login_count',
    'Failed Login Attempts Count',
    ['username']
)

TRANSACTION_COUNT = Counter(
    'app_transaction_count',
    'Transaction Count',
    ['status']
)

TRANSACTION_AMOUNT = Counter(
    'app_transaction_amount_total',
    'Total Transaction Amount',
    ['status']
)

OTP_VERIFICATION_COUNT = Counter(
    'app_otp_verification_count',
    'OTP Verification Attempts Count',
    ['status']
)

SYSTEM_INFO = Info('app_system_info', 'System Information')

def track_request(method, endpoint, status_code, duration):
    """Track request metrics"""
    REQUEST_COUNT.labels(method=method, endpoint=endpoint, status=status_code).inc()
    REQUEST_LATENCY.labels(method=method, endpoint=endpoint).observe(duration)

def track_failed_login(username):
    """Track failed login attempts"""
    FAILED_LOGIN_COUNT.labels(username=username).inc()

def track_transaction(status, amount=0):
    """Track transaction metrics"""
    TRANSACTION_COUNT.labels(status=status).inc()
    if amount > 0:
        TRANSACTION_AMOUNT.labels(status=status).inc(amount)

def track_otp_verification(status):
    """Track OTP verification attempts"""
    OTP_VERIFICATION_COUNT.labels(status=status).inc()

def update_system_info():
    """Update system information metrics"""
    try:
        cpu_percent = psutil.cpu_percent()
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage('/')
        
        SYSTEM_INFO.info({
            'cpu_usage': f"{cpu_percent}%",
            'memory_usage': f"{memory.percent}%",
            'disk_usage': f"{disk.percent}%",
            'last_updated': datetime.utcnow().isoformat()
        })
    except Exception as e:
        logging.error(f"Error updating system metrics: {str(e)}")

def setup_monitoring(port=8001):
    """Setup Prometheus metrics server"""
    try:
        start_http_server(port)
        logging.info(f"Started metrics server on port {port}")
    except Exception as e:
        logging.error(f"Failed to start metrics server: {str(e)}")
        raise