import pytest
from fastapi.testclient import TestClient
from app import app
from db import students_col, users_col
from datetime import datetime

client = TestClient(app)

@pytest.fixture
def test_student():
    student_data = {
        "studentId": "52300001",
        "fullName": "Nguyen Van Test",
        "tuitionAmount": 15000000,
        "isPaid": False,
        "createdAt": datetime.utcnow()
    }
    students_col.insert_one(student_data)
    yield student_data
    students_col.delete_one({"studentId": "52300001"})

@pytest.fixture
def auth_header():
    # Tạo user và lấy token
    user_data = {
        "username": "testuser",
        "hashedPassword": "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewKyNZhm2s5Q2e6u",
        "fullName": "Test User",
        "email": "test@example.com",
        "balance": 20000000
    }
    users_col.insert_one(user_data)
    
    response = client.post(
        "/auth/login",
        data={
            "username": "testuser",
            "password": "123456"
        }
    )
    token = response.json()["access_token"]
    yield {"Authorization": f"Bearer {token}"}
    users_col.delete_one({"username": "testuser"})

def test_get_student_tuition(test_student):
    response = client.get(f"/students/{test_student['studentId']}")
    assert response.status_code == 200
    data = response.json()
    assert data["studentId"] == test_student["studentId"]
    assert data["tuitionAmount"] == test_student["tuitionAmount"]

def test_get_nonexistent_student():
    response = client.get("/students/nonexistent")
    assert response.status_code == 404

def test_mark_tuition_as_paid(test_student, auth_header):
    response = client.put(
        f"/students/{test_student['studentId']}/mark-paid",
        headers=auth_header
    )
    assert response.status_code == 200
    
    # Verify database update
    updated_student = students_col.find_one({"studentId": test_student["studentId"]})
    assert updated_student["isPaid"] == True

def test_list_students_filter_paid(test_student):
    # Test unpaid filter
    response = client.get("/students?paid=false")
    assert response.status_code == 200
    data = response.json()
    assert len(data) > 0
    assert all(not student["isPaid"] for student in data)
    
    # Mark student as paid
    students_col.update_one(
        {"studentId": test_student["studentId"]},
        {"$set": {"isPaid": True}}
    )
    
    # Test paid filter
    response = client.get("/students?paid=true")
    assert response.status_code == 200
    data = response.json()
    assert len(data) > 0
    assert all(student["isPaid"] for student in data)