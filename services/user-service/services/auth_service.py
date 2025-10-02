from datetime import datetime, timedelta
from passlib.context import CryptContext
from jose import jwt
from db import users_col
import os

# Đọc secret key từ .env
SECRET_KEY = os.getenv("SECRET_KEY", "mysecret")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# ----- Password Utils -----
def verify_password(password: str, hashed: str) -> bool:
    return pwd_context.verify(password, hashed)

# ----- JWT Utils -----
def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# ----- Auth Services -----
def authenticate_user(username: str, password: str):
    user = users_col.find_one({"username": username})
    if not user:
        return None
    if not verify_password(password, user["password"]):
        return None
    return user
