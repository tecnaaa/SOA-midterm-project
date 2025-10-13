import pytest
from fastapi.testclient import TestClient
from app import app
from db import users_col, students_col, transactions_col, otp_col
from datetime import datetime
from bson import ObjectId

@pytest.fixture(scope="session")
def client():
    return TestClient(app)

@pytest.fixture(autouse=True)
def cleanup_collections():
    # Setup - không cần làm gì
    yield
    # Cleanup sau mỗi test
    users_col.delete_many({})
    students_col.delete_many({})
    transactions_col.delete_many({})
    otp_col.delete_many({})

@pytest.fixture
def sample_user():
    user_data = {
        "_id": ObjectId(),
        "username": "testuser",
        "hashedPassword": "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewKyNZhm2s5Q2e6u",
        "fullName": "Test User",
        "email": "test@example.com",
        "phone": "0123456789",
        "balance": 20000000,
        "createdAt": datetime.utcnow()
    }
    users_col.insert_one(user_data)
    yield user_data
    users_col.delete_one({"_id": user_data["_id"]})

@pytest.fixture
def sample_student():
    student_data = {
        "studentId": "52300001",
        "fullName": "Nguyen Van Test",
        "tuitionAmount": 15000000,
        "isPaid": False,
        "createdAt": datetime.utcnow()
    }
    students_col.insert_one(student_data)
    yield student_data
    students_col.delete_one({"studentId": student_data["studentId"]})

@pytest.fixture
def auth_token(client, sample_user):
    response = client.post(
        "/auth/login",
        data={
            "username": sample_user["username"],
            "password": "123456"
        }
    )
    return response.json()["access_token"]

@pytest.fixture
def auth_headers(auth_token):
    return {"Authorization": f"Bearer {auth_token}"}