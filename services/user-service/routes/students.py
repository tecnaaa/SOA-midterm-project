import os
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import JSONResponse
from models import StudentInDB
from db import students_col
from routes.auth import get_current_user
from fastapi_limiter.depends import RateLimiter
import redis
import json
from datetime import datetime
import logging
from bson import ObjectId

router = APIRouter()

# Redis client for caching
redis_client = redis.from_url(os.getenv('REDIS_URL', 'redis://tuition-payment-redis:6379'))
CACHE_TTL = 300  # 5 minutes cache

def format_datetime(dt):
    """Format datetime object to ISO format string"""
    if dt is None:
        return None
    if isinstance(dt, str):
        try:
            dt = datetime.fromisoformat(dt.replace('Z', '+00:00'))
        except Exception:
            return None
    if isinstance(dt, datetime):
        return dt.isoformat()
    return None

def get_cached_student(student_id: str) -> dict:
    """Get student info from cache"""
    cache_key = f"student:{student_id}"
    cached = redis_client.get(cache_key)
    if cached:
        try:
            return json.loads(cached)
        except json.JSONDecodeError:
            return None
    return None

def set_cached_student(student_id: str, student_data: dict):
    """Set student info in cache"""
    cache_key = f"student:{student_id}"
    try:
        redis_client.setex(
            cache_key,
            CACHE_TTL,
            json.dumps(student_data, default=str)
        )
    except Exception as e:
        logging.error(f"Error caching student data: {str(e)}")

@router.get("/{student_id}")
async def get_student_tuition(student_id: str, current_user = Depends(get_current_user)):
    """Tra cứu thông tin học phí của sinh viên"""
    try:
        # Validate student_id format
        if not student_id.isdigit() or len(student_id) != 8:
            raise HTTPException(
                status_code=400,
                detail="MSSV không hợp lệ. MSSV phải có đúng 8 chữ số"
            )

        # Query database directly
        student = students_col.find_one({"studentId": student_id})
        logging.info(f"Found student data: {student}")
        
        if not student:
            raise HTTPException(
                status_code=404,
                detail="Không tìm thấy thông tin sinh viên"
            )

        # Convert MongoDB document to dict
        response_data = {
            "studentId": str(student["studentId"]),
            "fullName": str(student["fullName"]),
            "tuitionAmount": float(student["tuitionAmount"]),
            "isPaid": bool(student.get("isPaid", False)),
            "createdAt": None,
            "lastPaymentDate": None,
            "lastPaymentAmount": None
        }

        # Handle optional fields
        if student.get("createdAt"):
            response_data["createdAt"] = student["createdAt"].strftime("%Y-%m-%d") if isinstance(student["createdAt"], datetime) else str(student["createdAt"])
        
        if student.get("lastPaymentDate"):
            response_data["lastPaymentDate"] = student["lastPaymentDate"].strftime("%Y-%m-%d") if isinstance(student["lastPaymentDate"], datetime) else str(student["lastPaymentDate"])
        
        if student.get("lastPaymentAmount"):
            response_data["lastPaymentAmount"] = float(student["lastPaymentAmount"])

        # Return JSON response directly
        return JSONResponse(content=response_data)

    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error getting student info: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Lỗi hệ thống, vui lòng thử lại sau"
        )

@router.get("/", dependencies=[Depends(RateLimiter(times=5, seconds=60))])
async def list_students(paid: bool = None):
    """Liệt kê danh sách sinh viên và trạng thái học phí"""
    try:
        query = {}
        if paid is not None:
            query["isPaid"] = paid
            
        students = list(students_col.find(query))
        return [StudentInDB(**{
            "studentId": s["studentId"],
            "fullName": s["fullName"],
            "tuitionAmount": float(s["tuitionAmount"]),
            "isPaid": bool(s.get("isPaid", False)),
            "lastPaymentDate": format_datetime(s.get("lastPaymentDate")),
            "lastPaymentAmount": float(s["lastPaymentAmount"]) if s.get("lastPaymentAmount") else None,
            "createdAt": format_datetime(s.get("createdAt"))
        }) for s in students]
    except Exception as e:
        logging.error(f"Error in list_students: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Lỗi lấy danh sách sinh viên"
        )