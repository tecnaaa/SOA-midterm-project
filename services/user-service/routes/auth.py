from fastapi import APIRouter, HTTPException, Depends, Form, BackgroundTasks
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from datetime import datetime, timedelta
from jose import jwt, JWTError
from passlib.context import CryptContext
from models import UserInDB
from db import users_col, otp_col
from services.monitoring import track_failed_login, track_request
import os
import logging
import sys
from fastapi_limiter.depends import RateLimiter
from services.email_service import EmailService
from random import randint

# Set up file logging
log_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'logs')
os.makedirs(log_dir, exist_ok=True)
log_file = os.path.join(log_dir, 'auth.log')

# Configure root logger
logging.basicConfig(
    level=logging.INFO,  # Chỉ log các thông tin quan trọng
    format='%(asctime)s - %(levelname)s - %(message)s'
)

# Configure module logger 
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

# Create handlers
file_handler = logging.FileHandler(log_file)
file_handler.setLevel(logging.ERROR)  # Chỉ log errors vào file
console_handler = logging.StreamHandler(sys.stdout)

# Create formatters and add it to handlers
log_format = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
file_handler.setFormatter(log_format)
console_handler.setFormatter(log_format)

# Add handlers to the logger
logger.addHandler(file_handler)
logger.addHandler(console_handler)

router = APIRouter()

# Security configuration
SECRET_KEY = os.getenv('SECRET_KEY', 'development-secret-key-change-in-production')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

# Initialize security
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

email_service = EmailService()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except Exception:
        return False

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=401,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError as e:
        logger.error(f"JWT validation error: {str(e)}")
        raise credentials_exception
        
    user = users_col.find_one({"username": username})
    if user is None:
        logger.warning(f"User not found in database: {username}")
        raise credentials_exception
    return UserInDB(**user)

@router.get("/hash-password/{password}")
async def hash_password(password: str):
    """Temporary route to hash password"""
    return {"hash": pwd_context.hash(password)}

@router.post("/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    """Process login request"""
    try:
        # Find user in database
        user = users_col.find_one(
            {"username": form_data.username},
            {"_id": 1, "username": 1, "hashedPassword": 1, "fullName": 1, "email": 1, "balance": 1}
        )
        
        if not user or not verify_password(form_data.password, user.get("hashedPassword", "")):
            raise HTTPException(
                status_code=401,
                detail="Thông tin đăng nhập không chính xác"
            )

        # Create access token
        access_token = create_access_token(data={"sub": user["username"]})
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "id": str(user["_id"]),
                "username": user["username"],
                "fullName": user["fullName"],
                "email": user["email"],
                "balance": user.get("balance", 0)
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail="Lỗi hệ thống, vui lòng thử lại sau"
        )

@router.post("/send-otp/{username}", dependencies=[Depends(RateLimiter(times=3, minutes=5))])
async def send_otp(username: str, current_user: UserInDB = Depends(get_current_user)):
    """Gửi mã OTP đến email của người dùng"""
    try:
        # Tìm user trong database
        user = users_col.find_one({"username": username})
        if not user:
            raise HTTPException(
                status_code=404,
                detail="Không tìm thấy thông tin người dùng"
            )
            
        # Kiểm tra quyền truy cập
        if current_user.username != username:
            raise HTTPException(
                status_code=403,
                detail="Không có quyền truy cập thông tin của người dùng khác"
            )
            
        # Tạo mã OTP ngẫu nhiên 6 số
        otp = str(randint(100000, 999999))
        
        # Lưu OTP vào database với thời hạn 5 phút
        otp_col.insert_one({
            "userId": user["_id"],
            "code": otp,
            "email": user["email"],
            "isUsed": False,
            "createdAt": datetime.utcnow(),
            "expiresAt": datetime.utcnow() + timedelta(minutes=5)
        })
        
        # Gửi OTP qua email
        if email_service.send_otp_email(user["email"], otp):
            return {"message": f"Đã gửi mã OTP đến email {user['email']}"}
        else:
            raise HTTPException(
                status_code=500,
                detail="Không thể gửi mã OTP. Vui lòng thử lại sau."
            )
            
    except Exception as e:
        logger.error(f"Error sending OTP: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Lỗi hệ thống, vui lòng thử lại sau"
        )

@router.get("/me")
async def read_users_me(current_user: UserInDB = Depends(get_current_user)):
    # Lấy thông tin mới nhất từ database
    fresh_user_data = users_col.find_one(
        {"username": current_user.username},
        {"_id": 1, "username": 1, "fullName": 1, "email": 1, "balance": 1}
    )
    
    if not fresh_user_data:
        raise HTTPException(
            status_code=404,
            detail="Không tìm thấy thông tin người dùng"
        )
    
    return {
        "id": str(fresh_user_data["_id"]),
        "username": fresh_user_data["username"],
        "fullName": fresh_user_data["fullName"],
        "email": fresh_user_data["email"],
        "balance": fresh_user_data.get("balance", 0)
    }
