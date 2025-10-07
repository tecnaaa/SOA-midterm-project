from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.utils import get_openapi
from routes import auth, students, transactions
from db import client
from datetime import datetime
from middleware import SecurityMiddleware, log_middleware
from services.monitoring import setup_monitoring
import os
import asyncio
from services.monitoring import SystemMonitor
import logging
from fastapi_limiter import FastAPILimiter
from redis.asyncio import Redis

# Configure logging
log_dir = os.path.join(os.path.dirname(__file__), 'logs')
os.makedirs(log_dir, exist_ok=True)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(os.path.join(log_dir, 'api.log')),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Tuition Payment API",
    description="""
    API hệ thống thanh toán học phí trực tuyến.
    
    ## Tính năng
    
    * Đăng nhập và xác thực người dùng
    * Tra cứu thông tin học phí theo MSSV
    * Thanh toán học phí với xác thực OTP qua email
    * Xử lý giao dịch an toàn và tránh trùng lặp
    * Gửi email xác nhận giao dịch
    
    ## Xác thực
    
    Tất cả các API (ngoại trừ /api/auth/login) đều yêu cầu JWT token trong header:
    ```
    Authorization: Bearer {token}
    ```
    """,
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema

    openapi_schema = get_openapi(
        title=app.title,
        version=app.version,
        description=app.description,
        routes=app.routes,
    )

    # Thêm các security schemes
    openapi_schema["components"]["securitySchemes"] = {
        "Bearer": {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT",
            "description": "Enter JWT token"
        }
    }

    app.openapi_schema = openapi_schema
    return app.openapi_schema

app.openapi = custom_openapi

# Thêm SecurityMiddleware
app.add_middleware(SecurityMiddleware)

# Cấu hình CORS - cập nhật để cho phép localhost frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost", "http://localhost:80"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Thêm middleware logging
app.middleware("http")(log_middleware)

# Initialize system monitor
system_monitor = SystemMonitor()

@app.on_event("startup")
async def startup_event():
    try:
        # Metrics server sẽ chạy trên port khác với API server
        metrics_port = int(os.getenv('METRICS_PORT', 8001))
        setup_monitoring(metrics_port)
        logger.info(f"Started metrics server on port {metrics_port}")
        
        # Start system monitoring
        asyncio.create_task(system_monitor.monitor_loop())
        logger.info("Started system monitoring")

        # Initialize rate limiter
        redis = Redis(host='tuition-payment-redis', port=6379, decode_responses=True)
        await FastAPILimiter.init(redis)
        logger.info("Initialized rate limiter")
    except Exception as e:
        logger.error(f"Error during startup: {str(e)}")
        raise

@app.on_event("shutdown")
async def shutdown_event():
    try:
        # Close MongoDB connection
        client.close()
        logger.info("Closed MongoDB connection")
    except Exception as e:
        logger.error(f"Error during shutdown: {str(e)}")

# Đăng ký các routes
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(students.router, prefix="/api/students", tags=["Students"])
app.include_router(transactions.router, prefix="/api/transactions", tags=["Transactions"])

@app.get("/", tags=["Health Check"])
def root():
    return {
        "message": "Tuition Payment API",
        "version": "1.0",
        "status": "running"
    }

@app.get("/health", tags=["Health Check"])
async def health_check():
    try:
        # Kiểm tra kết nối database
        client.admin.command('ping')
        db_status = "connected"
    except Exception as e:
        db_status = f"error: {str(e)}"
    
    return {
        "status": "healthy",
        "database": db_status,
        "timestamp": datetime.utcnow().isoformat()
    }

# Remove the incorrect line that was here
