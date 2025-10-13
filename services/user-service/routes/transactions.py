import os
from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks, Body
from models import TransactionInDB, TransactionBase, OTPInDB, StudentInDB
from pydantic import BaseModel
from db import transactions_col, users_col, students_col, otp_col
from routes.auth import get_current_user
from datetime import datetime, timedelta
from services.email_service import EmailService
from services.monitoring import track_transaction, track_otp_verification
import random
import string
from typing import Optional
import redis
import json
from bson import ObjectId
import logging

# Configure transaction logger
logger = logging.getLogger(__name__)
log_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'logs')
os.makedirs(log_dir, exist_ok=True)

file_handler = logging.FileHandler(os.path.join(log_dir, 'transactions.log'))
file_handler.setFormatter(logging.Formatter('%(asctime)s - %(levelname)s - %(message)s'))
logger.addHandler(file_handler)
logger.setLevel(logging.DEBUG)

router = APIRouter()
email_service = EmailService()

def get_redis_client():
    """Get Redis client with proper error handling"""
    try:
        redis_url = os.getenv('REDIS_URL', 'redis://tuition-payment-redis:6379')
        client = redis.from_url(redis_url, socket_timeout=5)
        client.ping()  # Test connection
        return client
    except (redis.ConnectionError, redis.TimeoutError) as e:
        logging.error(f"Redis connection error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Lỗi kết nối Redis, vui lòng thử lại sau"
        )
    except Exception as e:
        logging.error(f"Unexpected Redis error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Lỗi hệ thống, vui lòng thử lại sau"
        )

async def acquire_transaction_lock(student_id: str, timeout=60) -> bool:
    """Cố gắng lấy khóa phân tán cho một giao dịch sử dụng Redis"""
    try:
        client = get_redis_client()
        lock_key = f"transaction_lock:{student_id}"
        return client.set(lock_key, "locked", nx=True, ex=timeout)
    except HTTPException:
        return False

def release_transaction_lock(student_id: str):
    """Giải phóng khóa giao dịch từ Redis"""
    try:
        client = get_redis_client()
        lock_key = f"transaction_lock:{student_id}"
        client.delete(lock_key)
    except Exception as e:
        logging.error(f"Error releasing transaction lock: {str(e)}")
        # Continue even if we can't release the lock

def increment_otp_attempts(transaction_id: str) -> int:
    """Tăng và trả về số lần thử OTP"""
    try:
        client = get_redis_client()
        key = f"otp_attempts:{transaction_id}"
        return client.incr(key)
    except Exception:
        return 0  # Return 0 on error to allow the transaction to proceed

class TransactionInitiateRequest(BaseModel):
    studentId: str
    amount: float

class OTPVerifyRequest(BaseModel):
    transaction_id: str
    otp_code: str

class ResendOTPRequest(BaseModel):
    transaction_id: str

def generate_otp():
    """Tạo mã OTP ngẫu nhiên 6 chữ số"""
    return ''.join(random.choices(string.digits, k=6))

@router.post("/initiate")
async def initiate_transaction(
    request: TransactionInitiateRequest,
    background_tasks: BackgroundTasks,
    current_user = Depends(get_current_user)
):
    """Khởi tạo giao dịch và gửi mã OTP"""
    try:
        logging.info(f"[Transaction Initiate] Starting for student {request.studentId}")
        logging.debug(f"[Transaction Initiate] Request data: {request}")
        logging.debug(f"[Transaction Initiate] Current user: {current_user}")
        
        # Validate student_id format
        if not request.studentId.isdigit() or len(request.studentId) != 8:
            logging.warning(f"[Transaction Initiate] Invalid student ID format: {request.studentId}")
            raise HTTPException(
                status_code=400,
                detail="MSSV không hợp lệ. MSSV phải có đúng 8 chữ số"
            )
            
        # Kiểm tra giao dịch đang pending
        existing_pending = transactions_col.find_one({
            "studentId": request.studentId,
            "status": "PENDING",
            "createdAt": {"$gt": datetime.utcnow() - timedelta(minutes=15)}
        })
        if existing_pending:
            logging.warning(f"[Transaction Initiate] Found pending transaction for student {request.studentId}")
            raise HTTPException(
                status_code=409,
                detail="Đã có giao dịch đang chờ xử lý cho sinh viên này"
            )

        # Kiểm tra số dư với khóa phân tán
        user = users_col.find_one({"username": current_user.username})
        if not user:
            logging.error(f"[Transaction Initiate] User not found: {current_user.username}")
            raise HTTPException(status_code=404, detail="Không tìm thấy thông tin người dùng")
            
        if user.get("balance", 0) < request.amount:
            logging.warning(f"[Transaction Initiate] Insufficient balance: {user.get('balance', 0)} < {request.amount}")
            raise HTTPException(status_code=400, detail="Số dư không đủ")

        # Log request headers để debug CORS
        logging.debug(f"[Transaction Initiate] Request headers: {request.headers if hasattr(request, 'headers') else 'No headers'}")
        
        # Kiểm tra học phí sinh viên
        student = students_col.find_one({"studentId": request.studentId})
        if not student:
            logging.error(f"Student not found: {request.studentId}")
            raise HTTPException(status_code=404, detail="Không tìm thấy thông tin sinh viên")
            
        if student.get("isPaid", False):
            logging.warning(f"Tuition already paid for student {request.studentId}")
            raise HTTPException(status_code=400, detail="Học phí đã được thanh toán")
            
        if request.amount != student.get("tuitionAmount", 0):
            logging.warning(f"Amount mismatch: requested={request.amount}, required={student.get('tuitionAmount', 0)}")
            raise HTTPException(status_code=400, detail="Số tiền thanh toán phải bằng tổng học phí")

        # Tạo giao dịch mới với timeout
        transaction_dict = {
            "transactionId": str(ObjectId()),  # 🔥 thêm dòng này
            "userId": str(user["_id"]),
            "studentId": request.studentId,
            "amount": request.amount,
            "type": "TUITION_PAYMENT",
            "status": "PENDING",
            "createdAt": datetime.utcnow(),
            "expiresAt": datetime.utcnow() + timedelta(minutes=15)
        }
        
        transaction_id = None
        try:
            result = transactions_col.insert_one(transaction_dict)
            transaction_id = str(result.inserted_id)
            logging.info(f"Created transaction: {transaction_id}")
        except Exception as db_error:
            logging.error(f"Database error while creating transaction: {str(db_error)}", exc_info=True)
            raise HTTPException(
                status_code=500,
                detail="Không thể tạo giao dịch, vui lòng thử lại sau"
            )
        
        # Tạo và lưu mã OTP với thời hạn 5 phút
        otp = generate_otp()
        otp_dict = {
            "userId": str(user["_id"]),
            "code": otp,
            "transactionId": transaction_id,
            "expiresAt": datetime.utcnow() + timedelta(minutes=5),
            "isUsed": False,
            "attempts": 0,
            "maxAttempts": 3
        }
        
        try:
            otp_col.insert_one(otp_dict)
            logging.info(f"Created OTP for transaction: {transaction_id}")
        except Exception as otp_error:
            logging.error(f"Error creating OTP: {str(otp_error)}", exc_info=True)
            if transaction_id:
                transactions_col.delete_one({"_id": ObjectId(transaction_id)})
            raise HTTPException(
                status_code=500,
                detail="Không thể tạo mã OTP, vui lòng thử lại sau"
            )

        # Attempt to send OTP email, but don't fail if it doesn't work
        try:
            background_tasks.add_task(
                email_service.send_otp_email,
                user["email"],
                otp
            )
            logging.info(f"Scheduled OTP email for user: {user['email']}")
        except Exception as email_error:
            logging.error(f"Failed to schedule OTP email: {str(email_error)}", exc_info=True)
            # Don't raise an exception here, the transaction can still proceed
            
        return {
            "transactionId": transaction_id,
            "message": "Mã OTP đã được tạo. Nếu không nhận được email, vui lòng kiểm tra lại sau.",
            "expiresIn": 300  # 5 minutes in seconds
        }

    except HTTPException as he:
        raise he
    except Exception as e:
        logging.error(f"Unexpected error in initiate_transaction: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Đã xảy ra lỗi không mong muốn, vui lòng thử lại sau"
        )

@router.post("/verify-otp")
async def verify_transaction(
    request: OTPVerifyRequest,
    background_tasks: BackgroundTasks,
    current_user = Depends(get_current_user)
):
    """Xác thực OTP và hoàn tất giao dịch"""
    try:
        transaction_obj_id = ObjectId(request.transaction_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid transaction ID format")

    # Kiểm tra số lần thử OTP
    attempts = increment_otp_attempts(request.transaction_id)
    if attempts > 3:
        track_otp_verification('exceeded_attempts')
        raise HTTPException(
            status_code=400, 
            detail="Đã vượt quá số lần thử. Vui lòng tạo giao dịch mới."
        )

    # Kiểm tra OTP
    otp = otp_col.find_one({
        "transactionId": request.transaction_id,
        "code": request.otp_code,
        "isUsed": False,
        "expiresAt": {"$gt": datetime.utcnow()}
    })
    
    if not otp:
        track_otp_verification('invalid')
        raise HTTPException(
            status_code=400, 
            detail=f"Mã OTP không hợp lệ hoặc đã hết hạn. Còn {3-attempts} lần thử"
        )

    # Tìm và kiểm tra giao dịch
    transaction = transactions_col.find_one({
        "_id": transaction_obj_id,
        "expiresAt": {"$gt": datetime.utcnow()}
    })
    
    if not transaction:
        track_otp_verification('expired')
        raise HTTPException(
            status_code=404, 
            detail="Giao dịch không tồn tại hoặc đã hết hạn"
        )
    
    # Cố gắng lấy khóa giao dịch
    if not await acquire_transaction_lock(transaction["studentId"]):
        track_transaction('lock_failed')
        raise HTTPException(
            status_code=409, 
            detail="Đang có giao dịch khác được xử lý cho sinh viên này"
        )
    
    try:
        # Đánh dấu giao dịch đang xử lý
        transactions_col.update_one(
            {"_id": transaction_obj_id},
            {"$set": {"status": "PROCESSING"}}
        )
        
        # Kiểm tra và trừ tiền từ tài khoản với khóa phân tán
        user = users_col.find_one({"_id": ObjectId(current_user.id)})
        if user["balance"] < transaction["amount"]:
            track_transaction('insufficient_balance')
            raise HTTPException(status_code=400, detail="Số dư không đủ")
        
        # Kiểm tra học phí hiện tại
        student = students_col.find_one({"studentId": transaction["studentId"]})
        if not student:
            track_transaction('student_not_found')
            raise HTTPException(status_code=404, detail="Không tìm thấy thông tin sinh viên")
        
        if student.get("isPaid", False):
            track_transaction('already_paid')
            raise HTTPException(status_code=400, detail="Học phí đã được thanh toán")
        
        # Cập nhật số dư và trạng thái học phí
        completion_time = datetime.utcnow()
        
        result = users_col.find_one_and_update(
            {
                "_id": ObjectId(current_user.id),
                "balance": {"$gte": transaction["amount"]}
            },
            {"$inc": {"balance": -transaction["amount"]}},
            return_document=True
        )
        
        if not result:
            track_transaction('update_failed')
            raise HTTPException(
                status_code=400,
                detail="Không thể cập nhật số dư. Vui lòng thử lại."
            )
        
        students_col.update_one(
            {"studentId": transaction["studentId"]},
            {
                "$set": {
                    "isPaid": True,
                    "lastPaymentDate": completion_time,
                    "lastPaymentAmount": transaction["amount"]
                }
            }
        )
        
        # Cập nhật trạng thái giao dịch
        transactions_col.update_one(
            {"_id": transaction_obj_id},
            {
                "$set": {
                    "status": "SUCCESS",
                    "completedAt": completion_time
                }
            }
        )
        
        # Track successful transaction
        track_transaction('success', transaction["amount"])
        track_otp_verification('success')
        
        # Đánh dấu OTP đã sử dụng
        otp_col.update_one(
            {"_id": otp["_id"]},
            {"$set": {"isUsed": True}}
        )
        
        # Xóa key đếm số lần thử OTP
        try:
            client = get_redis_client()
            client.delete(f"otp_attempts:{request.transaction_id}")
        except Exception as e:
            logging.error(f"Error deleting OTP attempts key: {str(e)}")
            # Continue even if we can't delete the key
        
        # Gửi email xác nhận trong background
        transaction_data = {
            "transaction_id": str(transaction_obj_id),
            "student_id": transaction["studentId"],
            "amount": transaction["amount"],
            "completed_at": completion_time.strftime("%Y-%m-%d %H:%M:%S")
        }
        
        background_tasks.add_task(
            email_service.send_transaction_success_email,
            current_user.email,
            transaction_data
        )
        
        return {
            "status": "success",
            "message": "Thanh toán đã hoàn tất"
        }
        
    except Exception as e:
        # Rollback giao dịch nếu có lỗi
        transactions_col.update_one(
            {"_id": transaction_obj_id},
            {"$set": {"status": "FAILED"}}
        )
        
        # Track failed transaction
        track_transaction('failed')
        
        # Gửi email thông báo lỗi
        transaction_data = {
            "transaction_id": str(transaction_obj_id),
            "student_id": transaction["studentId"],
            "timestamp": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"),
            "error_message": str(e)
        }
        
        background_tasks.add_task(
            email_service.send_transaction_failed_email,
            current_user.email,
            transaction_data
        )
        
        raise HTTPException(status_code=500, detail=str(e))
        
    finally:
        # Luôn giải phóng khóa khi hoàn thành
        release_transaction_lock(transaction["studentId"])

@router.post("/resend-otp")
async def resend_otp(
    request: ResendOTPRequest,
    background_tasks: BackgroundTasks,
    current_user = Depends(get_current_user)
):
    """Kiểm tra và gửi lại mã OTP nếu cần"""
    try:
        # Kiểm tra giao dịch
        transaction = transactions_col.find_one({
            "_id": ObjectId(request.transaction_id),
            "status": "PENDING"
        })
        
        if not transaction:
            raise HTTPException(
                status_code=404,
                detail="Không tìm thấy giao dịch hoặc giao dịch không còn ở trạng thái chờ"
            )

        # Kiểm tra OTP hiện tại còn hiệu lực
        current_otp = otp_col.find_one({
            "transactionId": request.transaction_id,
            "isUsed": False,
            "expiresAt": {"$gt": datetime.utcnow()}
        })

        if current_otp:
            # Tính thời gian còn lại
            remaining_time = (current_otp["expiresAt"] - datetime.utcnow()).total_seconds()
            
            return {
                "message": f"Mã OTP đã được gửi, còn hiệu lực trong {int(remaining_time)} giây. Vui lòng kiểm tra email và nhập mã để xác nhận thanh toán.",
                "expiresIn": int(remaining_time),
                "isExisting": True
            }

        # Nếu không có OTP hiệu lực, tạo mới
        otp = generate_otp()
        otp_dict = {
            "userId": str(current_user.id),
            "code": otp,
            "transactionId": request.transaction_id,
            "expiresAt": datetime.utcnow() + timedelta(minutes=5),
            "isUsed": False,
            "attempts": 0,
            "maxAttempts": 3
        }
        
        otp_col.insert_one(otp_dict)
        
        # Gửi OTP qua email
        user = users_col.find_one({"_id": ObjectId(current_user.id)})
        background_tasks.add_task(
            email_service.send_otp_email,
            user["email"],
            otp
        )

        return {
            "message": "Mã OTP mới đã được gửi. Vui lòng kiểm tra email.",
            "expiresIn": 300,
            "isExisting": False
        }

    except Exception as e:
        logging.error(f"Error in resend_otp: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Đã xảy ra lỗi khi gửi lại mã OTP"
        )

@router.get("/history")
async def get_transaction_history(
    current_user = Depends(get_current_user),
    skip: int = 0,
    limit: int = 10
):
    """Lấy lịch sử giao dịch của người dùng với phân trang"""
    try:
        transactions = list(transactions_col.find(
            {"userId": str(current_user.id)},
            {"_id": 1, "studentId": 1, "amount": 1, "status": 1, "createdAt": 1, "completedAt": 1}
        ).sort("createdAt", -1).skip(skip).limit(limit))
        
        total = transactions_col.count_documents({"userId": str(current_user.id)})
        
        return {
            "transactions": transactions,
            "total": total,
            "page": skip // limit + 1,
            "pages": (total + limit - 1) // limit
        }
    except Exception as e:
        logging.error(f"Error fetching transaction history: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Không thể lấy lịch sử giao dịch"
        )

@router.get("/status/{transaction_id}")
async def get_transaction_status(
    transaction_id: str,
    current_user = Depends(get_current_user)
):
    """Kiểm tra trạng thái của một giao dịch"""
    try:
        transaction = transactions_col.find_one({"_id": ObjectId(transaction_id)})
        if not transaction:
            raise HTTPException(status_code=404, detail="Không tìm thấy giao dịch")
            
        return {
            "status": transaction["status"],
            "expiresAt": transaction.get("expiresAt"),
            "completedAt": transaction.get("completedAt")
        }
    except Exception as e:
        logging.error(f"Error checking transaction status: {str(e)}")
        raise HTTPException(status_code=500, detail="Không thể kiểm tra trạng thái giao dịch")

@router.get("/pending/{student_id}")
async def check_pending_transaction(
    student_id: str,
    current_user = Depends(get_current_user)
):
    """Kiểm tra giao dịch đang pending của sinh viên"""
    try:
        # Tìm giao dịch pending gần nhất
        transaction = transactions_col.find_one({
            "studentId": student_id,
            "status": "PENDING",
            "expiresAt": {"$gt": datetime.utcnow()}
        }, sort=[("createdAt", -1)])
        
        if not transaction:
            return {
                "hasPending": False
            }

        # Thêm thông tin userId vào response
        is_own_transaction = transaction["userId"] == str(current_user.id)
            
        # Kiểm tra OTP của giao dịch
        otp = otp_col.find_one({
            "transactionId": str(transaction["_id"]),
            "isUsed": False,
            "expiresAt": {"$gt": datetime.utcnow()}
        })
        
        # Kiểm tra số lần thử OTP
        try:
            client = get_redis_client()
            attempts = int(client.get(f"otp_attempts:{str(transaction['_id'])}") or 0)
        except Exception:
            attempts = 0
            
        remaining_time = (transaction["expiresAt"] - datetime.utcnow()).total_seconds()
        
        return {
            "hasPending": True,
            "transactionId": str(transaction["_id"]),
            "userId": transaction["userId"],
            "isOwnTransaction": is_own_transaction,
            "isExpired": remaining_time <= 0,
            "exceedAttempts": attempts >= 3,
            "remainingTime": max(0, remaining_time)
        }
    except Exception as e:
        logging.error(f"Error checking pending transaction: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Không thể kiểm tra giao dịch đang chờ"
        )

@router.get("/students/{student_id}/payment-status")
async def check_student_payment_status(
    student_id: str,
    current_user = Depends(get_current_user)
):
    """Kiểm tra trạng thái thanh toán của sinh viên"""
    try:
        student = students_col.find_one({"studentId": student_id})
        if not student:
            raise HTTPException(status_code=404, detail="Không tìm thấy thông tin sinh viên")
            
        return {
            "isPaid": student.get("isPaid", False),
            "lastPaymentDate": student.get("lastPaymentDate"),
            "lastPaymentAmount": student.get("lastPaymentAmount")
        }
    except Exception as e:
        logging.error(f"Error checking student payment status: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Không thể kiểm tra trạng thái thanh toán"
        )