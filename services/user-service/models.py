from datetime import datetime
from typing import Optional
from bson import ObjectId
from pydantic import BaseModel, Field, EmailStr, ConfigDict, validator
from bson.objectid import ObjectId

class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid objectid")
        return ObjectId(v)

    @classmethod
    def __get_pydantic_json_schema__(cls, field_schema):
        field_schema.update(type="string")
        return field_schema

class UserBase(BaseModel):
    username: str
    email: str
    fullName: str
    phone: str
    
    model_config = ConfigDict(populate_by_name=True)

class UserInDB(UserBase):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    hashedPassword: str
    balance: float = 0
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    
    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={
            ObjectId: str,
            datetime: lambda dt: dt.isoformat() if dt else None
        }
    )

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class UserResponse(UserBase):
    id: str
    balance: float

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class TokenData(BaseModel):
    username: Optional[str] = None

# Students
class StudentBase(BaseModel):
    studentId: str = Field(..., min_length=8, max_length=8, pattern="^[0-9]+$", description="Mã số sinh viên (8 chữ số)")
    fullName: str
    tuitionAmount: float = Field(..., ge=0)
    isPaid: bool = False
    
    @validator('studentId')
    def validate_student_id(cls, v):
        if not v.isdigit():
            raise ValueError('MSSV phải chỉ chứa các chữ số')
        if len(v) != 8:
            raise ValueError('MSSV phải có đúng 8 chữ số')
        return v
    
    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={
            datetime: lambda dt: dt.isoformat() if dt else None
        }
    )

class StudentInDB(StudentBase):
    lastPaymentDate: Optional[datetime] = None
    lastPaymentAmount: Optional[float] = None
    createdAt: Optional[datetime] = None

    @validator('createdAt', 'lastPaymentDate', pre=True)
    def parse_datetime(cls, value):
        if value is None:
            return None
        if isinstance(value, datetime):
            return value
        try:
            return datetime.fromisoformat(value.replace('Z', '+00:00'))
        except (AttributeError, ValueError):
            return None
    
    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={
            datetime: lambda dt: dt.isoformat() if dt else None,
            ObjectId: str
        }
    )

# Transactions
class TransactionBase(BaseModel):
    userId: str
    studentId: str
    amount: float = Field(..., ge=0)
    type: str = "TUITION_PAYMENT"
    
    model_config = ConfigDict(populate_by_name=True)

class TransactionInDB(TransactionBase):
    status: str = "PENDING"  # PENDING, PROCESSING, SUCCESS, FAILED
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    completedAt: Optional[datetime] = None
    
    model_config = ConfigDict(
        populate_by_name=True,
        json_schema_extra={
            "example": {
                "userId": "507f1f77bcf86cd799439011",
                "studentId": "52300001",
                "amount": 15000000,
                "type": "TUITION_PAYMENT",
                "status": "PENDING"
            }
        }
    )

# OTP
class OTPBase(BaseModel):
    userId: str
    code: str = Field(..., min_length=6, max_length=6)
    transactionId: str
    
    model_config = ConfigDict(populate_by_name=True)

class OTPInDB(OTPBase):
    isUsed: bool = False
    expiresAt: datetime
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    
    model_config = ConfigDict(
        populate_by_name=True,
        json_schema_extra={
            "example": {
                "userId": "507f1f77bcf86cd799439011",
                "code": "123456",
                "transactionId": "507f1f77bcf86cd799439012",
                "isUsed": False
            }
        }
    )