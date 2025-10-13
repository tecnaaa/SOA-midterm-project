import pytest
from fastapi.testclient import TestClient
from app import app
from db import users_col
from datetime import datetime

client = TestClient(app)

@pytest.fixture
def test_user():
    user_data = {
        "username": "testuser",
        "hashedPassword": "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewKyNZhm2s5Q2e6u",
        "fullName": "Test User",
        "email": "test@example.com",
        "phone": "0123456789",
        "balance": 1000000,
        "createdAt": datetime.utcnow()
    }
    users_col.insert_one(user_data)
    yield user_data
    users_col.delete_one({"username": "testuser"})

def test_login_success(test_user):
    response = client.post(
        "/auth/login",
        data={
            "username": "testuser",
            "password": "123456"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["username"] == test_user["username"]

def test_login_invalid_credentials():
    response = client.post(
        "/auth/login",
        data={
            "username": "testuser",
            "password": "wrongpassword"
        }
    )
    assert response.status_code == 401

def test_get_current_user(test_user):
    # Đăng nhập để lấy token
    login_response = client.post(
        "/auth/login",
        data={
            "username": "testuser",
            "password": "123456"
        }
    )
    token = login_response.json()["access_token"]
    
    # Test endpoint /me với token
    response = client.get(
        "/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["username"] == test_user["username"]

def test_unauthorized_access():
    response = client.get("/auth/me")
    assert response.status_code == 401