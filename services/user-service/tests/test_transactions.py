import pytest
from fastapi.testclient import TestClient
from app import app
from db import transactions_col, users_col, students_col, otp_col
from datetime import datetime, timedelta
from bson import ObjectId

client = TestClient(app)

@pytest.fixture
def test_data():
    # Tạo test user
    user_data = {
        "_id": ObjectId(),
        "username": "testuser",
        "hashedPassword": "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewKyNZhm2s5Q2e6u",
        "fullName": "Test User",
        "email": "test@example.com",
        "balance": 20000000
    }
    users_col.insert_one(user_data)

    # Tạo test student
    student_data = {
        "studentId": "52300001",
        "fullName": "Nguyen Van Test",
        "tuitionAmount": 15000000,
        "isPaid": False
    }
    students_col.insert_one(student_data)

    # Login để lấy token
    response = client.post(
        "/auth/login",
        data={
            "username": "testuser",
            "password": "123456"
        }
    )
    token = response.json()["access_token"]
    
    yield {
        "user_id": user_data["_id"],
        "student_id": student_data["studentId"],
        "auth_header": {"Authorization": f"Bearer {token}"}
    }
    
    # Cleanup
    users_col.delete_one({"_id": user_data["_id"]})
    students_col.delete_one({"studentId": student_data["studentId"]})
    transactions_col.delete_many({"userId": user_data["_id"]})
    otp_col.delete_many({"userId": user_data["_id"]})

def test_initiate_transaction(test_data):
    response = client.post(
        "/transactions/initiate",
        headers=test_data["auth_header"],
        json={
            "studentId": test_data["student_id"],
            "amount": 15000000
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "transactionId" in data
    assert "message" in data

def test_verify_otp(test_data):
    # Khởi tạo giao dịch
    init_response = client.post(
        "/transactions/initiate",
        headers=test_data["auth_header"],
        json={
            "studentId": test_data["student_id"],
            "amount": 15000000
        }
    )
    transaction_id = init_response.json()["transactionId"]
    
    # Lấy OTP từ database (trong thực tế sẽ gửi qua email)
    otp_record = otp_col.find_one({"transactionId": ObjectId(transaction_id)})
    
    # Xác thực OTP
    response = client.post(
        "/transactions/verify-otp",
        headers=test_data["auth_header"],
        json={
            "transaction_id": transaction_id,
            "otp_code": otp_record["code"]
        }
    )
    assert response.status_code == 200
    assert response.json()["status"] == "success"
    
    # Kiểm tra trạng thái giao dịch
    transaction = transactions_col.find_one({"_id": ObjectId(transaction_id)})
    assert transaction["status"] == "SUCCESS"
    
    # Kiểm tra số dư đã bị trừ
    user = users_col.find_one({"_id": test_data["user_id"]})
    assert user["balance"] == 5000000  # 20M - 15M
    
    # Kiểm tra học phí đã được đánh dấu là đã thanh toán
    student = students_col.find_one({"studentId": test_data["student_id"]})
    assert student["isPaid"] == True

def test_verify_invalid_otp(test_data):
    # Khởi tạo giao dịch
    init_response = client.post(
        "/transactions/initiate",
        headers=test_data["auth_header"],
        json={
            "studentId": test_data["student_id"],
            "amount": 15000000
        }
    )
    transaction_id = init_response.json()["transactionId"]
    
    # Thử xác thực với OTP sai
    response = client.post(
        "/transactions/verify-otp",
        headers=test_data["auth_header"],
        json={
            "transaction_id": transaction_id,
            "otp_code": "000000"
        }
    )
    assert response.status_code == 400

def test_transaction_history(test_data):
    response = client.get(
        "/transactions/history",
        headers=test_data["auth_header"]
    )
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)

def test_insufficient_balance(test_data):
    response = client.post(
        "/transactions/initiate",
        headers=test_data["auth_header"],
        json={
            "studentId": test_data["student_id"],
            "amount": 25000000  # Lớn hơn số dư 20M
        }
    )
    assert response.status_code == 400